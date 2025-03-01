import copy
import itertools
import json
import logging
from collections import defaultdict

from setta.database.db.artifacts.load import load_artifact_groups
from setta.database.db.codeInfo.utils import new_code_info_col, with_code_info_defaults
from setta.database.db.sections.jsonSource import build_ancestor_paths
from setta.database.db.sections.utils import with_section_defaults
from setta.database.db.sectionVariants.utils import new_ev_entry
from setta.database.utils import create_new_id

from ..sectionVariants.load import load_section_variants
from ..uiTypes.load import load_uitypecols, load_uitypes

logger = logging.getLogger(__name__)


def load_sections(db, ids):
    all_ids, child_to_parent_id = get_section_ids(db, ids)

    section_id_to_config_count = num_projects_each_section_exists_in(db, all_ids)

    placeholders = ", ".join(["?"] * len(all_ids))
    query = f"""
        SELECT
            S.*,
            U.nonPresetUITypeIds,
            E.variantIds,
            A.artifactGroupIds
        FROM
            Section S
        LEFT JOIN
            (
                SELECT
                    asNonPresetForSectionId,
                    GROUP_CONCAT(id) AS nonPresetUITypeIds
                FROM
                    UIType
                GROUP BY
                    asNonPresetForSectionId
            ) AS U ON S.id = U.asNonPresetForSectionId
        LEFT JOIN
            (
                SELECT
                    originSectionId,
                    GROUP_CONCAT(id) AS variantIds
                FROM
                    SectionVariantId
                GROUP BY
                    originSectionId
            ) AS E ON S.id = E.originSectionId
        LEFT JOIN
            (
                SELECT
                    originSectionId,
                    GROUP_CONCAT(id) AS artifactGroupIds
                FROM (
                    SELECT id, originSectionId
                    FROM ArtifactGroupId
                    ORDER BY "order"
                )
                GROUP BY
                    originSectionId
            ) AS A ON S.id = A.originSectionId
        WHERE
            S.id IN ({placeholders})
        GROUP BY
            S.id;
    """
    db.execute(query, all_ids)

    sections = {}
    for v in db.fetchall():
        v = dict(v)
        data = v.pop("data")
        v["isInOtherProjectConfigs"] = section_id_to_config_count[v["id"]] > 1
        v["parentId"] = child_to_parent_id.get(v["id"], None)
        v["variantIds"] = v["variantIds"].split(",") if v["variantIds"] else []
        v["artifactGroupIds"] = (
            v["artifactGroupIds"].split(",") if v["artifactGroupIds"] else []
        )
        v["nonPresetUITypeIds"] = (
            v["nonPresetUITypeIds"].split(",") if v["nonPresetUITypeIds"] else []
        )
        sections[v["id"]] = with_section_defaults(
            **v,
            **json.loads(data),
        )

    variantIds = list(
        itertools.chain.from_iterable([s["variantIds"] for s in sections.values()])
    )
    sectionVariants = load_section_variants(db, variantIds)

    artifactGroupIds = list(
        itertools.chain.from_iterable(
            [s["artifactGroupIds"] for s in sections.values()]
        )
    )
    artifactGroups = load_artifact_groups(db, artifactGroupIds)

    uiTypeCols = load_uitypecols(db, [s["uiTypeColId"] for s in sections.values()])

    nonPresetUITypeIds = []
    for s in sections.values():
        nonPresetUITypeIds.extend(s["nonPresetUITypeIds"])
    for u in uiTypeCols.values():
        for c in u.values():
            nonPresetUITypeIds.extend(c["nonPresetUITypeIds"])

    nonPresetUITypes = load_uitypes(db, nonPresetUITypeIds)

    return {
        "sections": sections,
        "sectionVariants": sectionVariants,
        "artifactGroups": artifactGroups,
        "uiTypeCols": uiTypeCols,
        "nonPresetUITypes": nonPresetUITypes,
    }


# TODO: try using a recursive sql query for this
def get_section_ids(db, top_level_ids):
    section_id_to_variants = defaultdict(list)
    variant_id_to_children = defaultdict(list)

    db.execute("SELECT id, originSectionId FROM SectionVariantId")
    for row in db.fetchall():
        section_id_to_variants[row["originSectionId"]].append(row["id"])

    db.execute("SELECT idid, childId FROM SectionVariantChildren")
    for row in db.fetchall():
        variant_id_to_children[row["idid"]].append(row["childId"])

    ids = copy.deepcopy(top_level_ids)
    output = copy.deepcopy(top_level_ids)
    child_to_parent_id = {}
    visited = set()

    while len(ids) > 0:
        id = ids.pop()
        if id in visited:
            continue
        variantIds = section_id_to_variants[id]
        for vid in variantIds:
            for c in variant_id_to_children[vid]:
                if c not in visited:
                    ids.append(c)
                    output.append(c)
                    child_to_parent_id[c] = id
        visited.add(id)

    return output, child_to_parent_id


def load_section_configs(db, project_config_id):
    query = """
       SELECT s.sectionId, s.variantId, s.data, v.variantId as selectedVariantId
       FROM SectionConfig s
       LEFT JOIN SectionConfigSelectedVariants v
           ON s.sectionId = v.sectionId
           AND s.projectConfigId = v.projectConfigId
       WHERE s.projectConfigId = :projectConfigId
   """

    db.execute(query, {"projectConfigId": project_config_id})
    output = {}
    for row in db.fetchall():
        section_id = row["sectionId"]
        if section_id not in output:
            output[section_id] = {
                "id": section_id,
                "variantId": row["variantId"],
                "selectedVariantIds": {},
                **json.loads(row["data"]),
            }
        if row["selectedVariantId"]:
            output[section_id]["selectedVariantIds"][row["selectedVariantId"]] = True

    return output


