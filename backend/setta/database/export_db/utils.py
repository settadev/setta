from collections import defaultdict

import yaml
from yaml.representer import Representer

from setta.database.db.projects.load import load_full_project
from setta.utils.constants import DOT_SETTA_FOLDER


def get_configs_and_root_folder(db, filename):
    # export defaultdict the same way as dict
    yaml.add_representer(defaultdict, Representer.represent_dict)
    configs = load_full_project(db)
    root_folder = DOT_SETTA_FOLDER / f"{filename}_export"
    return configs, root_folder
