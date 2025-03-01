import json
from collections import defaultdict

from setta.code_gen.export_selected import get_section_variants
from setta.database.db.artifacts.save import save_artifact_groups, save_artifacts
from setta.database.db.evRefs.save import save_ev_refs, save_template_vars
from setta.database.utils import create_new_id
from setta.utils.constants import (
    DEFAULT_VALUES,
    PROJECT_CONFIG_TABLE_DATA_JSON_FIELDS,
    SECTION_CONFIG_TABLE_DATA_JSON_FIELDS,
    USER_SETTINGS,
)
from setta.utils.generate_memorable_string import generate_memorable_available_string
from setta.utils.utils import filter_dict

from ..codeInfo.save import save_code_info, save_code_info_col
from ..sections.jsonSource import remove_json_source_values, save_json_source_data
from ..sections.save import save_sections
from ..sectionVariants.save import save_section_variants
from ..uiTypes.save import save_ui_type_cols, save_ui_types


def save_project_details(db, p, do_save_json_source_data=True):
    if do_save_json_source_data:
        save_json_source_data(p)
    remove_json_source_values(p)
    save_artifacts(db, p["artifacts"])
    save_artifact_groups(db, p["artifactGroups"], p["sections"])
    save_code_info(db, p["codeInfo"])
    save_code_info_col(db, p["codeInfoCols"])
    save_ui_types(db, p["uiTypes"])
    save_ui_type_cols(db, p["uiTypeCols"])
    save_section_variants(db, p["sectionVariants"])
    save_sections(db, p["sections"], p["sectionVariants"])
    save_ev_refs(db, p["sectionVariants"], p["codeInfo"])
    save_template_vars(db, p["sectionVariants"])
    save_project(db, p["projectConfig"])
    save_section_configs(db, p["projectConfig"]["id"], p["sections"])
    update_linked_project_configs(db, p)


def save_project(db, project):
    query = """
        INSERT INTO ProjectConfig (id, name, data)
        VALUES (:id, :name, :data)
        ON CONFLICT (id)
        DO UPDATE SET
        name = :name,
        data = :data
    """

    query_params = {
        "id": project["id"],
        "name": project["name"],
        "data": json.dumps(
            filter_dict(
                project,
                PROJECT_CONFIG_TABLE_DATA_JSON_FIELDS,
                DEFAULT_VALUES["projectConfig"],
            )
        ),
    }
    db.execute(query, query_params)

    query = """
        DELETE FROM ProjectConfigChildren
        WHERE parentId = :parentId
    """
    db.execute(query, {"parentId": project["id"]})

    query = """
        INSERT INTO ProjectConfigChildren (parentId, childId, x, y, zIndex, w, h)
        VALUES (:parentId, :childId, :x, :y, :zIndex, :w, :h)
    """
    query_params = []
    query_params.extend(
        [
            {
                "parentId": project["id"],
                "childId": childId,
                "x": details["x"],
                "y": details["y"],
                "zIndex": details["zIndex"],
                "w": details["w"],
                "h": details["h"],
            }
            for childId, details in project["children"].items()
        ]
    )
    db.executemany(query, query_params)


def create_project_config(db, name, previewImgColor):
    query = """
        SELECT name
        FROM ProjectConfig
    """
    db.execute(query)
    taken_names = [row[0] for row in db.fetchall()]

    name = generate_memorable_available_string(taken_names)

    query = """
        INSERT INTO ProjectConfig (id, name, data)
        VALUES (:id, :name, :data)
    """
    projectId = create_new_id()
    query_params = {
        "id": projectId,
        "name": name,
        "data": json.dumps(
            {
                "previewImgColor": previewImgColor,
                "viewport": {
                    "x": 0,
                    "y": 0,
                    "zoom": USER_SETTINGS["gui"]["defaultZoomLevel"],
                },
            }
        ),
    }
    db.execute(query, query_params)
    return name


def save_project_config_name(db, curr_name, new_name):
    query = """
        UPDATE ProjectConfig
        SET name = :new_name
        WHERE name = :curr_name
    """
    query_params = {"curr_name": curr_name, "new_name": new_name}
    db.execute(query, query_params)


