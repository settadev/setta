from setta.utils.constants import CONSTANTS_FOLDER
from setta.utils.utils import get_absolute_path

from .seed import seed


def create_tables(db):
    with open(
        get_absolute_path(__file__, CONSTANTS_FOLDER / "db_init.sql"), "r"
    ) as sql_file:
        sql_script = sql_file.read()
        db.executescript(sql_script)


def seed_data_exist(db, tablenames):
    for table in tablenames:
        db.execute(f"SELECT COUNT(*) FROM {table}")
        if db.fetchone()[0] == 0:
            return False
    return True


def maybe_create_tables_and_seed(dbq, with_examples=False, with_base_ui_types=True):
    dbq.connect()
    with dbq as db:
        create_tables(db)
        do_seed_examples = with_examples and not seed_data_exist(db, ["ProjectConfig"])
        do_seed_base_ui_types = with_base_ui_types and not seed_data_exist(
            db, ["UIType"]
        )
        seed(
            db,
            with_examples=do_seed_examples,
            with_base_ui_types=do_seed_base_ui_types,
        )
    dbq.disconnect()
