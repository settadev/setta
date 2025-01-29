import json

from setta.cli.logger import get_wrapper_for_loading
from setta.utils.constants import C
from setta.utils.utils import try_json


def load_artifacts(db, ids):
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        SELECT id, name, path, value, type
        FROM Artifact
        WHERE id IN ({placeholders})
    """

    db.execute(query, ids)

    output = {}
    for row in db.fetchall():
        output[row["id"]] = {
            "name": row["name"],
            "path": row["path"],
            "value": try_json(row["value"]),
            "type": row["type"],
        }

    return output


def load_artifact_groups(db, ids):
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        SELECT ArtifactGroupId.id, ArtifactGroupId.name, ArtifactGroupId.data, ArtifactGroup.artifactId, ArtifactGroup.data as artifactTransformData, ArtifactGroup."order"
        FROM ArtifactGroupId
        LEFT JOIN ArtifactGroup
        ON ArtifactGroupId.id = ArtifactGroup.idid
        WHERE ArtifactGroupId.id in ({placeholders})
        ORDER BY ArtifactGroupId.id, ArtifactGroup."order"
    """
    db.execute(query, ids)
    output = {}
    for row in db.fetchall():
        if row["id"] not in output:
            output[row["id"]] = {
                "name": row["name"],
                "artifactTransforms": [],
                **json.loads(row["data"]),
            }
        if row["artifactId"]:
            output[row["id"]]["artifactTransforms"].append(
                {
                    "artifactId": row["artifactId"],
                    **json.loads(row["artifactTransformData"]),
                }
            )
    return output


def load_available_artifacts(db, sectionType):
    allowed_types = C.ALLOWED_ARTIFACT_TYPES[sectionType]

    placeholders = ", ".join(["?"] * len(allowed_types))
    query = f"""
        SELECT id, name, path, type
        FROM Artifact
        WHERE type IN ({placeholders})
    """

    db.execute(query, allowed_types)

    output = {}
    for row in db.fetchall():
        output[row["id"]] = {
            "name": row["name"],
            "path": row["path"],
            "type": row["type"],
        }

    return output


def load_artifact_metadata_and_maybe_value_from_disk(db, artifactIds):
    artifacts = load_artifacts(db, artifactIds)
    for a in artifacts.values():
        if a["path"]:
            a.update(load_artifact_from_disk(a["path"], a["type"]))
    return artifacts


def load_artifact_from_disk(filepath, type):
    wrapper = get_wrapper_for_loading(type)
    wrapper.load(filepath)
    return wrapper.serialize()