def num_projects_each_section_exists_in(db, section_ids):
    placeholders = ", ".join(["?"] * len(section_ids))
    query = f"""
        SELECT sectionId, COUNT(DISTINCT projectConfigId) as projectConfigCount
        FROM SectionConfig
        WHERE sectionId IN ({placeholders})
        GROUP BY sectionId
    """

    db.execute(query, section_ids)
    output = {}
    for row in db.fetchall():
        output[row[0]] = row[1]

    return output


def load_json_sources_into_data_structures(
    codeInfo, codeInfoCols, sectionVariants, variant_ids=None
):
    sectionVariants = {
        k: v
        for k, v in sectionVariants.items()
        if ((not variant_ids) or k in variant_ids)
    }

    for variant in sectionVariants.values():
        if not variant["isJsonSource"]:
            continue
        new_data, isMissing = load_json_source(
            variant["name"], variant["jsonSourceKeys"]
        )
        variant["jsonSourcMissing"] = isMissing
        if not isMissing:
            if not variant["codeInfoColId"]:
                variant["codeInfoColId"] = create_new_id()
                codeInfoCols[variant["codeInfoColId"]] = new_code_info_col()
            codeInfoCol = codeInfoCols[variant["codeInfoColId"]]
            merge_into_existing(new_data, variant, codeInfo, codeInfoCol)


def merge_into_existing(data, sectionVariant, codeInfo, codeInfoCol):
    filename = sectionVariant["name"]
    jsonSourceMetadata_to_id = {}
    ancestor_paths = build_ancestor_paths(codeInfo, codeInfoCol["children"])
    for id in ancestor_paths:
        jsonSourceMetadata_to_id[
            createMetadataJsonString(filename, ancestor_paths[id])
        ] = id

    replacements = {}
    new_ancestor_paths = build_ancestor_paths(
        data["codeInfo"], data["codeInfoColChildren"]
    )
    for newId, newInfo in data["codeInfo"].items():
        existingId = jsonSourceMetadata_to_id.get(
            createMetadataJsonString(filename, new_ancestor_paths[newId])
        )
        if existingId:
            replacements[newId] = existingId
        else:
            codeInfo[newId] = newInfo

    for newId, existingId in replacements.items():
        del data["codeInfo"][newId]
        data["codeInfoColChildren"][existingId] = [
            replacements.get(x, x) for x in data["codeInfoColChildren"][newId]
        ]
        data["codeInfoColChildren"][None] = [
            replacements.get(x, x) for x in data["codeInfoColChildren"][None]
        ]
        del data["codeInfoColChildren"][newId]
        data["sectionVariantValues"][existingId] = data["sectionVariantValues"][newId]
        del data["sectionVariantValues"][newId]

    sectionVariant["values"] = data["sectionVariantValues"]
    codeInfoCol["children"] = data["codeInfoColChildren"]


def load_json_source(filename, jsonSourceKeys):
    jsonSourceData = {}
    isMissing = False

    try:
        logger.debug(f"Attempting to read {filename} with keys {jsonSourceKeys}")
        with open(filename, "r") as f:
            jsonSourceData = json.load(f)
    except json.JSONDecodeError:
        pass
    except FileNotFoundError:
        logger.debug(f"couldn't find: {filename}")
        isMissing = True

    new_data = process_json_object(jsonSourceData, filename, jsonSourceKeys)

    return new_data, isMissing


def process_json_object(jsonSourceData, filename, jsonSourceKeys):
    new_data = {
        "codeInfo": {},
        "codeInfoColChildren": {},
        "sectionVariantValues": {},
    }

    try:
        for k in jsonSourceKeys:
            jsonSourceData = jsonSourceData[k]
    except:
        # TODO print warning or something
        pass

    metadataToId = {}

    highest_key = process_json_object_helper(
        new_data, jsonSourceData, filename, jsonSourceKeys, metadataToId
    )

    if len(jsonSourceKeys) > 0:
        # point directly from None (the root) to the children
        codeInfoChildren = new_data["codeInfoColChildren"]
        codeInfoChildren[None] = codeInfoChildren[highest_key]
        del codeInfoChildren[highest_key]

    return new_data


def process_json_object_helper(output, obj, filename, current_path, metadataToId):
    if not isinstance(obj, dict):
        return

    children_keys = []
    for k, v in obj.items():
        path = current_path + [k]
        paramInfoId, is_dict = create_json_code_info(k, v, output)
        metadataToId[createMetadataJsonString(filename, path)] = paramInfoId
        children_keys.append(paramInfoId)
        if is_dict:
            process_json_object_helper(output, v, filename, path, metadataToId)

    parent_id = None
    if len(current_path) > 0:
        metadata = createMetadataJsonString(filename, current_path)
        parent_id = metadataToId.get(metadata)
        if not parent_id:
            parent_id = create_new_id()
            metadataToId[metadata] = parent_id

    output["codeInfoColChildren"][parent_id] = children_keys
    return parent_id


def create_json_code_info(key, value, output):
    paramInfoId = create_new_id()
    # Create code info entry
    output["codeInfo"][paramInfoId] = with_code_info_defaults(
        id=paramInfoId,
        name=key,
        editable=True,
    )
    output["codeInfoColChildren"][paramInfoId] = []

    is_dict = isinstance(value, dict)
    # Create variant value entry
    if is_dict:
        # For objects, store empty value and process children
        output["sectionVariantValues"][paramInfoId] = new_ev_entry()
    else:
        # For non-objects, store the value directly
        output["sectionVariantValues"][paramInfoId] = new_ev_entry(
            value=json.dumps(value)
        )

    return paramInfoId, is_dict


def createMetadataJsonString(filename, path):
    return json.dumps({"filename": filename, "key": path})
