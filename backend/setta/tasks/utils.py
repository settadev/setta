import importlib.util
import json
import multiprocessing
import sys
import traceback
import uuid

from setta.tasks.fns.utils import TaskDefinition
from setta.utils.constants import CWD
from setta.utils.utils import nested_access


def import_code_from_string(code_string, module_name=None, add_to_sys_modules=True):
    # Generate a unique module name if one isn't provided
    if module_name is None:
        module_name = f"setta_dynamic_module_{uuid.uuid4().hex}"

    # Add current directory to sys.path if it's not already there
    current_dir = CWD
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
    def __init__(self):
        self.parent_conn, self.child_conn = multiprocessing.Pipe()
        self.process = multiprocessing.Process(target=self._subprocess_main)
        self.stdout_parent_conn, self.stdout_child_conn = multiprocessing.Pipe()
        self.process.daemon = True  # Ensure process dies with parent
        self.process.start()

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
                    code = msg["code"]
                    module_name = msg["module_name"]
                    # Import and store module
                    module = import_code_from_string(code, module_name)
                    added_fn_names = add_fns_from_module(fns_dict, module, module_name)
                    task_metadata = {}
                    for k in added_fn_names:
                        cache[k] = msg["to_cache"]
                        task_metadata[k] = get_task_metadata(fns_dict[k], cache[k])

                    self.child_conn.send(
                        {
                            "status": "success",
                            "content": task_metadata,
                        }
                    )

                elif msg_type == "call":
                    fn_name = msg["fn_name"]
                    message = self.process_message(fn_name, msg["message"], cache)
                    fn = fns_dict[fn_name]
                    result = fn.fn(message)
                    return_message_type = fn.return_message_type

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

    def close(self):
        try:
            self.parent_conn.send({"type": "shutdown"})
            self.process.join(timeout=1.0)
        except:
            pass

        if self.process.is_alive():
            self.process.terminate()
            self.process.join()

        # Close both sets of connections
        self.parent_conn.close()
        self.child_conn.close()
        self.stdout_parent_conn.close()
        self.stdout_child_conn.close()

    def process_message(self, fn_name, message, cache):
        if fn_name in cache:
            exporter_obj = cache[fn_name]
            for k, v in message.content.items():
                nice_str = exporter_obj.var_name_mapping[tuple(json.loads(k))]
                p_dict, key = nested_access(exporter_obj.output, nice_str)
                p_dict[key] = v
            message.content = exporter_obj.output
        return message.content


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
        dependencies = None
    # Empty array means only run when the task imported.
    # Non-empty array means run when specified dependencies update.
    else:
        dependencies = [
            exporter_obj.var_name_reverse_mapping[d] for d in in_memory_fn.dependencies
        ]
    return {"dependencies": dependencies}
