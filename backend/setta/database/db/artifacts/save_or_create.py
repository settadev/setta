import json

from setta.database.utils import create_new_id


def get_artifact_value_for_db(artifact, saveTo):
    if saveTo == "disk":
        return None
    return json.dumps(artifact["value"])


def save_or_create_artifacts(db, artifacts, saveTo):
    # Convert to parameters, using new IDs for anything without an ID
    params = [
        (
            art.get("id") or create_new_id(),
            art["name"],
            art["path"],
            get_artifact_value_for_db(art, saveTo),
            art["type"],
        )
        for art in artifacts
    ]

    # Do the upsert
    db.executemany(
        """
        INSERT INTO Artifact (id, name, path, value, type)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE
        SET name=excluded.name,
            path=excluded.path,
            value=excluded.value,
            type=excluded.type
        ON CONFLICT (name, path, type) DO UPDATE
        SET value=excluded.value
        """,
        params,
    )

    # Get all the actual IDs
    id_map = lookup_artifacts(db, artifacts)
    return [id_map[(art["name"], art["path"], art["type"])] for art in artifacts]


def lookup_artifacts(db, artifacts):
    """
    Look up existing artifacts by name/path/type.
    Returns a map of (name, path, type) -> id for found artifacts.
    """
    if not artifacts:
        return {}

    lookup_params = [(art["name"], art["path"], art["type"]) for art in artifacts]
    placeholders = " OR ".join("(name=? AND path=? AND type=?)" for _ in artifacts)

    db.execute(
        f"SELECT name, path, type, id FROM Artifact WHERE {placeholders}",
        [param for params in lookup_params for param in params],
    )
    rows = db.fetchall()

    return {(row["name"], row["path"], row["type"]): row["id"] for row in rows}


def get_artifact_ids(db, artifacts):
    id_map = lookup_artifacts(db, artifacts)
    return [id_map.get((art["name"], art["path"], art["type"])) for art in artifacts]
