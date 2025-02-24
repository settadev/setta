import glob
import json

from setta.database.db.projects.utils import add_defaults_to_project
from setta.utils.constants import BASE_UI_TYPES, SEED_FOLDER
from setta.utils.utils import get_absolute_path

from .db.projects.save import save_project_details
from .db.uiTypes.save import save_ui_types


def seed_base_ui_types(db):
    save_ui_types(db, BASE_UI_TYPES)


def seed_examples(db):
    example_jsons = glob.glob(
        str(get_absolute_path(__file__, SEED_FOLDER / "examples/**/*.json"))
    )
    for filepath in example_jsons:
        # if (
        #     "reviews" not in filepath
        #     and "medical" not in filepath
        #     and "financial" not in filepath
        # ):
        #     continue
        # if "hf" not in filepath:
        #     continue
        # if "img_to_img" not in filepath:
        #     continue
        with open(filepath, "r") as f:
            data = json.load(f)
        add_defaults_to_project(data)  # json files don't have all the defaults
        save_project_details(db, data, do_save_json_source_data=False)


def seed(db, with_examples=False, with_base_ui_types=False):
    if with_base_ui_types:
        seed_base_ui_types(db)
    if with_examples:
        seed_examples(db)
