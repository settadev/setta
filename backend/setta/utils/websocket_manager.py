import json
import logging

from fastapi import WebSocket
from websockets.exceptions import ConnectionClosedError

from setta.tasks.fns.utils import TaskMessage
from setta.utils.constants import C
from setta.utils.generate_memorable_string import generate_memorable_string

logger = logging.getLogger(__name__)


# https://fastapi.tiangolo.com/advanced/websockets/#handling-disconnections-and-multiple-clients
class WebsocketManager:
    def __init__(self):
        self.sockets = {}
        self.server_cli_id = "main"
        self.message_id_to_sender_id = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        id = websocket.headers.get("websocketId")
        while (not id) or id in self.sockets:
            id = generate_memorable_string()
        self.sockets[id] = {
            "websocket": websocket,
            "isCLI": websocket.headers.get("isCLI", False),
            "location": None,
        }
        await self.broadcast_connections()
        return id

    async def disconnect(self, id):
        try:
            del self.sockets[id]
            await self.broadcast_connections()
        except ConnectionClosedError:
            pass

    async def send_message(self, message, fromWebsocketId, tasks):
        if "toWebsocketId" in message:
            if "id" in message:
                self.message_id_to_sender_id[message["id"]] = fromWebsocketId
            wid = message["toWebsocketId"]
            if wid == self.server_cli_id:
                # process task and send any results back to requester
                result = await tasks(
                    message["messageType"],
                    TaskMessage.parse_obj(message),
                    websocket_manager=self,
                )
                if "content" in result:
                    websocket = self.sockets[fromWebsocketId]["websocket"]
                    await websocket.send_text(
                        json.dumps(
                            {
                                "id": message["id"],
                                "content": result["content"],
                                "messageType": result["messageType"],
                            }
                        )
                    )
            else:
                # just send data to target websocket
                websocket = self.sockets[wid]["websocket"]
                await websocket.send_text(json.dumps(message))

        if "location" in message:
            self.sockets[fromWebsocketId]["location"] = message["location"]

    async def send_message_to_requester(self, id, content, messageType=None):
        # just send data to target websocket
        websocket = self.sockets[self.message_id_to_sender_id[id]]["websocket"]
        return_val = {"id": id, "content": content}
        if messageType:
            return_val["messageType"] = messageType
        await websocket.send_text(json.dumps(return_val))

    async def send_message_to_location(self, content, messageType, location):
        for w in self.sockets.values():
            if w["location"] == location:
                websocket = w["websocket"]
                await websocket.send_text(
                    json.dumps({"content": content, "messageType": messageType})
                )

    async def broadcast(self, message):
        logger.debug(f"broadcasting message {message}")
        for s in self.sockets.values():
            logger.debug(f"sending to {s}")
            await s["websocket"].send_text(json.dumps(message))

    async def broadcast_connections(self):
        connections = []
        for id, s in self.sockets.items():
            connections.append({"websocketId": id, "isCLI": s["isCLI"]})
        connections.append({"websocketId": self.server_cli_id, "isCLI": True})
        await self.broadcast(
            {"messageType": C.WS_ALL_CONNECTIONS, "connections": connections}
        )