def set_as_default_project(db, projectId):
    query = """
        UPDATE Metadata
        SET defaultProject = :projectId
        WHERE id = 1;
    """
    db.execute(query, {"projectId": projectId})


def save_section_configs(db, project_config_id, sections):
    query_params = []
    for section_id in sections.keys():
        query_params.extend([project_config_id, section_id])
    placeholders = ", ".join(["(?, ?)"] * (len(query_params) // 2))
    query = f"""
        DELETE FROM SectionConfig
        WHERE (projectConfigId, sectionId) IN ({placeholders})
    """
    db.execute(query, query_params)

    query = f"""
        DELETE FROM SectionConfigSelectedVariants
        WHERE (projectConfigId, sectionId) IN ({placeholders})
    """
    db.execute(query, query_params)

    id_pairs = [(project_config_id, s) for s in sections.keys()]
    insert_section_configs(db, sections, id_pairs)


def insert_section_configs(db, sections, id_pairs):
    query = """
        INSERT INTO SectionConfig (projectConfigId, sectionId, variantId, data)
        VALUES (:projectConfigId, :sectionId, :variantId, :data)
    """

    query_params = [
        {
            "projectConfigId": projectConfigId,
            "sectionId": sections[c]["id"],
            "variantId": sections[c]["variantId"],
            "data": json.dumps(
                filter_dict(
                    sections[c],
                    SECTION_CONFIG_TABLE_DATA_JSON_FIELDS,
                    DEFAULT_VALUES["section"],
                )
            ),
        }
        for projectConfigId, c in id_pairs
    ]

    db.executemany(query, query_params)

    query = """
        INSERT INTO SectionConfigSelectedVariants (projectConfigId, sectionId, variantId)
        VALUES (:projectConfigId, :sectionId, :variantId)
    """
    query_params = []
    for projectConfigId, c in id_pairs:
        query_params.extend(
            {
                "projectConfigId": projectConfigId,
                "sectionId": sections[c]["id"],
                "variantId": k,
            }
            for k in sections[c]["selectedVariantIds"].keys()
        )

    db.executemany(query, query_params)


# If multiple project configs share a section,
# and that section has children,
# then if a new child is added in one of those project configs,
# an entry in SectionConfig needs to be added for ALL project configs.
# Otherwise when loading those other project configs,
# the data for the new child will be missing.
def update_linked_project_configs(db, project):
    query = """
        SELECT projectConfigId, sectionId
        FROM SectionConfig
        WHERE projectConfigId != ?
    """
    project_config = project["projectConfig"]
    db.execute(query, (project_config["id"],))
    sections_to_project_configs = defaultdict(set)
    project_configs_to_sections = defaultdict(set)
    for row in db.fetchall():
        sections_to_project_configs[row["sectionId"]].add(row["projectConfigId"])
        project_configs_to_sections[row["projectConfigId"]].add(row["sectionId"])

    section_configs_to_add = set()
    children_have_been_visited = set()
    has_been_visited_as_child = set()
    # we start with top level sections that are also in other project configs
    ids = set(
        k for k in project_config["children"].keys() if k in sections_to_project_configs
    )
    while len(ids) > 0:
        curr = ids.pop()
        if curr in children_have_been_visited:
            continue
        children_have_been_visited.add(curr)
        for variant in get_section_variants(project, curr):
            children = variant["children"]
            for c in children:
                if c in has_been_visited_as_child:
                    continue
                has_been_visited_as_child.add(c)
                c_already_in_at_least_one_other_config = False
                for other_project_config in sections_to_project_configs[curr]:
                    other_project_section_configs = project_configs_to_sections[
                        other_project_config
                    ]
                    # The parent (curr) is in other project configs, but the child is not.
                    # So we need to add the child to the other project configs that it's not in.
                    if c not in other_project_section_configs:
                        section_configs_to_add.add((other_project_config, c))
                    else:
                        c_already_in_at_least_one_other_config = True

                # The child is already in at least one other project config.
                # So we need to recurse into the child, to see if its children
                # need to be added.
                if (
                    c_already_in_at_least_one_other_config
                    and c not in children_have_been_visited
                ):
                    ids.add(c)

    insert_section_configs(db, project["sections"], section_configs_to_add)
