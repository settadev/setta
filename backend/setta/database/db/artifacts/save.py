import json

from setta.utils.constants import DEFAULT_VALUES
from setta.utils.utils import filter_dict


def save_artifacts(db, artifacts):
    query = """
        INSERT INTO Artifact (id, name, path, value, type)
        VALUES (:id, :name, :path, :value, :type)
        ON CONFLICT (id)
        DO UPDATE SET
        name = :name,
        path = :path,
        value = :value,
        type = :type
    """

    query_params = []

    for id, data in artifacts.items():
        if data["path"]:
            # set value to null if path is specified
            data["value"] = DEFAULT_VALUES["artifact"]["value"]
        query_params.append(
            {
                "id": id,
                "name": data["name"],
                "path": data["path"],
                "value": json.dumps(data["value"]),
                "type": data["type"],
            }
        )

    db.executemany(query, query_params)


def save_artifact_groups(db, artifact_groups, sections):
    query = """
        INSERT INTO ArtifactGroupId (id, name, data, "order")
        VALUES (:id, :name, :data, :order)
        ON CONFLICT (id)
        DO UPDATE SET
        name = :name,
        data = :data,
        "order" = :order
    """
    query_params = []
    for k, group in artifact_groups.items():
        order = get_artifact_group_idx(k, sections)
        if order is None:
            continue
        data_keys = group.keys() - {"name", "artifactTransforms"}
        query_params.append(
            {
                "id": k,
                "name": group["name"],
                "data": json.dumps(filter_dict(group, data_keys)),
                "order": order,
            }
        )
    db.executemany(query, query_params)

    placeholders = ", ".join(["?"] * len(artifact_groups))
    query = f"""
        DELETE FROM ArtifactGroup
        WHERE idid IN ({placeholders})
    """
    query_params = list(artifact_groups.keys())
    db.execute(query, query_params)

    query = """
        INSERT INTO ArtifactGroup (idid, artifactId, data, "order")
        VALUES (:idid, :artifactId, :data, :order)
    """

    query_params = []
    for id, group in artifact_groups.items():
        for order, artifactTransform in enumerate(group["artifactTransforms"]):
            data_keys = artifactTransform.keys() - {"artifactId"}
            query_params.append(
                {
                    "idid": id,
                    "artifactId": artifactTransform["artifactId"],
                    "data": json.dumps(filter_dict(artifactTransform, data_keys)),
                    "order": order,
                }
            )

    db.executemany(query, query_params)


def get_artifact_group_idx(artifact_group_id, sections):
    for section in sections.values():
        try:
            if "artifactGroupIds" in section:
                idx = section["artifactGroupIds"].index(artifact_group_id)
                return idx
        except ValueError:
            continue
    return None
