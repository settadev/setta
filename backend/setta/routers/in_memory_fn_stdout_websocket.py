from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from setta.utils.constants import C

from .dependencies import get_tasks_from_websocket

router = APIRouter()


@router.websocket(C.ROUTE_IN_MEMORY_FN_STDOUT_WEBSOCKET)
async def in_memory_fn_stdout(
    websocket: WebSocket,
    tasks=Depends(get_tasks_from_websocket),
):
    await tasks.connect(websocket)
    try:
        while True:
            # Keep the connection alive by waiting for the client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        await tasks.disconnect(websocket)
