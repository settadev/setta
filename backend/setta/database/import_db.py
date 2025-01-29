import sqlite3

import yaml


def import_database(yaml_filepath, new_database_path):
    with open(yaml_filepath, "r") as file:
        database_content = yaml.safe_load(file)

    conn = sqlite3.connect(new_database_path)
    cursor = conn.cursor()

    for table_name, table_info in database_content["schema"].items():
        sql = table_info["sql"]
        cursor.execute(sql)

    for table_name, rows in database_content["data"].items():
        if not rows:
            continue
        # Quote column names to handle reserved keywords
        columns = ['"' + column + '"' for column in rows[0].keys()]
        placeholders = ", ".join(["?"] * len(columns))
        sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
        for row in rows:
            cursor.execute(sql, list(row.values()))

    conn.commit()
    conn.close()
