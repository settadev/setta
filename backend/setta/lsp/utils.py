import logging

from setta.utils.constants import C

from .file_watcher import LSPFileWatcher
from .reader import LanguageServerReader
from .server import LanguageServer
from .specific_file_watcher import SpecificFileWatcher
from .writer import LanguageServerWriter

logger = logging.getLogger(__name__)


def create_lsps(
    workspace_folder,
    code_folder,
    settings,
):
    return {
        "full": LanguageServer(
            workspace_folder=workspace_folder,
            code_folder=code_folder,
            settings=settings,
            name="full",
        ),
        "basic": LanguageServer(
            workspace_folder=code_folder,
            code_folder=code_folder,
            settings={},
            name="basic",
        ),
    }


def create_lsp_writers(lsps):
    return {
        k: LanguageServerWriter(v, use_virtual_files=k == "basic")
        for k, v in lsps.items()
    }


def create_lsp_readers(lsps, websocket_manager):
    return {k: LanguageServerReader(v, websocket_manager) for k, v in lsps.items()}


def create_file_watcher(lsps, lsp_writers):
    file_watcher = LSPFileWatcher(lsp_writers["full"].send_did_change_watched_files)
    file_watcher.add_workspace_folder(lsps["full"].workspace_folder)
    return file_watcher


def create_specific_file_watcher(websocket_manager):
    async def callback(event_info):
        logger.debug(f"callback {event_info}")
        await websocket_manager.broadcast(
            {
                "content": event_info,
                "messageType": C.WS_SPECIFIC_FILE_WATCHER_UPDATE,
            }
        )

    return SpecificFileWatcher(callback)


async def start_lsps(lsps, lsp_readers, lsp_writers):
    for k, v in lsps.items():
        await v.start_server()
        await lsp_readers[k].start_listener()
        await lsp_writers[k].send_initialize_request()


async def kill_lsps(lsps, lsp_readers):
    for k, v in lsps.items():
        await lsp_readers[k].stop()  # Wait for reader to finish
        v.kill_server()


async def restart_lsps(lsps, lsp_readers, lsp_writers):
    await kill_lsps(lsps, lsp_readers)
    await start_lsps(lsps, lsp_readers, lsp_writers)
