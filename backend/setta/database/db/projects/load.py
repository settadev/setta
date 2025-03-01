import json

from setta.database.db.evRefs.load import (
    load_ev_refs_into_data_structures,
    load_template_vars_into_data_structures,
)
from setta.database.db.projects.utils import with_project_config_defaults
from setta.utils.utils import recursive_dict_merge

from ..codeInfo.load import load_code_info_cols
from ..sections.load import (
    load_json_sources_into_data_structures,
    load_section_configs,
    load_sections,
)


class ProjectNotFound(Exception):
    pass


def load_all_project_config_metadata(db):
    query = """
        SELECT
            pc.id,
            pc.name,
            pc.data,
            pcc.x,
            pcc.y,
            pcc.zIndex,
            pcc.w,
            pcc.h
        FROM
            ProjectConfig pc
        LEFT JOIN
            ProjectConfigChildren pcc ON pc.id = pcc.parentId
        ORDER BY
            pc.id;
    """
    db.execute(query)
    output = {}
    for row in db.fetchall():
        id = row["id"]
        if id not in output:
            output[id] = with_project_config_defaults(
                id=row["id"],
                name=row["name"],
                childrenForPreviewImg=[],
                **json.loads(row["data"]),
            )
        if row["x"]:
            output[id]["childrenForPreviewImg"].append(
                {
                    "x": row["x"],
                    "y": row["y"],
                    "zIndex": row["zIndex"],
                    "w": row["w"],
                    "h": row["h"],
                }
            )

    default_name = load_default_config_name(db)
    return list(output.values()), default_name


def load_project_config_metadata(db, config_name):
    query = """
        SELECT
            ProjectConfig.id,
            ProjectConfig.name,
            ProjectConfig.data,
            pcc.childId as childId,
            pcc.x,
            pcc.y,
            pcc.zIndex,
            pcc.w,
            pcc.h
        FROM
            ProjectConfig
        LEFT JOIN
            ProjectConfigChildren pcc
        ON
            ProjectConfig.id = pcc.parentId
        WHERE
            name = :name
    """

    query_params = {"name": config_name}
    db.execute(query, query_params)
    output = {}
    for row in db.fetchall():
        id = row["id"]
        if id not in output:
            output[id] = with_project_config_defaults(
                id=row["id"],
                name=row["name"],
                **json.loads(row["data"]),
            )
        if row["childId"]:
            output[id]["children"][row["childId"]] = {
                "x": row["x"],
                "y": row["y"],
                "zIndex": row["zIndex"],
                "w": row["w"],
                "h": row["h"],
            }

    if len(output) > 1:
        raise ValueError(f"output should be of length 1 but has length {len(output)}")
    if len(output) == 0:
        raise ProjectNotFound(f"{config_name} not found")

    return list(output.values())[0]


def load_project_config(db, project_config_name, do_load_json_sources=True):
    projectConfig = load_project_config_metadata(db, project_config_name)
    sections_data = load_sections(db, list(projectConfig["children"].keys()))
    sectionConfigs = load_section_configs(db, projectConfig["id"])
    sections = recursive_dict_merge(
        sections_data["sections"], sectionConfigs, strict_top_level_keys=True
    )
    sectionVariants = sections_data["sectionVariants"]
    artifactGroups = sections_data["artifactGroups"]
    uiTypeCols = sections_data["uiTypeCols"]
    uiTypes = sections_data["nonPresetUITypes"]
    codeInfo, codeInfoCols = load_code_info_cols(db, sectionVariants)
    load_ev_refs_into_data_structures(db, sectionVariants, codeInfo)
    load_template_vars_into_data_structures(db, sectionVariants)
    if do_load_json_sources:
        load_json_sources_into_data_structures(codeInfo, codeInfoCols, sectionVariants)

    return {
        "projectConfig": projectConfig,
        "sections": sections,
        "sectionVariants": sectionVariants,
        "artifactGroups": artifactGroups,
        "uiTypes": uiTypes,
        "uiTypeCols": uiTypeCols,
        "codeInfo": codeInfo,
        "codeInfoCols": codeInfoCols,
    }


def load_project_config_names(db, excludeProjectConfigName=None):
    query = """
        SELECT
            name
        FROM
            ProjectConfig
    """

    if excludeProjectConfigName:
        query += "WHERE name != :excludeProjectConfigName"

    db.execute(query, {"excludeProjectConfigName": excludeProjectConfigName})

    return [r[0] for r in db.fetchall()]


def load_full_project(db, excludeProjectConfigName=None, do_load_json_sources=True):
    config_names = load_project_config_names(db, excludeProjectConfigName)
    configs = []
    for c in config_names:
        p = load_project_config(db, c, do_load_json_sources)
        configs.append(p)

    return configs


def load_default_config_name(db):
    query = """
        SELECT pc.name
        FROM Metadata m
        JOIN ProjectConfig pc ON m.defaultProject = pc.id
        WHERE m.id = 1;
    """

    db.execute(query)
    results = db.fetchall()
    if len(results) > 0:
        return results[0][0]
    return None
