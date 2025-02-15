import asyncio
import logging
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
        self, message: TaskMessage, websocket_manager=None, call_all=False
    ):
        print("message", message, flush=True)
        # Create a list of tasks to run concurrently
        tasks = []
        results = []

        for sp_info in self.in_memory_subprocesses.values():
            for fn_name, dependencies in sp_info["dependencies"].items():
                if (
                    call_all
                    or None in dependencies
                    or any(k in dependencies for k in message.content.keys())
                ):
                    # Send message to subprocess
                    sp_info["subprocess"].parent_conn.send(
                        {"type": "call", "fn_name": fn_name, "message": message}
                    )

                    # Create task for receiving response
                    task = asyncio.create_task(
                        self._handle_subprocess_response(
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
        print("results", results, flush=True)
        for r in results:
            if r["content"]:
                content.extend(r["content"])
        return {"content": content, "messageType": C.WS_IN_MEMORY_FN_RETURN}

    async def _handle_subprocess_response(
        self, msg_id, recv_fn, websocket_manager, results
    ):
        # Run the receive function in a thread
        result = await self.task_runner.run(recv_fn, [], RunType.THREAD)
        if result["status"] == "success":
            if websocket_manager is not None and result["content"]:
                await websocket_manager.send_message_to_requester(
                    msg_id, result["content"], result["messageType"]
                )
            else:
                results.append(result)

    async def add_custom_fns(self, code_graph, to_cache):
        for c in code_graph:
            subprocess_key = c["subprocess_key"]
            module_name = c["module_name"]
            sp = self.in_memory_subprocesses.get(subprocess_key, {}).get("subprocess")
            if not sp:
                logger.debug(f"Creating new subprocess for {module_name}")
                sp = SettaInMemoryFnSubprocess(self.stop_event, self.websockets)
                self.in_memory_subprocesses[subprocess_key] = {
                    "subprocess": sp,
                    "dependencies": {},
                }

            sp.parent_conn.send(
                {
                    "type": "import",
                    "code": c["code"],
                    "module_name": module_name,
                    "to_cache": to_cache,
                }
            )
            result = await self.task_runner.run(sp.parent_conn.recv, [], RunType.THREAD)
            sp_info = self.in_memory_subprocesses[subprocess_key]

            if result["status"] == "success":
                sp_info["dependencies"].update(result["content"])
            else:
                # TODO: store error message and display on frontend?
                pass

        print(sp_info["dependencies"].values())
        all_dependencies = set.union(*sp_info["dependencies"].values())
        initial_result = await self.call_in_memory_subprocess_fn(
            TaskMessage(id=create_new_id(), content={}), call_all=True
        )

        logger.debug(
            f"self.in_memory_subprocesses keys: {self.in_memory_subprocesses.keys()}"
        )

        return all_dependencies, initial_result["content"]

    def close(self):
        self.stop_event.set()
        for v in self.in_memory_subprocesses.values():
            v["subprocess"].close()
