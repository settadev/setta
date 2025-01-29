import asyncio
import logging
import queue
import threading
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
        self.in_memory_subprocess = SettaInMemoryFnSubprocess()
        self.websockets = []  # Store the websocket connections
        add_fns_from_module(self.fns, fns)

        # Start stdout listener thread
        self._stop_event = asyncio.Event()
        self.stdout_queue = queue.Queue()  # regular Queue
        self._stdout_processor_task = None
        self.stdout_thread = threading.Thread(target=self._stdout_listener, daemon=True)
        self.stdout_thread.start()

    # Backend Changes (Tasks class)
    async def connect(self, websocket):
        # Accept the new connection
        await websocket.accept()
        self.websockets.append(websocket)

        # Start the processor task if it's not running
        if self._stdout_processor_task is None or self._stdout_processor_task.done():
            self._stdout_processor_task = asyncio.create_task(
                self._process_stdout_queue()
            )

    async def disconnect(self, websocket):
        self.websockets.remove(websocket)
        if len(self.websockets) == 0:
            # Cancel the processor task
            if self._stdout_processor_task and not self._stdout_processor_task.done():
                self._stdout_processor_task.cancel()
                try:
                    await self._stdout_processor_task
                except asyncio.CancelledError:
                    pass
                self._stdout_processor_task = None

    def _stdout_listener(self):
        while not self._stop_event.is_set():
            try:
                stdout_data = self.in_memory_subprocess.stdout_parent_conn.recv()
                self.stdout_queue.put(stdout_data)  # simple put, no async needed
            except Exception as e:
                if self._stop_event.is_set():
                    break
                logger.debug(f"Error in stdout listener: {e}")

    async def _process_stdout_queue(self):
        while not self._stop_event.is_set():
            try:
                if self._stop_event.is_set():
                    break
                if len(self.websockets) > 0:
                    stdout_data = self.stdout_queue.get_nowait()
                    stdout_data = stdout_data.replace("\n", "\r\n")
                    for w in self.websockets:
                        await w.send_text(stdout_data)
                    self.stdout_queue.task_done()
            except queue.Empty:
                await asyncio.sleep(0.1)  # Check for connection every 100ms
            except asyncio.CancelledError:
                break
            except Exception as e:
                if self._stop_event.is_set():
                    break
                logger.debug(f"Error processing stdout: {e}")

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
        self.in_memory_subprocess.parent_conn.send(
            {"type": "call", "fn_name": fn_name, "message": message}
        )
        result = await self.task_runner.run(
            self.in_memory_subprocess.parent_conn.recv, [], RunType.THREAD
        )
        # if result["status"] == "success":
        # for x in result["content"]:
        # x.setdefault("sectionType", default_section_type(x["type"]))
        if result["status"] != "success":
            result["content"] = {}

        return {"content": result["content"], "messageType": result["messageType"]}

    async def add_custom_fns(self, code_list, to_cache):
        error_msgs = {}
        task_metadata = {}
        initial_content = []
        for c in code_list:
            # Send import request to subprocess
            self.in_memory_subprocess.parent_conn.send(
                {
                    "type": "import",
                    "code": c["code"],
                    "module_name": c["module_name"],
                    "to_cache": to_cache,
                }
            )
            result = await self.task_runner.run(
                self.in_memory_subprocess.parent_conn.recv, [], RunType.THREAD
            )
            if result["status"] == "success":
                task_metadata.update(result["content"])
            else:
                error_msgs[c["module_name"]] = result["error"]

        for k in task_metadata.keys():
            task_output = await self(k, TaskMessage(id=create_new_id(), content={}))
            initial_content.extend(task_output["content"])

        return task_metadata, error_msgs, initial_content

    def close(self):
        self._stop_event.set()
        self.in_memory_subprocess.close()
        self.stdout_thread.join()
        if self._stdout_processor_task:
            self._stdout_processor_task.cancel()
