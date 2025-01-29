from setta.database.utils import remap_ids, rename_keys
from setta.utils.constants import BASE_UI_TYPES


def copy_ui_types(ui_types):
    non_preset_ui_types = {k: v for k, v in ui_types.items() if not v["presetType"]}
    new_ui_types, ui_type_id_map = remap_ids(non_preset_ui_types)

    for u in new_ui_types.values():
        u["id"] = ui_type_id_map[u["id"]]

    preset_ui_types = {k: v for k, v in ui_types.items() if v["presetType"]}
    preset_ui_types.update(BASE_UI_TYPES)
    # preset ids shouldn't change
    for k in preset_ui_types.keys():
        ui_type_id_map[k] = k

    return {**new_ui_types, **preset_ui_types}, ui_type_id_map


def copy_ui_type_cols(ui_type_cols, ui_type_id_map, code_info_id_map):
    new_ui_type_cols, ui_type_col_id_map = remap_ids(ui_type_cols)

    for id in new_ui_type_cols.keys():
        new_ui_type_cols[id] = rename_keys(new_ui_type_cols[id], code_info_id_map)
        col = new_ui_type_cols[id]
        for code_info_id, u in col.items():
            col[code_info_id]["uiTypeId"] = ui_type_id_map[u["uiTypeId"]]
            col[code_info_id]["nonPresetUITypeIds"] = [
                ui_type_id_map[x] for x in col[code_info_id]["nonPresetUITypeIds"]
            ]

    return new_ui_type_cols, ui_type_col_id_map
