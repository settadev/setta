import json
import logging
import traceback

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from setta.utils.constants import C

from .dependencies import get_tasks_from_websocket, get_websocket_manager_from_websocket

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket(C.ROUTE_WEBSOCKET_MANAGER)
async def websocket_endpoint(
    websocket: WebSocket,
    websocket_manager=Depends(get_websocket_manager_from_websocket),
    tasks=Depends(get_tasks_from_websocket),
):
    id = await websocket_manager.connect(websocket)
    while True:
        try:
            data = await websocket.receive_text()
            await websocket_manager.send_message(
                json.loads(data), fromWebsocketId=id, tasks=tasks
            )
        except WebSocketDisconnect:
            logger.debug("WebSocketDisconnect!")
            await websocket_manager.disconnect(id)
            break
        except Exception as e:
            logger.debug(f"Exception details:\n{traceback.format_exc()}")
            logger.debug(e)
            logger.debug("caught the exception!")
