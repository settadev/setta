import asyncio
import importlib.util
import logging
import multiprocessing
import queue
import sys
import threading
import traceback
import uuid

from setta.tasks.fns.utils import TaskDefinition
from setta.utils.constants import CWD
from setta.utils.utils import nested_access

logger = logging.getLogger(__name__)


def import_code_from_string(code_string, module_name=None, add_to_sys_modules=True):
    # Generate a unique module name if one isn't provided
    if module_name is None:
        module_name = f"setta_dynamic_module_{uuid.uuid4().hex}"

    # Add current directory to sys.path if it's not already there
    current_dir = str(CWD)
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)

    spec = importlib.util.spec_from_loader(module_name, loader=None)

    # Create a new module based on the spec
    module = importlib.util.module_from_spec(spec)

    # Optionally add the module to sys.modules
    if add_to_sys_modules:
        print(f"adding {module_name} to sys.modules", flush=True)
        sys.modules[module_name] = module

    # Compile the code string
    code_object = compile(code_string, module_name, "exec")

    # Execute the compiled code object in the module's namespace
    exec(code_object, module.__dict__)

    return module


class SettaInMemoryFnSubprocess:
    def __init__(self, stop_event, websockets, start_method):
        logger.debug(
            f"Creating SettaInMemoryFnSubprocess using {start_method} start_method"
        )
        ctx = multiprocessing.get_context(start_method)
        self.parent_conn, self.child_conn = ctx.Pipe()
        self.process = ctx.Process(target=self._subprocess_main)
        self.stdout_parent_conn, self.stdout_child_conn = ctx.Pipe()
        self.process.daemon = True  # Ensure process dies with parent
        self.process.start()

        self.stop_event = asyncio.Event()
        self.tasks_stop_event = stop_event
        self.websockets = websockets
        self.stdout_queue = queue.Queue()
        self.stdout_processor_task = None
        self.stdout_thread = threading.Thread(target=self.stdout_listener, daemon=True)
        self.stdout_thread.start()

        if len(self.websockets) > 0:
            self.start_stdout_processor_task()

    def _subprocess_main(self):
        """Main loop in subprocess that handles all requests"""
        # Initialize store for imported modules
        fns_dict = {}
        cache = {}

        class OutputCapture:
            def __init__(self, stdout_pipe):
                self.stdout_pipe = stdout_pipe

            def write(self, text):
                self.stdout_pipe.send(text)

            def flush(self):
                pass

        # Redirect stdout as soon as subprocess starts
        output_capture = OutputCapture(self.stdout_child_conn)
        sys.stdout = output_capture
        sys.stderr = output_capture

        while True:
            msg = self.child_conn.recv()  # Wait for requests
            msg_type = msg["type"]
            return_message_type = None

            if msg_type == "shutdown":
                break

            try:
                if msg_type == "import":
                    dependencies = {}
                    for to_import in msg["imports"]:
                        code = to_import["code"]
                        module_name = to_import["module_name"]
                        # Import and store module
                        module = import_code_from_string(code, module_name)
                        added_fn_names = add_fns_from_module(
                            fns_dict, module, module_name
                        )
                        for k in added_fn_names:
                            cache[k] = msg["exporter_obj"]
                            dependencies[k] = get_task_metadata(fns_dict[k], cache[k])

                    self.child_conn.send(
                        {
                            "status": "success",
                            "content": dependencies,
                        }
                    )

                elif msg_type == "call":
                    result, return_message_type = self.call_imported_fn(
                        msg, fns_dict, cache
                    )
                    self.child_conn.send(
                        {
                            "status": "success",
                            "content": result,
                            "messageType": return_message_type,
                        }
                    )

                elif msg_type == "call_with_new_exporter_obj":
                    # replace old exporter_obj
                    cache[msg["fn_name"]] = msg["other_data"]["exporter_obj"]
                    result, return_message_type = self.call_imported_fn(
                        msg, fns_dict, cache
                    )
                    self.child_conn.send(
                        {
                            "status": "success",
                            "content": result,
                            "messageType": return_message_type,
                        }
                    )

            except Exception as e:
                traceback.print_exc()
                self.child_conn.send(
                    {
                        "status": "error",
                        "error": str(e),
                        "messageType": return_message_type,
                    }
                )

    def call_imported_fn(self, msg, fns_dict, cache):
        fn_name = msg["fn_name"]
        message = self.process_message(fn_name, msg["message"], cache)
        fn = fns_dict[fn_name]
        result = fn.fn(message)
        return_message_type = fn.return_message_type
        return result, return_message_type

    def close(self):
        try:
            logger.debug("Initiating shutdown sequence")
            self.parent_conn.send({"type": "shutdown"})
            self.process.join(timeout=2)  # Add timeout to process join

            if self.process.is_alive():
                logger.debug("Process still alive after timeout, forcing termination")
                self.process.terminate()
                self.process.join(timeout=1)
        except Exception as e:
            logger.debug(f"Error during process shutdown: {e}")

        # Set stop event before closing pipes
        self.stop_event.set()

        # Close all connections
        for conn in [
            self.parent_conn,
            self.child_conn,
            self.stdout_parent_conn,
            self.stdout_child_conn,
        ]:
            conn.close()

        self.stdout_thread.join(timeout=2)  # Add timeout to thread join

        if self.stdout_thread.is_alive():
            logger.debug("Stdout thread failed to terminate within timeout")

        if self.stdout_processor_task:
            self.stdout_processor_task.cancel()

    def process_message(self, fn_name, message, cache):
        if fn_name in cache:
            exporter_obj = cache[fn_name]
            for k, v in message.content.items():
                nice_str = exporter_obj.var_name_mapping.get(k)
                if not nice_str:
                    continue
                p_dict, key = nested_access(exporter_obj.output, nice_str)
                p_dict[key] = v
            message.content = exporter_obj.output
        return message.content

    def start_stdout_processor_task(self):
        if self.stdout_processor_task is None or self.stdout_processor_task.done():
            self.stdout_processor_task = asyncio.create_task(
                self.process_stdout_queue()
            )

    async def stop_stdout_processor_task(self):
        if self.stdout_processor_task and not self.stdout_processor_task.done():
            self.stdout_processor_task.cancel()
            try:
                await self.stdout_processor_task
            except asyncio.CancelledError:
                pass
            self.stdout_processor_task = None

    async def process_stdout_queue(self):
        while not self.should_stop():
            try:
                if self.should_stop():
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
                if self.should_stop():
                    break
                logger.debug(f"Error processing stdout: {e}")

    def stdout_listener(self):
        while not self.should_stop():
            if self.stdout_parent_conn.poll(0.1):  # Check for data with timeout
                try:
                    stdout_data = self.stdout_parent_conn.recv()
                    self.stdout_queue.put(stdout_data)
                except EOFError:  # Pipe was closed
                    break
                except Exception as e:
                    logger.debug(f"Error in stdout listener: {e}")
                    if self.should_stop():
                        break
            else:  # No data available within timeout
                if self.should_stop():
                    break

    def should_stop(self):
        return self.stop_event.is_set() or self.tasks_stop_event.is_set()


def add_fns_from_module(fns_dict, module, module_name=None):
    count = 1
    added_fn_names = []
    for attr in vars(module).values():
        if isinstance(attr, TaskDefinition):
            if not attr.name:
                if not module_name:
                    raise ValueError(
                        "Either TaskDefinition must be initialized with a name, or task_name must be specified"
                    )
                attr.name = f"{module_name}-{count}"
                count += 1
            fns_dict[attr.name] = attr
            added_fn_names.append(attr.name)
    return added_fn_names


def get_task_metadata(in_memory_fn, exporter_obj):
    # None means run the task on every change
    if in_memory_fn.dependencies is None:
        dependencies = set([None])
    # Empty array means only run when the task imported.
    # Non-empty array means run when specified dependencies update.
    else:
        dependencies = set(
            exporter_obj.var_name_reverse_mapping[d] for d in in_memory_fn.dependencies
        )
    return dependencies
