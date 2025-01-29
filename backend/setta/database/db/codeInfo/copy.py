from setta.database.utils import remap_ids, rename_keys
from setta.utils.constants import is_from_json_source


def copy_code_info(code_info):
    ids_to_rename = [k for k in code_info.keys() if not is_from_json_source(k)]
    new_code_info, code_info_id_map = remap_ids(code_info, ids_to_rename)
    code_info_id_map.update({k: k for k in code_info.keys() if is_from_json_source(k)})

    for c in new_code_info.values():
        c["id"] = code_info_id_map[c["id"]]

    return new_code_info, code_info_id_map


def copy_code_info_col(code_info_cols, code_info_id_map):
    new_code_info_cols, code_info_col_id_map = remap_ids(code_info_cols)

    for col in new_code_info_cols.values():
        col["children"] = rename_keys(col["children"], code_info_id_map)
        for parentId in col["children"].keys():
            col["children"][parentId] = [
                code_info_id_map[x] for x in col["children"][parentId]
            ]

    return new_code_info_cols, code_info_col_id_map
