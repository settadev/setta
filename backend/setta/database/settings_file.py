import json
import logging
import os

from setta.code_gen.export_selected import get_selected_section_variant
from setta.database.db.projects.utils import (
    add_defaults_to_project_and_load_json_sources,
    filter_data_for_json_export,
)
from setta.database.db.sections.jsonSource import save_json_source_data
from setta.utils.constants import CONSTANTS_FOLDER, SETTA_FILES_FOLDER, USER_SETTINGS
from setta.utils.utils import get_absolute_path, save_json_to_file

logger = logging.getLogger(__name__)


class SettingsFile:
    def __init__(self):
        self.meta_settings_file = MetaSettingsFile()
        self.load_settings()

    def save_settings(self, settings):
        logger.debug("Saving settings")
        paths = self.meta_settings_file.get_settings_paths()
        to_be_saved = {}
        for settings_slice, path in paths.items():
            if path not in to_be_saved:
                to_be_saved[path] = {}
            to_be_saved[path].update({settings_slice: settings[settings_slice]})

        for filename, data in to_be_saved.items():
            save_json_to_file(filename, data)

        USER_SETTINGS.update(settings)

    def load_settings(self):
        logger.debug("Loading settings")
        paths = self.meta_settings_file.get_settings_paths()
        output = {}
        for settings_slice, path in paths.items():
            with open(path, "r") as f:
                output[settings_slice] = json.load(f)[settings_slice]

        USER_SETTINGS.update(output)
        return output

    def load_settings_project(self):
        return self.meta_settings_file.load_settings_project()

    def save_settings_project(self, p):
        self.meta_settings_file.save_settings_project(p)
        return self.load_settings()


class MetaSettingsFile:
    def __init__(self):
        self.path_seed_settings = get_absolute_path(
            __file__, CONSTANTS_FOLDER / "Settings.json"
        )
        self.path_seed_meta_settings = get_absolute_path(
            __file__, CONSTANTS_FOLDER / "settingsProject.json"
        )
        self.path_default_settings = SETTA_FILES_FOLDER / "setta-settings.json"
        self.path_meta_settings = SETTA_FILES_FOLDER / "setta-meta-settings.json"
        self.load_seed_files()

    def get_settings_paths(self):
        settings_slice_to_path = {}
        p = self.load_meta_settings()
        for k in self.obj_seed_settings.keys():
            path = self.find_path_for_settings_slice(p, k)
            if not path:
                self.seed_settings(self.path_default_settings)
            elif not os.path.exists(path):
                self.seed_settings(path)
            settings_slice_to_path[k] = path
        return settings_slice_to_path

    def find_path_for_settings_slice(self, p, slice):
        for sectionId in p["sections"].keys():
            variant = get_selected_section_variant(p, sectionId)
            if variant["jsonSourceKeys"] == [slice]:
                return variant["name"]
        return None

    def seed_settings(self, path):
        if not os.path.exists(path):
            save_json_to_file(path, self.obj_seed_settings)

    def seed_meta_settings(self):
        if not os.path.exists(self.path_meta_settings):
            save_json_to_file(self.path_meta_settings, self.obj_seed_meta_settings)

    def load_meta_settings(self):
        logger.debug("Loading meta settings")
        self.seed_meta_settings()
        with open(self.path_meta_settings, "r") as f:
            return json.load(f)

    def load_settings_project(self):
        p = self.load_meta_settings()
        add_defaults_to_project_and_load_json_sources(p)
        return p

    def load_seed_files(self):
        with open(self.path_seed_settings, "r") as f:
            self.obj_seed_settings = json.load(f)
        with open(self.path_seed_meta_settings, "r") as f:
            self.obj_seed_meta_settings = json.load(f)

    def save_settings_project(self, p):
        save_json_source_data(p)
        filter_data_for_json_export(p)
        save_json_to_file(self.path_meta_settings, p)
