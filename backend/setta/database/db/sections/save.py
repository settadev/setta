import json

from setta.utils.constants import DEFAULT_VALUES, SECTION_TABLE_DATA_JSON_FIELDS
from setta.utils.utils import filter_dict, replace_null_keys_with_none


def save_sections(db, sections, section_variants):
    query = """
        INSERT INTO Section (
            id,
            name,
            data,
            uiTypeId,
            uiTypeColId,
            defaultVariantId
        )
        VALUES (
            :id,
            :name,
            :data,
            :uiTypeId,
            :uiTypeColId,
            :defaultVariantId
        )
        ON CONFLICT (id)
        DO UPDATE SET
            name = :name,
            data = :data,
            uiTypeId = :uiTypeId,
            uiTypeColId = :uiTypeColId,
            defaultVariantId = :defaultVariantId
    """

    query_params = [
        {
            "id": s["id"],
            "name": s["name"],
            "data": json.dumps(
                filter_dict(
                    s, SECTION_TABLE_DATA_JSON_FIELDS, DEFAULT_VALUES["section"]
                )
            ),
            "uiTypeId": s["uiTypeId"],
            "uiTypeColId": s["uiTypeColId"],
            "defaultVariantId": s["defaultVariantId"],
        }
        for s in sections.values()
    ]

    db.executemany(query, query_params)

    ids = [s["id"] for s in sections.values()]
    placeholders = ", ".join(["?"] * len(ids))
    query = f"""
        UPDATE SectionVariantId
        SET originSectionId = null
        WHERE originSectionId IN ({placeholders})
    """
    db.execute(query, ids)

    query = """
        UPDATE SectionVariantId
        SET originSectionId = :sectionId
        WHERE id = :variantId
    """
    query_params = []
    for s in sections.values():
        for variantId in s["variantIds"]:
            query_params.append({"variantId": variantId, "sectionId": s["id"]})
    db.executemany(query, query_params)

    query = f"""
        UPDATE UIType
        SET asNonPresetForSectionId = null
        WHERE asNonPresetForSectionId IN ({placeholders})
    """
    db.execute(query, ids)

    query = """
        UPDATE UIType
        SET asNonPresetForSectionId = :sectionId
        WHERE id = :uiTypeId
    """
    query_params = []
    for s in sections.values():
        for uiTypeId in s["nonPresetUITypeIds"]:
            query_params.append({"uiTypeId": uiTypeId, "sectionId": s["id"]})
    db.executemany(query, query_params)

    query = """
        UPDATE Section
        SET paramSweepSectionId = :paramSweepSectionId
        WHERE id = :id
    """
    db.executemany(
        query,
        [
            {"id": s["id"], "paramSweepSectionId": s["paramSweepSectionId"]}
            for s in sections.values()
        ],
    )

    query = f"""
        UPDATE ArtifactGroupId
        SET originSectionId = null
        WHERE originSectionId IN ({placeholders})
    """
    db.execute(query, ids)

    query = """
        UPDATE ArtifactGroupId
        SET originSectionId = :sectionId
        WHERE id = :artifactGroupId
    """
    for s in sections.values():
        for a in s["artifactGroupIds"]:
            query_params.append(
                {
                    "sectionId": s["id"],
                    "artifactGroupId": a,
                }
            )
    db.executemany(query, query_params)

    # delete children
    placeholders = ", ".join(["?"] * len(section_variants))
    query = f"""
        DELETE FROM SectionVariantChildren
        WHERE idid IN ({placeholders});
    """
    query_params = list(section_variants.keys())
    db.execute(query, query_params)

    # add children
    query = """
        INSERT INTO SectionVariantChildren (idid, childId, "order")
        VALUES (:idid, :childId, :order)
    """
    query_params = []
    for idid, variant in section_variants.items():
        query_params.extend(
            [
                {"idid": idid, "childId": x, "order": i}
                for i, x in enumerate(variant["children"])
            ]
        )
    db.executemany(query, query_params)

    placeholders = ", ".join(["?"] * len(section_variants))
    query = f"""
        DELETE FROM SectionVariantRunGroup
        WHERE idid IN ({placeholders})
    """
    query_params = list(section_variants.keys())
    db.execute(query, query_params)

    run_group_query_params = []
    run_group_versions_query_params = []
    run_group_param_sweeps_query_params = []
    for idid, variant in section_variants.items():
        variant = replace_null_keys_with_none(variant)
        for sectionId, detailsForSection in variant["runGroup"].items():
            for parentVariantId, detailsForParentVariant in detailsForSection.items():
                base_query_params = {
                    "idid": idid,
                    "sectionId": sectionId,
                    "parentVariantId": parentVariantId,
                }
                run_group_query_params.append(
                    {
                        **base_query_params,
                        "selected": detailsForParentVariant["selected"],
                    }
                )
                for versionId, selected in detailsForParentVariant["versions"].items():
                    run_group_versions_query_params.append(
                        {
                            **base_query_params,
                            "versionId": versionId,
                            "selected": selected,
                        }
                    )
                for sweepId, selected in detailsForParentVariant["paramSweeps"].items():
                    run_group_param_sweeps_query_params.append(
                        {**base_query_params, "sweepId": sweepId, "selected": selected}
                    )

    query = """
        INSERT INTO SectionVariantRunGroup (idid, sectionId, parentVariantId, selected)
        VALUES (:idid, :sectionId, :parentVariantId, :selected)
    """
    db.executemany(query, run_group_query_params)

    query = """
        INSERT INTO SectionVariantRunGroupVersions (idid, sectionId, parentVariantId, versionId, selected)
        VALUES (:idid, :sectionId, :parentVariantId, :versionId, :selected)
    """
    db.executemany(query, run_group_versions_query_params)

    query = """
        INSERT INTO SectionVariantRunGroupParamSweeps (idid, sectionId, parentVariantId, sweepId, selected)
        VALUES (:idid, :sectionId, :parentVariantId, :sweepId, :selected)
    """
    db.executemany(query, run_group_param_sweeps_query_params)
