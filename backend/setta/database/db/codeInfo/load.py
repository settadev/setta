import json

from setta.database.db.codeInfo.utils import (
    with_code_info_col_defaults,
    with_code_info_defaults,
)


def load_code_info(db, codeInfoColIds):
    placeholders = ", ".join(["?"] * len(codeInfoColIds))
    query = f"""
        WITH RECURSIVE DESCENDANTS AS (
            SELECT c.idid, c.parentId, c.childId, c."order"
            FROM CodeInfoCol c
            WHERE c.idid IN ({placeholders})

            UNION

            SELECT X.idid, X.parentId, X.childId, X."order"
            FROM CodeInfoCol X
            JOIN DESCENDANTS d ON X.parentId = d.childId AND X.idid = d.idid
        )
        SELECT * FROM DESCENDANTS
        ORDER BY idid, "order";
    """
    db.execute(query, tuple(codeInfoColIds))
    results = db.fetchall()
    all_ids = set()
    code_info_cols = {}
    for k in codeInfoColIds:
        code_info_cols[k] = with_code_info_col_defaults()
    for row in results:
        (codeInfoColId, parentId, childId, _) = row
        if parentId:
            all_ids.add(parentId)
        all_ids.add(childId)
        children_dict = code_info_cols[codeInfoColId]["children"]
        if parentId not in children_dict:
            children_dict[parentId] = []
        children_dict[parentId].append(childId)
        if childId not in children_dict:
            children_dict[childId] = []

    all_ids = list(all_ids)

    placeholders = ", ".join(["?"] * len(all_ids))
    query = f"""
        SELECT * FROM CodeInfo
        WHERE id IN ({placeholders})
    """
    db.execute(query, all_ids)
    code_info = {}
    for row in db.fetchall():
        code_info[row["id"]] = with_code_info_defaults(
            id=row["id"], name=row["name"], **json.loads(row["data"])
        )

    return code_info, code_info_cols


def load_code_info_cols(db, sectionVariants):
    collection_ids = [
        v["codeInfoColId"] for v in sectionVariants.values() if v["codeInfoColId"]
    ]
    return load_code_info(db, collection_ids)
