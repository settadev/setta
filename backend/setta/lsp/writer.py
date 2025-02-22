import asyncio
import json
import logging
import uuid

from setta.utils.utils import recursive_dict_merge

from .server import LanguageServerInteractor

logger = logging.getLogger(__name__)


class LanguageServerWriter(LanguageServerInteractor):
    def __init__(self, server, use_virtual_files):
        self.server = server
        self.use_virtual_files = use_virtual_files

    async def send_request(self, method, params, id=None):
        request_dict = {"jsonrpc": "2.0", "method": method, "params": params}
        if id:
            request_dict["id"] = id
            self.msg_id_to_metadata[id]["method"] = method

        request = json.dumps(request_dict).encode("utf-8")
        content_length = len(request)
        header = f"Content-Length: {content_length}\r\n\r\n".encode("utf-8")
        self.server.stdin.write(header + request)
        await self.server.stdin.drain()
        logger.debug(f"Sent {method} with params: {params}")

    async def send_initialize_request(self):
        params = {
            "capabilities": {
                "workspace": {"didChangeWatchedFiles": {"dynamicRegistration": True}}
            },
            "workspaceFolders": [{"uri": self.get_workspace_uri()}],
        }
        request_id = str(uuid.uuid4())
        self.server.initialization_request_id = request_id
        await self.send_request("initialize", params=params, id=request_id)
        await self.send_didChangeConfiguration()  # pyright requires this step

    async def send_document_open_request(
        self,
        code_id,
        code,
        codeJson=None,
        ref_template_var_positions=None,
        needsDiagnostics=False,
        projectConfigId=None,
        codeSectionId=None,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        if uri not in self.code_metadata:
            if not virtual:
                self.create_or_update_temp_file(code_id, code)
            params = {
                "textDocument": {
                    "uri": uri,
                    "languageId": "python",
                    "version": self.get_new_version_number(
                        uri,
                        code,
                        codeJson,
                        ref_template_var_positions,
                        needsDiagnostics,
                        projectConfigId,
                        codeSectionId,
                    ),
                    "text": code,
                }
            }
            logger.debug(f"send_document_open_request {uri}")
            await self.send_request("textDocument/didOpen", params=params)
        else:
            logger.debug(f"document already open, updating it {uri}")
            await self.send_document_update(
                code_id=code_id,
                code=code,
                codeJson=codeJson,
                ref_template_var_positions=ref_template_var_positions,
                needsDiagnostics=needsDiagnostics,
                projectConfigId=projectConfigId,
                codeSectionId=codeSectionId,
                virtual=virtual,
            )

    async def send_autocomplete_request(
        self,
        line,
        character,
        code_id,
        request_id,
        referencable_var_names,
        generated_var_names,
        cursor_offset,
        otherData=None,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {"uri": uri},
            "position": {"line": line, "character": character},
        }
        self.msg_id_to_metadata[request_id][
            "referencable_var_names"
        ] = referencable_var_names
        self.msg_id_to_metadata[request_id]["generated_var_names"] = generated_var_names
        self.msg_id_to_metadata[request_id]["cursor_offset"] = cursor_offset
        self.msg_id_to_metadata[request_id]["otherData"] = otherData
        self.msg_id_to_metadata[request_id]["code"] = self.get_code_metadata(uri)[
            "code"
        ]
        await self.send_request(
            "textDocument/completion",
            params=params,
            id=request_id,
        )

    async def send_signature_help_request(
        self, line, character, code_id, request_id, otherData=None, virtual=None
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {"uri": uri},
            "position": {"line": line, "character": character},
            "context": {"triggerKind": 2, "triggerCharacter": "("},
        }
        self.msg_id_to_metadata[request_id]["otherData"] = otherData
        await self.send_request(
            "textDocument/signatureHelp",
            params=params,
            id=request_id,
        )

    async def send_document_highlight_request(
        self,
        line,
        character,
        code_id,
        request_id,
        return_id,
        num_messages,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {"uri": uri},
            "position": {"line": line, "character": character},
        }
        self.msg_id_to_metadata[request_id]["return_id"] = return_id
        self.msg_id_to_metadata[request_id]["num_messages"] = num_messages
        self.msg_id_to_metadata[request_id]["code"] = self.get_code_metadata(uri)[
            "code"
        ]
        await self.send_request(
            "textDocument/documentHighlight",
            params=params,
            id=request_id,
        )

    async def send_didChangeConfiguration(self):
        # THIS FORMAT WORKS
        # hardcoded_settings = {
        #     "basedpyright": {"analysis": {"exclude": ["setta_code"]}}
        # }
        hardcoded_settings = {}
        settings = recursive_dict_merge(hardcoded_settings, self.settings)

        await self.send_request(
            "workspace/didChangeConfiguration",
            params={"settings": settings},
        )

    async def send_document_update(
        self,
        code_id,
        code,
        codeJson,
        ref_template_var_positions=None,
        needsDiagnostics=False,
        projectConfigId=None,
        codeSectionId=None,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        if not virtual:
            self.create_or_update_temp_file(code_id, code)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {
                "uri": uri,
                "version": self.get_new_version_number(
                    uri,
                    code,
                    codeJson,
                    ref_template_var_positions,
                    needsDiagnostics,
                    projectConfigId,
                    codeSectionId,
                ),
            },
            "contentChanges": [{"text": code}],
        }
        await self.send_request("textDocument/didChange", params=params)

    async def send_reference_request(
        self,
        position_offset,
        line,
        character,
        code_id,
        request_id,
        return_id,
        num_messages,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {
                "uri": uri,
            },
            "position": {"line": line, "character": character},
            "context": {"includeDeclaration": False},
        }
        self.msg_id_to_metadata[request_id]["position_offset"] = position_offset
        self.msg_id_to_metadata[request_id]["return_id"] = return_id
        self.msg_id_to_metadata[request_id]["num_messages"] = num_messages
        self.msg_id_to_metadata[request_id]["code"] = self.get_code_metadata(uri)[
            "code"
        ]
        await self.send_request("textDocument/references", params=params, id=request_id)

    async def send_definition_request(
        self,
        line,
        character,
        code_id,
        request_id,
        virtual=None,
    ):
        virtual = self.get_is_virtual(virtual)
        uri = self.get_uri(code_id, virtual)
        params = {
            "textDocument": {"uri": uri},
            "position": {"line": line, "character": character},
        }
        await self.send_request(
            "textDocument/definition",
            params=params,
            id=request_id,
        )

    async def send_did_change_watched_files(self, changes):
        params = {"changes": changes}
        await self.send_request("workspace/didChangeWatchedFiles", params=params)

    def create_asyncio_task(self, async_task, request_id, local=False):
        if local:
            self.pending_requests[request_id] = asyncio.Future()
        asyncio.create_task(async_task)

    def get_workspace_uri(self):
        return self.workspace_folder.as_uri()

    def get_code_id_path(self, code_id):
        return self.code_folder / f"{code_id}.py"

    def get_base_uri(self, code_id):
        return self.get_code_id_path(code_id).as_uri()

    # https://github.com/microsoft/language-server-protocol/issues/1676
    def get_uri(self, code_id, virtual):
        uri = self.get_base_uri(code_id)
        if virtual:
            uri = uri.replace("file://", "untitled:", 1)
        return uri

    def get_is_virtual(self, virtual):
        return virtual if virtual is not None else self.use_virtual_files

    def create_temp_file(self, code_id, code):
        """Create a temporary file for the given code and return its path."""
        # Create all necessary parent directories
        file_path = self.get_code_id_path(code_id)
        logger.debug(f"Creating temporary file {file_path}")
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the code to the file
        file_path.write_text(code)

        # Store the path for later cleanup
        self.temp_files[code_id] = file_path
        return file_path

    def create_or_update_temp_file(self, code_id, code):
        if code_id in self.temp_files:
            self.temp_files[code_id].write_text(code)
        else:
            self.create_temp_file(code_id, code)
