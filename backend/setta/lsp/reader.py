import asyncio
import json
import logging

from setta.lsp.reader_fns.completion import process_completion_response
from setta.lsp.reader_fns.definition import process_definition_response
from setta.lsp.reader_fns.diagnostics import process_diagnostics_response
from setta.lsp.reader_fns.documentHighlight import process_document_highlight_response
from setta.lsp.reader_fns.references import process_references_response
from setta.lsp.reader_fns.signatureHelp import process_signature_help_response
from setta.utils.constants import C

from .server import LanguageServerInteractor

logger = logging.getLogger(__name__)


class LanguageServerReader(LanguageServerInteractor):
    def __init__(self, server, websocket_manager):
        self.server = server
        self.websocket_manager = websocket_manager
        self.stop_event = asyncio.Event()
        self.started = asyncio.Event()
        self.reader_task = None

    async def start_listener(self):
        logger.debug(f"Starting {self.server.name} language server reader")
        self.stop_event.clear()  # Reset the stop event
        self.reader_task = asyncio.create_task(self.read_response())
        await self.started.wait()

    async def stop(self):
        logger.debug(f"Stopping {self.server.name} language server reader")
        self.stop_event.set()
        self.started.clear()
        if self.reader_task:
            self.reader_task.cancel()
            try:
                await self.reader_task
            except asyncio.CancelledError:
                pass

    async def read_response(self):
        self.started.set()
        while not self.stop_event.is_set():
            try:
                await self.read_and_process_message()
            except Exception as e:
                logging.error(f"Error reading from language server: {e}")
                # Optional: add a small delay to prevent tight loop if there's a persistent error
                await asyncio.sleep(0.1)

    async def read_and_process_message(self):
        headers = b""
        while not self.stop_event.is_set():
            chunk = await self.server.stdout.read(1)
            if not chunk:
                # Server stdout closed/EOF reached
                self.stop_event.set()  # Signal to stop
                return
            headers += chunk
            if headers.endswith(b"\r\n\r\n"):
                break

        if self.stop_event.is_set():
            return

        headers_str = headers.decode("utf-8")
        header_parts = headers_str.split("\r\n")
        content_length = 0
        for header in header_parts:
            if header.startswith("Content-Length:"):
                content_length = int(header.split(":")[1].strip())
                break

        response = b""
        while len(response) < content_length and not self.stop_event.is_set():
            chunk = await self.server.stdout.read(content_length - len(response))
            if not chunk:
                # Server stdout closed/EOF reached
                self.stop_event.set()  # Signal to stop
                return
            response += chunk

        if self.stop_event.is_set():
            return

        try:
            response = json.loads(response.decode("utf-8"))
            await self.process_response(response)
        except json.JSONDecodeError as e:
            logger.debug(f"Error decoding JSON response: {e}")
            return
        except Exception as e:
            logger.debug(f"Error processing response: {e}")
            return

    async def process_response(self, response):
        logger.debug(f"Processing response: {response}")
        id = response.get("id", None)
        method = response.get("method", None)
        if id:
            output = self.process_response_with_id(id, method, response)
        else:
            output = self.process_response_without_id(method, response)

        if id in self.pending_requests:
            self.pending_requests[id].set_result(output["content"])
        elif output["websocket_method"] == "return_to_requester":
            await self.websocket_manager.send_message_to_requester(
                output["websocket_return_id"], output["content"]
            )
        elif output["websocket_method"] == "broadcast":
            await self.websocket_manager.broadcast(
                {
                    "messageType": output["websocket_message_type"],
                    "content": output["content"],
                }
            )

    def process_response_with_id(self, id, method, response):
        metadata = self.msg_id_to_metadata.pop(id, {})
        method = method if method else metadata["method"]
        content = None
        websocket_return_id = id
        websocket_method = None
        websocket_message_type = None
        if (
            not self.server.is_initialized
            and id == self.server.initialization_request_id
        ):
            self.server.is_initialized = True
            content = "Initialized"
            websocket_method = "broadcast"
            websocket_message_type = C.WS_LSP_STATUS
        elif method == "textDocument/completion":
            content = process_completion_response(response, metadata)
            websocket_method = "return_to_requester"
        elif method == "textDocument/signatureHelp":
            content = process_signature_help_response(response)
            websocket_method = "return_to_requester"
        elif method == "textDocument/references":
            content, websocket_return_id = process_references_response(
                response, metadata
            )
            websocket_method = "return_to_requester"
        elif method == "textDocument/documentHighlight":
            content, websocket_return_id = process_document_highlight_response(
                response, metadata
            )
            websocket_method = "return_to_requester"
        elif method == "textDocument/definition":
            content = process_definition_response(response)
            websocket_method = "return_to_requester"

        content = {"data": content, "otherData": metadata.get("otherData")}

        return {
            "content": content,
            "websocket_return_id": websocket_return_id,
            "websocket_method": websocket_method,
            "websocket_message_type": websocket_message_type,
        }

    def process_response_without_id(self, method, response):
        content = None
        websocket_return_id = None
        websocket_method = None
        websocket_message_type = None

        if method == "textDocument/publishDiagnostics":
            content, needsDiagnostics = process_diagnostics_response(
                response, self.get_code_metadata
            )
            if needsDiagnostics:
                websocket_method = "broadcast"
                websocket_message_type = C.WS_LSP_DIAGNOSTICS

        return {
            "content": content,
            "websocket_return_id": websocket_return_id,
            "websocket_method": websocket_method,
            "websocket_message_type": websocket_message_type,
        }
