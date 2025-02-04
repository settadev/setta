import logging

import yaml

from setta.utils.constants import SETTA_FILES_FOLDER

logger = logging.getLogger(__name__)


def export_raw(db, filename):
    schema = fetch_schema(db)
    data = fetch_all_data(db)

    # Combined schema and data for JSON export
    database_export = {"schema": schema, "data": data}

    # with open(f"{filename}_export.json", 'w') as file:
    #     json.dump(database_export, file, indent=4)

    # Customize the YAML dump to use literal style for SQL
    def literal_presenter(dumper, data):
        if "\n" in data:
            return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
        return dumper.represent_scalar("tag:yaml.org,2002:str", data)

    yaml.add_representer(str, literal_presenter)

    # For YAML export, PyYAML is used; ensure it's installed
    filepath = SETTA_FILES_FOLDER / f"{filename}_export.yaml"
    logger.debug(f"saving raw db to {filepath}")
    with open(filepath, "w") as file:
        yaml.dump(database_export, file, allow_unicode=True, sort_keys=False)


def fetch_schema(cursor):
    """Fetch the schema of all tables in the database."""
    cursor.execute("SELECT type, name, sql FROM sqlite_master WHERE sql NOT NULL;")
    schema = {}
    for type, name, sql in cursor.fetchall():
        if name not in schema:
            schema[name] = {"type": type, "sql": sql}
    return schema


def fetch_all_data(cursor):
    """Fetch all data from the database."""
    data = {}
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    for (table_name,) in cursor.fetchall():
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [description[0] for description in cursor.description]
        data[table_name] = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return data
