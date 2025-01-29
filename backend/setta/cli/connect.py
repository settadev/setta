import json
import logging
import subprocess

import websockets

from setta.code_gen.create_runnable_scripts import runCode

from ..utils.constants import C

logger = logging.getLogger(__name__)


async def connect(websocket_id):
    try:
        extra_headers = {"isCLI": True}
        if websocket_id:
            extra_headers["websocketId"] = websocket_id
        async with websockets.connect(
            C.WEBSOCKET,
            extra_headers=extra_headers,
        ) as websocket:
            await consumer_handler(websocket)
    except websockets.ConnectionClosedError:
        logger.debug("Connection closed unexpectedly")
    except ConnectionRefusedError:
        logger.debug("Connection refused")


async def consumer_handler(websocket):
    async for message in websocket:
        message = json.loads(message)
        if message["messageType"] == C.WS_RUN_CODE:
            # TODO: now that runCode requires lsp_writers
            # this will have to be changed, probably needs to communicate
            # with host setta process via websocket instead of calling
            # runCode
            command = await runCode(message)
            run_code_as_subprocess(command)


def run_code_as_subprocess(command):
    subprocess.run(command, shell=True)
