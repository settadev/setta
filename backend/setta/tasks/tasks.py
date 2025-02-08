import asyncio
import logging
from typing import Dict

from setta.database.utils import create_new_id

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
            v.start_stdout_processor_task()
            logger.debug(f"listening to subprocess {k}")

    async def disconnect(self, websocket):
        self.websockets.remove(websocket)
        if len(self.websockets) == 0:
            for v in self.in_memory_subprocesses.values():
                await v.stop_stdout_processor_task()

    async def __call__(self, fn_name, message: TaskMessage):
        if fn_name in self.fns:
            return await self.call_regular_fn(fn_name, message)
        return await self.call_in_memory_subprocess_fn(fn_name, message)

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

    async def call_in_memory_subprocess_fn(self, fn_name, message: TaskMessage):
        sp = self.in_memory_subprocesses[fn_name]
        sp.parent_conn.send({"type": "call", "fn_name": fn_name, "message": message})
        result = await self.task_runner.run(sp.parent_conn.recv, [], RunType.THREAD)
        if result["status"] != "success":
            result["content"] = {}

        return {"content": result["content"], "messageType": result["messageType"]}

    # TODO: pass in dependency graph
    # Create a separate subprocess for each "root" of the graph (i.e. code blocks that aren't imported by other code blocks)
    async def add_custom_fns(self, code_graph, to_cache):
        error_msgs = {}
        task_metadata = {}
        initial_content = []
        for c in code_graph:
            subprocess_key = f'{c["project_config_id"]}-{c["section_id"]}'
            module_name = c["module_name"]
            sp = self.in_memory_subprocesses.get(subprocess_key)
            if not sp:
                logger.debug(f"Creating new subprocess for {module_name}")
                sp = SettaInMemoryFnSubprocess(self.stop_event, self.websockets)
                self.in_memory_subprocesses[subprocess_key] = sp

            sp.parent_conn.send(
                {
                    "type": "import",
                    "code": c["code"],
                    "module_name": module_name,
                    "to_cache": to_cache,
                }
            )
            result = await self.task_runner.run(sp.parent_conn.recv, [], RunType.THREAD)
            if result["status"] == "success":
                task_metadata.update(result["content"])
            else:
                error_msgs[module_name] = result["error"]

        for k in task_metadata.keys():
            task_output = await self(k, TaskMessage(id=create_new_id(), content={}))
            initial_content.extend(task_output["content"])

        logger.debug(
            f"self.in_memory_subprocesses keys: {self.in_memory_subprocesses.keys()}"
        )
        return task_metadata, error_msgs, initial_content

    def close(self):
        self.stop_event.set()
        for v in self.in_memory_subprocesses.values():
            v.close()
