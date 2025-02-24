import asyncio
import logging
import sys
from pathlib import Path

import click
import uvicorn

from . import __version__
from .cli.connect import connect as _connect
from .database.db_init import maybe_create_tables_and_seed
from .database.db_objs import DBQueue, get_default_db_path
from .database.export_db.export_db import export_database
from .database.import_db import import_database
from .utils.constants import SETTA_FILES_FOLDER, C, set_constants


@click.command()
@click.argument("websocket_id", required=False)
@click.option("--host", default=C.DEFAULT_HOST, help="backend host")
@click.option("--port", default=C.DEFAULT_PORT, help="backend port")
def connect(websocket_id, host, port):
    set_constants(host=host, port=port)
    asyncio.run(_connect(websocket_id))


@click.command()
def version():
    print(f"setta version {__version__}")


@click.command()
@click.argument(
    "path",
    type=click.Path(file_okay=True, dir_okay=False, writable=True),
    required=True,
)
@click.option("--with_examples", is_flag=True)
def init_db(path, with_examples):
    dbq = DBQueue(path)
    maybe_create_tables_and_seed(dbq, with_examples)


@click.command()
@click.argument("path", default=get_default_db_path(), required=False)
@click.option("--raw", is_flag=True, help="Export raw database format")
@click.option("--readable", is_flag=True, help="Export in human-readable format")
@click.option(
    "--readable-with-variants",
    is_flag=True,
    help="Export in readable format with variants",
)
def export_db(path, raw, readable, readable_with_variants):
    # If no export options are specified, default to raw format
    if not any([raw, readable, readable_with_variants]):
        readable_with_variants = True

    export_database(path, raw, readable, readable_with_variants)


@click.command()
@click.argument("yaml_path", required=True)
@click.argument("output_path", required=True)
def import_db(yaml_path, output_path):
    import_database(yaml_path, output_path)


@click.group(
    invoke_without_command=True,
    context_settings=dict(
        ignore_unknown_options=True,
    ),
)
@click.option("--reload", is_flag=True)
@click.option("--with-examples", is_flag=True)
@click.option("--db", "-d", type=str, default=get_default_db_path())
@click.option("--host", default=C.DEFAULT_HOST, help="backend host")
@click.option("--port", default=C.DEFAULT_PORT, help="backend port")
@click.option(
    "--log-level",
    type=click.Choice(
        ["critical", "error", "warning", "info", "debug"], case_sensitive=False
    ),
    default="critical",
    help="Set the logging level",
)
@click.pass_context
def cli(ctx, reload, with_examples, db, host, port, log_level):
    if ctx.invoked_subcommand is None:
        print("Starting Setta", flush=True)

        SETTA_FILES_FOLDER.mkdir(parents=True, exist_ok=True)

        set_constants(
            with_examples=with_examples,
            db_path=db,
            host=host,
            port=port,
        )

        sys.path.append(str(Path(__file__).resolve().parent))

        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format="%(levelname)s - %(asctime)s - %(name)s - %(message)s",
        )

        config = uvicorn.Config(
            "server:app",
            host=host,
            port=port,
            log_level=log_level,
            reload=reload,
        )
        server = uvicorn.Server(config)

        server.run()


cli.add_command(connect)
cli.add_command(version)
cli.add_command(init_db)
cli.add_command(export_db)
cli.add_command(import_db)
