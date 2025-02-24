import os

from setta.utils.constants import USER_SETTINGS

from ..db_objs import DBQueue
from .export_raw import export_raw
from .export_readable import export_readable


def _export_database(
    db, filename, raw=True, readable=True, readable_with_variants=True
):
    if not raw and not readable and not readable_with_variants:
        return
    filename = os.path.splitext(os.path.basename(filename))[0]
    if raw:
        export_raw(db, filename)
    if readable:
        export_readable(db, filename, with_variants=False)
    if readable_with_variants:
        export_readable(db, filename, with_variants=True)


def export_database(path, raw, readable, readable_with_variants):
    # Connect to the SQLite database
    dbq = DBQueue(path)
    dbq.connect()
    with dbq as db:
        # Export the database, including schema and data, to JSON and YAML
        _export_database(db, path, raw, readable, readable_with_variants)
    dbq.disconnect()


def maybe_export_database(db, path):
    _export_database(
        db,
        path,
        raw=USER_SETTINGS["backend"]["exportDbRawOnSave"],
        readable=USER_SETTINGS["backend"]["exportDbReadableOnSave"],
        readable_with_variants=USER_SETTINGS["backend"][
            "exportDbReadableWithVariantsOnSave"
        ],
    )
