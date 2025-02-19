import asyncio
import copy
import logging
import time
from typing import Dict

from setta.database.utils import create_new_id
from setta.utils.constants import C

from . import fns
from .fns.utils import TaskDefinition, TaskMessage
from .task_runner import RunType, TaskRunner
from .utils import SettaInMemoryFnSubprocess, add_fns_from_module

logger = logging.getLogger(__name__)


class Tasks:
    def __init__(self, lsp_writers):
        self.lsp_writers = lsp_writers
        self.task_runner = TaskRunner()
        self.cache = {}
        self.fns: Dict[str, TaskDefinition] = {}
        self.in_memory_subprocesses = {}
        self.websockets = []
        self.stop_event = asyncio.Event()
        add_fns_from_module(self.fns, fns)

    async def connect(self, websocket):
        # Accept the new connection
        await websocket.accept()
        self.websockets.append(websocket)
        for k, v in self.in_memory_subprocesses.items():
            v["subprocess"].start_stdout_processor_task()
            logger.debug(f"listening to subprocess {k}")

    async def disconnect(self, websocket):
        self.websockets.remove(websocket)
        if len(self.websockets) == 0:
            for v in self.in_memory_subprocesses.values():
                await v["subprocess"].stop_stdout_processor_task()

    async def __call__(
        self, message_type, message: TaskMessage, websocket_manager=None
    ):
        if message_type == "inMemoryFn":
            return await self.call_in_memory_subprocess_fn(message, websocket_manager)
        return await self.call_regular_fn(message_type, message)

    async def call_regular_fn(self, fn_name, message: TaskMessage):
        fn = self.fns[fn_name]
        fn.read_cache(self.cache, message)
        fn_args = [message, *(getattr(self, k) for k in fn.server_dependencies)]
        result = await self.task_runner.run(fn.fn, fn_args, fn.run_as)
        fn.write_cache(self.cache, message, result)
        if result is None:
            result = {}
        result["messageType"] = fn.return_message_type
        return result

    async def call_in_memory_subprocess_fn(
        self,
        message: TaskMessage,
        websocket_manager=None,
        call_all=False,
        subprocess_key=None,
    ):
        # Create a list of tasks to run concurrently
        tasks = []
        results = []

        for sp_key, sp_info in self.in_memory_subprocesses.items():
            if subprocess_key and sp_key != subprocess_key:
                continue
            for fn_name, fnInfo in sp_info["fnInfo"].items():
                if (
                    call_all
                    or None in fnInfo["dependencies"]
                    or any(k in fnInfo["dependencies"] for k in message.content.keys())
                ):
                    # Send message to subprocess
                    sp_info["subprocess"].parent_conn.send(
                        {"type": "call", "fn_name": fn_name, "message": message}
                    )

                    # Create task for receiving response
                    task = asyncio.create_task(
                        self._handle_subprocess_response(
                            sp_key,
                            fn_name,
                            message.id,
                            sp_info["subprocess"].parent_conn.recv,
                            websocket_manager,
                            results,
                        )
                    )
                    tasks.append(task)

        # Wait for all tasks to complete concurrently
        if tasks:
            await asyncio.gather(*tasks)

        if websocket_manager:
            return {}

        content = []
        for r in results:
            if r["content"]:
                content.extend(r["content"])
        return {"content": content, "messageType": C.WS_IN_MEMORY_FN_RETURN}

    async def _handle_subprocess_response(
        self, subprocess_key, fn_name, msg_id, recv_fn, websocket_manager, results
    ):
        # Run the receive function in a thread
        start_time = time.perf_counter()
        result = await self.task_runner.run(recv_fn, [], RunType.THREAD)
        elapsed_time = time.perf_counter() - start_time
        if result["status"] == "success":
            self.update_average_subprocess_fn_time(
                subprocess_key, fn_name, elapsed_time
            )
            if websocket_manager is not None:
                if result["content"]:
                    await websocket_manager.send_message_to_requester(
                        msg_id, result["content"], result["messageType"]
                    )
                await self.maybe_send_latest_run_time_info(
                    subprocess_key, fn_name, msg_id, websocket_manager
                )
            else:
                results.append(result)

    async def add_custom_fns(self, code_graph, to_cache):
        for c in code_graph:
            subprocess_key = c["subprocess_key"]
            sp = self.in_memory_subprocesses.get(subprocess_key, {}).get("subprocess")
            if sp:
                sp.close()
            sp = SettaInMemoryFnSubprocess(
                self.stop_event, self.websockets, c["subprocessStartMethod"]
            )
            self.in_memory_subprocesses[subprocess_key] = {
                "subprocess": sp,
                "fnInfo": {},
            }

            sp.parent_conn.send(
                {
                    "type": "import",
                    "imports": c["imports"],
                    "to_cache": to_cache,
                }
            )
            result = await self.task_runner.run(sp.parent_conn.recv, [], RunType.THREAD)
            fnInfo = self.in_memory_subprocesses[subprocess_key]["fnInfo"]

            if result["status"] == "success":
                for k, v in result["content"].items():
                    if k not in fnInfo:
                        fnInfo[k] = {
                            "dependencies": set(),
                            "averageRunTime": None,
                            "callCount": 0,
                            "lastStatsUpdate": time.time(),
                        }
                    fnInfo[k]["dependencies"].update(v)
            else:
                # TODO: store error message and display on frontend?
                pass

        initial_result = await self.call_in_memory_subprocess_fn(
            TaskMessage(id=create_new_id(), content={}),
            call_all=True,
            subprocess_key=subprocess_key,
        )

        logger.debug(
            f"self.in_memory_subprocesses keys: {self.in_memory_subprocesses.keys()}"
        )

        return initial_result["content"]

    def close(self):
        self.stop_event.set()
        for v in self.in_memory_subprocesses.values():
            v["subprocess"].close()

    def update_average_subprocess_fn_time(self, subprocess_key, fn_name, new_time):
        fnInfo = self.in_memory_subprocesses[subprocess_key]["fnInfo"][fn_name]
        current_avg = fnInfo["averageRunTime"]
        new_avg = (
            new_time
            if current_avg is None
            else ((0.9) * current_avg) + (0.1 * new_time)
        )
        fnInfo["averageRunTime"] = new_avg
        fnInfo["callCount"] += 1
        fnInfo["lastStatsUpdate"] = time.time()

    async def maybe_send_latest_run_time_info(
        self, subprocess_key, fn_name, msg_id, websocket_manager
    ):
        fnInfo = self.in_memory_subprocesses[subprocess_key]["fnInfo"][fn_name]
        if fnInfo["callCount"] % 10 == 0 or (
            fnInfo["lastStatsUpdate"] and (time.time() - fnInfo["lastStatsUpdate"]) > 10
        ):
            newInfo = self.getInMemorySubprocessInfo()
            await websocket_manager.send_message_to_requester(
                msg_id, newInfo, C.WS_IN_MEMORY_FN_AVG_RUN_TIME
            )

    def getInMemorySubprocessInfo(self):
        output = {}
        for sp_key, sp_info in self.in_memory_subprocesses.items():
            output[sp_key] = {"fnInfo": copy.deepcopy(sp_info["fnInfo"])}
            for fnInfo in output[sp_key]["fnInfo"].values():
                fnInfo["dependencies"] = list(fnInfo["dependencies"])
        return output
