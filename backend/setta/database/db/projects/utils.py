import copy

from setta.database.db.artifacts.utils import add_defaults_to_artifacts
from setta.database.db.codeInfo.utils import (
    add_defaults_to_code_info,
    add_defaults_to_code_info_cols,
)
from setta.database.db.sections.jsonSource import remove_json_source_values
from setta.database.db.sections.load import load_json_sources_into_data_structures
from setta.database.db.sections.utils import add_defaults_to_sections
from setta.database.db.sectionVariants.utils import add_defaults_to_section_variants
from setta.database.db.uiTypes.utils import (
    add_defaults_to_ui_type_cols,
    add_defaults_to_ui_types,
)
from setta.utils.constants import DEFAULT_VALUES
from setta.utils.utils import filter_dict, recursive_dict_merge


def with_project_config_defaults(**kwargs):
    return recursive_dict_merge(copy.deepcopy(DEFAULT_VALUES["projectConfig"]), kwargs)


def add_defaults_to_project(p):
    p["projectConfig"] = with_project_config_defaults(**p["projectConfig"])
    add_defaults_to_artifacts(p["artifacts"])
    add_defaults_to_sections(p["sections"])
    add_defaults_to_section_variants(p["sectionVariants"])
    add_defaults_to_code_info(p["codeInfo"])
    add_defaults_to_code_info_cols(p["codeInfoCols"])
    add_defaults_to_ui_types(p["uiTypes"])
    add_defaults_to_ui_type_cols(p["uiTypeCols"])


def add_defaults_to_project_and_load_json_sources(p):
    add_defaults_to_project(p)
    load_json_sources_into_data_structures(
        p["codeInfo"], p["codeInfoCols"], p["sectionVariants"]
    )


def remove_empty(x):
    return {k: v for k, v in x.items() if len(v) > 0}


def filter_data_for_json_export(p):
    remove_json_source_values(p)

    p["projectConfig"] = filter_dict(
        p["projectConfig"],
        DEFAULT_VALUES["projectConfig"].keys(),
        DEFAULT_VALUES["projectConfig"],
    )

    for k, v in p["codeInfo"].items():
        p["codeInfo"][k] = filter_dict(
            p["codeInfo"][k],
            DEFAULT_VALUES["codeInfo"].keys(),
            DEFAULT_VALUES["codeInfo"],
        )
        for idx in range(len(v["evRefs"])):
            v["evRefs"][idx] = filter_dict(
                v["evRefs"][idx],
                DEFAULT_VALUES["evRefEntry"].keys(),
                DEFAULT_VALUES["evRefEntry"],
            )

    for k, v in p["codeInfoCols"].items():
        p["codeInfoCols"][k] = filter_dict(
            p["codeInfoCols"][k],
            DEFAULT_VALUES["codeInfoCol"].keys(),
            DEFAULT_VALUES["codeInfoCol"],
        )
    p["codeInfoCols"] = remove_empty(p["codeInfoCols"])

    for k, v in p["uiTypes"].items():
        p["uiTypes"][k] = filter_dict(
            p["uiTypes"][k], DEFAULT_VALUES["uiType"].keys(), DEFAULT_VALUES["uiType"]
        )

    for k, v in p["uiTypeCols"].items():
        for paramId, uiTypeColInfo in v.items():
            p["uiTypeCols"][k][paramId] = filter_dict(
                p["uiTypeCols"][k][paramId],
                DEFAULT_VALUES["uiTypeColEntry"].keys(),
                DEFAULT_VALUES["uiTypeColEntry"],
            )

        p["uiTypeCols"][k] = remove_empty(p["uiTypeCols"][k])
    p["uiTypeCols"] = remove_empty(p["uiTypeCols"])

    for k, v in p["sections"].items():
        if len(p["uiTypeCols"].get(v["uiTypeColId"], {})) == 0:
            v["uiTypeColId"] = None

        p["sections"][k] = filter_dict(
            p["sections"][k],
            DEFAULT_VALUES["section"].keys(),
            DEFAULT_VALUES["section"],
        )

    for k, v in p["sectionVariants"].items():
        if len(p["codeInfoCols"].get(v["codeInfoColId"], {})) == 0:
            v["codeInfoColId"] = None

        curr = p["sectionVariants"]
        curr[k] = filter_dict(
            curr[k],
            DEFAULT_VALUES["sectionVariant"].keys(),
            DEFAULT_VALUES["sectionVariant"],
        )

        if "evRefs" in curr[k]:
            evRefs = curr[k]["evRefs"]
            for idx in range(len(evRefs)):
                evRefs[idx] = filter_dict(
                    evRefs[idx],
                    DEFAULT_VALUES["evRefEntry"].keys(),
                    DEFAULT_VALUES["evRefEntry"],
                )

        if "values" in curr[k]:
            for paramId in curr[k]["values"].keys():
                evRefs = curr[k]["values"][paramId]["evRefs"]
                for idx in range(len(evRefs)):
                    evRefs[idx] = filter_dict(
                        evRefs[idx],
                        DEFAULT_VALUES["evRefEntry"].keys(),
                        DEFAULT_VALUES["evRefEntry"],
                    )

                curr[k]["values"][paramId] = filter_dict(
                    curr[k]["values"][paramId],
                    DEFAULT_VALUES["evEntry"].keys(),
                    DEFAULT_VALUES["evEntry"],
                )

            curr[k]["values"] = remove_empty(curr[k]["values"])
