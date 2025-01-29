import json

from setta.database.db.sectionVariants.utils import (
    with_ev_entry_defaults,
    with_section_variant_defaults,
)


def load_section_variants(db, ids):
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        SELECT SectionVariantId.id, SectionVariantId.name, SectionVariantId.data, SectionVariantId.selectedItem, SectionVariantId.codeInfoColId, SectionVariantEV.codeInfoId, SectionVariantEV.data as valueData
        FROM SectionVariantId
        LEFT JOIN SectionVariantEV
        ON SectionVariantId.id = SectionVariantEV.idid
        WHERE SectionVariantId.id in ({placeholders})
    """
    db.execute(query, ids)
    output = {}
    for row in db.fetchall():
        id = row["id"]
        if id not in output:
            output[id] = with_section_variant_defaults(
                name=row["name"],
                selectedItem=row["selectedItem"],
                codeInfoColId=row["codeInfoColId"],
                **json.loads(row["data"]),
            )
        if row["valueData"]:
            output[id]["values"][row["codeInfoId"]] = with_ev_entry_defaults(
                **json.loads(row["valueData"])
            )

    query = f"""
        SELECT SectionVariantId.id, SectionVariantChildren.childId, SectionVariantChildren."order"
        FROM SectionVariantId
        JOIN SectionVariantChildren
        ON SectionVariantId.id = SectionVariantChildren.idid
        WHERE SectionVariantId.id in ({placeholders})
        ORDER BY SectionVariantChildren."order"
    """
    db.execute(query, ids)
    for row in db.fetchall():
        output[row["id"]]["children"].append(row["childId"])

    query = f"""
        SELECT SectionVariantId.id, SectionVariantParamSweep.selectedItemGroupNum, SectionVariantParamSweep.paramInfoGroupNum, SectionVariantParamSweep.selectedItem, SectionVariantParamSweep.paramInfoId, SectionVariantParamSweep.value
        FROM SectionVariantId
        LEFT JOIN SectionVariantParamSweep
        ON SectionVariantId.id = SectionVariantParamSweep.idid
        WHERE SectionVariantId.id in ({placeholders})
        ORDER BY SectionVariantParamSweep."order"
    """
    db.execute(query, ids)
    for row in db.fetchall():
        id = row["id"]
        if "sweep" not in output[id]:
            output[id]["sweep"] = []
        curr = output[id]["sweep"]

        selectedItemGroupNum = row["selectedItemGroupNum"]
        if selectedItemGroupNum is None:
            continue
        if len(curr) <= selectedItemGroupNum:
            curr.append({"selectedItem": row["selectedItem"], "params": []})
        curr = curr[selectedItemGroupNum]["params"]

        paramInfoGroupNum = row["paramInfoGroupNum"]
        if paramInfoGroupNum is None:
            continue
        if len(curr) <= paramInfoGroupNum:
            curr.append({"paramInfoId": row["paramInfoId"], "values": []})
        curr = curr[paramInfoGroupNum]["values"]

        if row["value"] is not None:
            curr.append(row["value"])

    query = f"""
        SELECT
            SectionVariantId.id,
            SectionVariantRunGroup.sectionId,
            SectionVariantRunGroup.parentVariantId,
            SectionVariantRunGroup.selected,
            SectionVariantRunGroupVersions.versionId,
            SectionVariantRunGroupVersions.selected as version_selected,
            SectionVariantRunGroupParamSweeps.sweepId,
            SectionVariantRunGroupParamSweeps.selected as sweep_selected
        FROM SectionVariantId
        LEFT JOIN SectionVariantRunGroup
            ON SectionVariantId.id = SectionVariantRunGroup.idid
        LEFT JOIN SectionVariantRunGroupVersions
            ON SectionVariantRunGroup.idid = SectionVariantRunGroupVersions.idid
            AND SectionVariantRunGroup.sectionId = SectionVariantRunGroupVersions.sectionId
            AND (
                (SectionVariantRunGroup.parentVariantId IS NULL AND SectionVariantRunGroupVersions.parentVariantId IS NULL)
                OR SectionVariantRunGroup.parentVariantId = SectionVariantRunGroupVersions.parentVariantId
            )
        LEFT JOIN SectionVariantRunGroupParamSweeps
            ON SectionVariantRunGroup.idid = SectionVariantRunGroupParamSweeps.idid
            AND SectionVariantRunGroup.sectionId = SectionVariantRunGroupParamSweeps.sectionId
            AND (
                (SectionVariantRunGroup.parentVariantId IS NULL AND SectionVariantRunGroupParamSweeps.parentVariantId IS NULL)
                OR SectionVariantRunGroup.parentVariantId = SectionVariantRunGroupParamSweeps.parentVariantId
            )
        WHERE SectionVariantId.id in ({placeholders})
    """
    db.execute(query, ids)
    for row in db.fetchall():
        id = row["id"]
        if "runGroup" not in output[id]:
            output[id]["runGroup"] = {}
        curr = output[id]["runGroup"]
        sectionId = row["sectionId"]

        if not sectionId:
            continue

        if sectionId not in curr:
            curr[sectionId] = {}
        if row["parentVariantId"] not in curr[sectionId]:
            curr[sectionId][row["parentVariantId"]] = {
                "selected": bool(row["selected"]),
                "versions": {},
                "paramSweeps": {},
            }

        # Add version data if present
        if row["versionId"] is not None:
            curr[sectionId][row["parentVariantId"]]["versions"][
                row["versionId"]
            ] = bool(row["version_selected"])

        # Add param sweep data if present
        if row["sweepId"] is not None:
            curr[sectionId][row["parentVariantId"]]["paramSweeps"][
                row["sweepId"]
            ] = bool(row["sweep_selected"])

    return output
