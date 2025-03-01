from setta.database.utils import remap_ids, rename_keys

from ..codeInfo.copy import copy_code_info, copy_code_info_col
from ..sectionVariants.copy import (
    copy_section_variants,
    update_section_variant_children,
)
from ..uiTypes.copy import copy_ui_type_cols, copy_ui_types


def copy_sections(
    sections,
    section_variant_id_map,
    ui_type_id_map,
    ui_type_col_id_map,
):
    new_sections, section_id_map = remap_ids(sections)
    for section in new_sections.values():
        section["id"] = section_id_map[section["id"]]
        section["variantId"] = section_variant_id_map[section["variantId"]]
        section["defaultVariantId"] = section_variant_id_map[
            section["defaultVariantId"]
        ]
        section["uiTypeId"] = ui_type_id_map[section["uiTypeId"]]
        if section["uiTypeColId"]:
            section["uiTypeColId"] = ui_type_col_id_map[section["uiTypeColId"]]
        section["variantIds"] = [
            section_variant_id_map[x] for x in section["variantIds"]
        ]
        section["nonPresetUITypeIds"] = [
            ui_type_id_map[x] for x in section["nonPresetUITypeIds"]
        ]
        section["paramSweepSectionId"] = section_id_map.get(
            section["paramSweepSectionId"], None
        )
        section["parentId"] = section_id_map.get(section["parentId"], None)

    return new_sections, section_id_map


def copy_sections_and_other_info(x):
    new_code_info, code_info_id_map = copy_code_info(x["codeInfo"])
    new_code_info_cols, code_info_col_id_map = copy_code_info_col(
        x["codeInfoCols"], code_info_id_map
    )
    new_section_variants, section_variant_id_map = copy_section_variants(
        x["sectionVariants"], code_info_id_map, code_info_col_id_map
    )
    new_ui_types, ui_type_id_map = copy_ui_types(x["uiTypes"])
    new_ui_type_cols, ui_type_col_id_map = copy_ui_type_cols(
        x["uiTypeCols"], ui_type_id_map, code_info_id_map
    )
    new_sections, section_id_map = copy_sections(
        x["sections"],
        section_variant_id_map,
        ui_type_id_map,
        ui_type_col_id_map,
    )
    update_section_variant_children(new_section_variants, section_id_map)

    return {
        "codeInfo": new_code_info,
        "codeInfoCols": new_code_info_cols,
        "sectionVariants": new_section_variants,
        "uiTypes": new_ui_types,
        "uiTypeCols": new_ui_type_cols,
        "sections": new_sections,
        "section_id_map": section_id_map,
    }


def copy_relative_positions(relative_positions, section_id_map):
    return rename_keys(relative_positions, section_id_map)
