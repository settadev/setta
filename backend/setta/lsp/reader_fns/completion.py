from setta.code_gen.python.position_line_col import line_col_to_position_batch


def process_completion_response(response, metadata):
    content = []
    if response["result"] and response["result"]["items"]:
        code = metadata["code"]
        content = process_completion(
            code,
            response["result"]["items"],
            metadata["generated_var_names"],
            metadata["referencable_var_names"],
            metadata["cursor_offset"],
        )
    return content


def process_completion(
    code, items, generated_var_names, referencable_var_names, cursor_offset
):
    content = []
    line_cols = []
    content_idx_with_text_edit = {}
    for x in items:
        if x["label"] in generated_var_names:
            continue
        c = {"label": x["label"], "type": type_mapping[x["kind"]]}
        if "textEdit" in x:
            content_idx_with_text_edit[len(content)] = len(line_cols)
            r = x["textEdit"]["range"]
            line_cols.append(
                (
                    r["start"]["line"],
                    r["start"]["character"],
                )
            )
            line_cols.append((r["end"]["line"], r["end"]["character"]))

        content.append(c)

    if len(line_cols) > 0:
        # use the raw line/character values because the code
        # contains generated code
        positions = line_col_to_position_batch(code, line_cols)
        for i, j in content_idx_with_text_edit.items():
            # shift it back by cursor_offset so that it's ready
            # for the frontend
            content[i]["from"] = positions[j] - cursor_offset
            content[i]["to"] = positions[j + 1] - cursor_offset

    for x in referencable_var_names:
        content.append({"label": x, "type": "variable"})

    return content


type_mapping = {
    1: "File",
    2: "Module",
    3: "Namespace",
    4: "Package",
    5: "Class",
    6: "Method",
    7: "Property",
    8: "Field",
    9: "Constructor",
    10: "Enum",
    11: "Interface",
    12: "Function",
    13: "Variable",
    14: "Constant",
    15: "String",
    16: "Number",
    17: "Boolean",
    18: "Array",
    19: "Object",
    20: "Key",
    21: "Null",
    22: "EnumMember",
    23: "Struct",
    24: "Event",
    25: "Operator",
    26: "TypeParameter",
}
