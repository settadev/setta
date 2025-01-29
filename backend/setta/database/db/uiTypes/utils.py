import copy

from setta.utils.constants import DEFAULT_VALUES
from setta.utils.utils import recursive_dict_merge


def add_defaults_to_ui_types(ui_types):
    for id in ui_types.keys():
        ui_types[id] = with_ui_type_defaults(**ui_types[id])


def with_ui_type_defaults(**kwargs):
    return recursive_dict_merge(copy.deepcopy(DEFAULT_VALUES["uiType"]), kwargs)


def new_ui_type_col_entry():
    return copy.deepcopy(DEFAULT_VALUES["uiTypeColEntry"])


def add_defaults_to_ui_type_cols(ui_type_cols):
    for v in ui_type_cols.values():
        for paramId in v.keys():
            v[paramId] = with_ui_type_col_entry_defaults(**v[paramId])


def with_ui_type_col_entry_defaults(**kwargs):
    return recursive_dict_merge(copy.deepcopy(DEFAULT_VALUES["uiTypeColEntry"]), kwargs)
