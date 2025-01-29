import os
from collections import defaultdict
from pathlib import Path

import yaml
from yaml.representer import Representer

from setta.database.db.projects.load import load_full_project


def get_configs_and_root_folder(db, filename):
    # export defaultdict the same way as dict
    yaml.add_representer(defaultdict, Representer.represent_dict)
    configs = load_full_project(db)
    root_folder = Path(os.getcwd()) / f"{filename}_export"
    return configs, root_folder
