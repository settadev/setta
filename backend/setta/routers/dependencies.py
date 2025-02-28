from fastapi import Request, WebSocket


def get_dbq(request: Request):
    return request.app.state.dbq


def get_tasks(request: Request):
    return request.app.state.tasks


def get_tasks_from_websocket(websocket: WebSocket):
    return websocket.app.state.tasks


def get_settings_file(request: Request):
    return request.app.state.settings_file


def get_terminal_websockets(request: Request):
    return request.app.state.terminal_websockets


def get_terminal_websockets_from_websocket(websocket: WebSocket):
    return websocket.app.state.terminal_websockets


def get_websocket_manager(request: Request):
    return request.app.state.websocket_manager


def get_websocket_manager_from_websocket(websocket: WebSocket):
    return websocket.app.state.websocket_manager


def get_lsps(request: Request):
    return [
        request.app.state.lsps,
        request.app.state.lsp_readers,
        request.app.state.lsp_writers,
    ]


def get_lsp_writers(request: Request):
    return request.app.state.lsp_writers


def get_lsp_writers_from_websocket(websocket: WebSocket):
    return websocket.app.state.lsp_writers


def get_specific_file_watcher(request: Request):
    return request.app.state.specific_file_watcher
