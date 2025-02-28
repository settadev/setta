import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from setta.database.db_init import maybe_create_tables_and_seed
from setta.database.db_objs import DBQueue
from setta.database.settings_file import SettingsFile
from setta.lsp.utils import (
    create_file_watcher,
    create_lsp_readers,
    create_lsp_writers,
    create_lsps,
    create_specific_file_watcher,
    kill_lsps,
    start_lsps,
)
from setta.routers import (
    artifact_router,
    code_info_router,
    in_memory_fn_stdout_router,
    interactive_code_router,
    lsp_router,
    projects_router,
    reference_renaming_router,
    sections_router,
    settings_router,
    terminals_router,
    websocket_router,
)
from setta.tasks.tasks import Tasks
from setta.terminals.terminals import TerminalWebsockets
from setta.utils.constants import CODE_FOLDER, CWD, USER_SETTINGS, C
from setta.utils.utils import get_absolute_path, is_dev_mode
from setta.utils.websocket_manager import WebsocketManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.state.settings_file = SettingsFile()
    app.state.lsps = create_lsps(
        workspace_folder=CWD,
        code_folder=CODE_FOLDER / "temp_folder",
        settings=USER_SETTINGS["languageServer"],
    )
    app.state.lsp_writers = create_lsp_writers(app.state.lsps)
    app.state.file_watcher = create_file_watcher(app.state.lsps, app.state.lsp_writers)
    app.state.terminal_websockets = TerminalWebsockets()
    app.state.websocket_manager = WebsocketManager()
    app.state.specific_file_watcher = create_specific_file_watcher(
        app.state.websocket_manager
    )
    app.state.tasks = Tasks(app.state.lsp_writers)
    app.state.lsp_readers = create_lsp_readers(
        app.state.lsps, app.state.websocket_manager
    )
    app.state.dbq = DBQueue(
        C.DB_PATH,
    )

    maybe_create_tables_and_seed(
        app.state.dbq,
        with_examples=C.WITH_EXAMPLES,
        with_base_ui_types=True,
    )

    app.state.dbq.connect()
    await start_lsps(
        app.state.lsps,
        app.state.lsp_readers,
        app.state.lsp_writers,
    )
    app.state.file_watcher.start()
    app.state.specific_file_watcher.start()

    if not is_dev_mode():
        # Mount the 'frontend/dist' directory at '/static'
        frontend_folder = Path("static/frontend")
        dist_path = get_absolute_path(__file__, frontend_folder)
        app.mount(
            "/static",
            StaticFiles(directory=dist_path, html=True),
            name="static",
        )

        # {full_path:path} is to catch all paths not explicitly covered here
        @app.get("/{full_path:path}", response_class=HTMLResponse)
        async def read_root(full_path: str):
            # Adjust the path to match the location of your 'index.html'
            with open(dist_path / "index.html") as f:
                content = f.read()
            return content

    print(f"Ready: {C.BACKEND}", flush=True)
    try:
        yield
    finally:
        app.state.tasks.close()
        app.state.file_watcher.stop()
        app.state.specific_file_watcher.stop()
        await kill_lsps(app.state.lsps, app.state.lsp_readers)


app = FastAPI(
    lifespan=lifespan,
    openapi_url=f"{C.ROUTE_PREFIX}{C.ROUTE_OPENAPI_DOCS}",
    docs_url=f"{C.ROUTE_PREFIX}{C.ROUTE_SWAGGER_DOCS}",
    redoc_url=f"{C.ROUTE_PREFIX}{C.ROUTE_REDOC_DOCS}",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=C.FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

kwargs = {"prefix": C.ROUTE_PREFIX}
app.include_router(projects_router, **kwargs)
app.include_router(sections_router, **kwargs)
app.include_router(terminals_router, **kwargs)
app.include_router(websocket_router, **kwargs)
app.include_router(code_info_router, **kwargs)
app.include_router(settings_router, **kwargs)
app.include_router(interactive_code_router, **kwargs)
app.include_router(artifact_router, **kwargs)
app.include_router(reference_renaming_router, **kwargs)
app.include_router(in_memory_fn_stdout_router, **kwargs)
app.include_router(lsp_router, **kwargs)


# https://github.com/tiangolo/fastapi/issues/3361#issuecomment-1002120988
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
    logging.error(f"{request}: {exc_str}")
    content = {"status_code": 10422, "message": exc_str, "data": None}
    return JSONResponse(
        content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )
