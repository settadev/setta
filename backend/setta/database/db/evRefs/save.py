def save_ev_refs(db, section_variants, code_info):
    placeholders = ", ".join(["?"] * len(section_variants))
    query = f"""
        DELETE FROM EVRefs
        WHERE variantId IN ({placeholders})
    """
    query_params = list(section_variants.keys())
    db.execute(query, query_params)

    placeholders = ", ".join(["?"] * len(code_info))
    query = f"""
        DELETE FROM EVRefs
        WHERE codeInfoId IN ({placeholders})
    """
    query_params = list(code_info.keys())
    db.execute(query, query_params)

    query = """
        INSERT INTO EVRefs (variantId, codeInfoId, referringParamInfoId, sectionId, paramInfoId, isArgsObj, startPos, keyword)
        VALUES (:variantId, :codeInfoId, :referringParamInfoId, :sectionId, :paramInfoId, :isArgsObj, :startPos, :keyword)
    """

    query_params = []
    for variantId, variant in section_variants.items():
        evRefs = variant["evRefs"]
        query_params.extend(
            [
                {
                    "variantId": variantId,
                    "codeInfoId": None,
                    "referringParamInfoId": None,
                    **x,
                }
                for x in evRefs
            ]
        )

        for referringParamInfoId, details in variant["values"].items():
            evRefs = details["evRefs"]
            query_params.extend(
                [
                    {
                        "variantId": variantId,
                        "codeInfoId": None,
                        "referringParamInfoId": referringParamInfoId,
                        **x,
                    }
                    for x in evRefs
                ]
            )

    for codeInfoId, codeInfo in code_info.items():
        evRefs = codeInfo["evRefs"]
        query_params.extend(
            [
                {
                    "variantId": None,
                    "codeInfoId": codeInfoId,
                    "referringParamInfoId": None,
                    **x,
                }
                for x in evRefs
            ]
        )

    db.executemany(query, query_params)


def save_template_vars(db, section_variants):
    placeholders = ", ".join(["?"] * len(section_variants))
    query = f"""
        DELETE FROM TemplateVars
        WHERE variantId IN ({placeholders})
    """
    query_params = list(section_variants.keys())
    db.execute(query, query_params)

    query = """
        INSERT INTO TemplateVars (variantId, sectionId, startPos, keyword)
        VALUES (:variantId, :sectionId, :startPos, :keyword)
    """

    query_params = []
    for variantId, variant in section_variants.items():
        query_params.extend(
            [
                {
                    "variantId": variantId,
                    **x,
                }
                for x in variant["templateVars"]
            ]
        )

    db.executemany(query, query_params)
