import copy

from setta.database.db.sectionVariants.utils import with_ev_ref_entry_defaults
from setta.utils.constants import DEFAULT_VALUES
from setta.utils.utils import recursive_dict_merge, replace_null_keys_with_none


def with_code_info_defaults(**kwargs):
    return recursive_dict_merge(copy.deepcopy(DEFAULT_VALUES["codeInfo"]), kwargs)


def add_defaults_to_code_info(code_info):
    for k, v in code_info.items():
        code_info[k] = with_code_info_defaults(**v)
        evRefs = code_info[k]["evRefs"]
        for idx in range(len(evRefs)):
            evRefs[idx] = with_ev_ref_entry_defaults(**evRefs[idx])


def with_code_info_col_defaults(**kwargs):
    return recursive_dict_merge(
        replace_null_keys_with_none(copy.deepcopy(DEFAULT_VALUES["codeInfoCol"])),
        replace_null_keys_with_none(kwargs),
    )


def add_defaults_to_code_info_cols(code_info_cols):
    for k, v in code_info_cols.items():
        code_info_cols[k] = with_code_info_col_defaults(**v)


def new_code_info_col():
    return copy.deepcopy(DEFAULT_VALUES["codeInfoCol"])
