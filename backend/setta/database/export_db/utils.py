from collections import defaultdict

import yaml
from yaml.representer import Representer

from setta.database.db.projects.load import load_full_project
from setta.utils.constants import SETTA_FILES_FOLDER


def get_configs_and_root_folder(db, filename):
    # export defaultdict the same way as dict
    yaml.add_representer(defaultdict, Representer.represent_dict)
    configs = load_full_project(db, do_load_json_sources=False)
    root_folder = SETTA_FILES_FOLDER / f"{filename}_export"
    return configs, root_folder
