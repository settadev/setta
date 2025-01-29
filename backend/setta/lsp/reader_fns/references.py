from setta.code_gen.python.position_line_col import line_col_to_position_batch


def process_references_response(response, metadata):
    content = []
    if response["result"] and len(response["result"]) > 0:
        code = metadata["code"]
        line_cols = []
        for x in response["result"]:
            line_cols.append(
                (
                    x["range"]["start"]["line"],
                    x["range"]["start"]["character"],
                )
            )
            line_cols.append(
                (x["range"]["end"]["line"], x["range"]["end"]["character"])
            )
        positions = line_col_to_position_batch(code, line_cols)
        position_offset = metadata["position_offset"]
        for idx in range(0, len(positions), 2):
            startPos = positions[idx] - position_offset
            endPos = positions[idx + 1] - position_offset
            content.append(
                {
                    "startPos": startPos,
                    "endPos": endPos,
                }
            )

    return_id = metadata["return_id"]
    num_messages = metadata["num_messages"]
    content = {"positions": content, "numMessages": num_messages}
    return content, return_id
