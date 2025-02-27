import json
from collections import defaultdict

from setta.utils.constants import BASE_UI_TYPE_IDS, C
from setta.utils.utils import (
    recursive_dict_merge,
    replace_null_keys_with_none,
    save_json_to_file,
    try_json,
)


def save_json_source_data(p, section_ids=None, forking_from=None):
    sections = {
        k: v
        for k, v in p["sections"].items()
        if v.get("jsonSource", None) and ((not section_ids) or k in section_ids)
    }

    to_be_saved = defaultdict(dict)

    forking_from_data = {}
    if forking_from:
        with open(forking_from, "r") as f:
            forking_from_data = json.load(f)

    p["codeInfoCols"] = replace_null_keys_with_none(p["codeInfoCols"])

    for s in sections.values():
        if not s["jsonSource"] or s["jsonSourceMissing"]:
            continue

        for variantId in s["variantIds"]:
            variant = p["sectionVariants"][variantId]
            codeInfoCol = p["codeInfoCols"][variant["codeInfoColId"]]
            filename = variant["name"]
            recursively_add_keys(p, variant, codeInfoCol, to_be_saved[filename], None)

            # Make sure the jsonSourceKeys are present.
            # (They might not be because they are completely empty)
            add_key_path_to_dict(to_be_saved[filename], s["jsonSourceKeys"])

    # Save each file
    for filename, data in to_be_saved.items():
        data = recursive_dict_merge(forking_from_data, data)
        save_json_to_file(filename, data)

    return to_be_saved


def recursively_add_keys(p, variant, codeInfoCol, input_dict, codeInfoId):
    for k in codeInfoCol["children"][codeInfoId]:
        children = codeInfoCol["children"][k]
        if p["codeInfo"][k]["jsonSourceMetadata"]:
            metadata = p["codeInfo"][k]["jsonSourceMetadata"]
            key_path = metadata["key"]
            value = try_getting_value(variant, k, children)

            current_dict = add_key_path_to_dict(input_dict, key_path[:-1])

            # Set the value at the final position
            if key_path:  # Only set if we have a path
                current_dict[key_path[-1]] = value

            recursively_add_keys(p, variant, codeInfoCol, input_dict, k)


def try_getting_value(variant, codeInfoId, codeInfoChildren):
    if len(codeInfoChildren) == 0:
        if codeInfoId in variant["values"]:
            return try_json(variant["values"][codeInfoId]["value"])
        return ""
    return {}


def add_key_path_to_dict(output, key_path):
    for path_part in key_path:
        # Create nested dictionaries if they don't exist
        if path_part not in output:
            output[path_part] = {}
        output = output[path_part]
    return output


def condition_keep_code_info(codeInfo, jsonCodeInfoWithUIType):
    if not codeInfo:
        return False
    return (
        codeInfo["id"] in jsonCodeInfoWithUIType or not codeInfo["jsonSourceMetadata"]
    )


def remove_json_source_data(p):
    for variant in p["sectionVariants"].values():
        variant["values"] = {
            k: v
            for k, v in variant["values"].items()
            if not p["codeInfo"][k]["jsonSourceMetadata"]
        }

    jsonCodeInfoWithUIType = set()
    for uiTypeCol in p["uiTypeCols"].values():
        for paramInfoId, uiTypeInfo in uiTypeCol.items():
            # we want to know which json source params have an associated uiTypeId
            # only if it's not the base TEXT type, since that's the default
            if (
                p["codeInfo"][paramInfoId]["jsonSourceMetadata"]
                and uiTypeInfo["uiTypeId"] != BASE_UI_TYPE_IDS[C.TEXT]
            ):
                jsonCodeInfoWithUIType.add(paramInfoId)

    p["codeInfo"] = {
        k: v
        for k, v in p["codeInfo"].items()
        if condition_keep_code_info(v, jsonCodeInfoWithUIType)
    }

    for codeInfoColId in p["codeInfoCols"].keys():
        codeInfoCol = p["codeInfoCols"][codeInfoColId]
        codeInfoCol["children"] = {
            k: v
            for k, v in codeInfoCol["children"].items()
            if k is None
            or condition_keep_code_info(
                p["codeInfo"].get(k),
                jsonCodeInfoWithUIType,
            )
        }
        for id, children in codeInfoCol["children"].items():
            codeInfoCol["children"][id] = [
                c
                for c in children
                if condition_keep_code_info(
                    p["codeInfo"].get(c),
                    jsonCodeInfoWithUIType,
                )
            ]
