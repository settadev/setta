import json


def load_uitypes(db, ids):
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        SELECT id, type, data
        FROM UIType
        WHERE UIType.id in ({placeholders})
    """

    db.execute(query, ids)
    output = {}
    for row in db.fetchall():
        output[row["id"]] = {
            "id": row["id"],
            "type": row["type"],
            **json.loads(row["data"]),
        }
    return output


def load_uitypecols(db, ids):
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        SELECT UITypeColId.id, UITypeCol.codeInfoId, UITypeCol.uiTypeId, GROUP_CONCAT(UIType.id) as nonPresetUITypeIds
        FROM UITypeColId
        LEFT JOIN UITypeCol
        ON UITypeColId.id = UITypeCol.idid
        LEFT JOIN UIType
        ON
            UITypeColId.id = UIType.asNonPresetForUITypeColId
        AND
            UITypeCol.codeInfoId = UIType.asNonPresetForCodeInfoId
        WHERE UITypeColId.id in ({placeholders})
        GROUP BY UITypeColId.id, UITypeCol.codeInfoId
    """
    db.execute(query, ids)
    output = {}
    for row in db.fetchall():
        if row["id"] not in output:
            output[row["id"]] = {}
        output[row["id"]][row["codeInfoId"]] = {
            "uiTypeId": row["uiTypeId"],
            "nonPresetUITypeIds": row["nonPresetUITypeIds"].split(",")
            if row["nonPresetUITypeIds"]
            else [],
        }
    for v in output.values():
        v.pop(None, None)
    return output
