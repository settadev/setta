import os

DEFAULT_DB_FOLDER = os.getcwd()
DEFAULT_DB_NAME = "setta.db"


def get_default_db_path():
    return os.path.join(DEFAULT_DB_FOLDER, DEFAULT_DB_NAME)
