import asyncio
import inspect
import logging
import traceback
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from enum import Enum

logger = logging.getLogger(__name__)


class RunType(Enum):
    SUBPROCESS = "SUBPROCESS"
    THREAD = "THREAD"
    NONE = "NONE"


class TaskRunner:
    def __init__(self):
        self.thread_executor = ThreadPoolExecutor(max_workers=2)
        self.process_executor = ProcessPoolExecutor(max_workers=2)

    async def run(self, fn, fn_args, run_as):
        logger.debug(f"TaskRunner running function {fn.__name__} with run_as={run_as}")
        try:
            if inspect.iscoroutinefunction(fn):
                return await fn(*fn_args)

            if run_as == RunType.NONE:
                return fn(*fn_args)
            elif run_as == RunType.THREAD:
                executor = self.thread_executor
            elif run_as == RunType.SUBPROCESS:
                executor = self.process_executor

            return await asyncio.get_running_loop().run_in_executor(
                executor, fn, *fn_args
            )
        except Exception as e:
            logger.error(f"Error in TaskRunner.run: {str(e)}")
            traceback.print_exc()
            raise
