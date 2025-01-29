from setta.code_gen.python.position_line_col import line_col_to_position_batch


def process_document_highlight_response(response, metadata):
    content = []
    # if it's not None, then it's a variable or import or something like that
    if response["result"]:
        # the response doesn't include uri for some reason,
        # so we keep track of it manually
        code = metadata["code"]

        for x in response["result"]:
            r = x["range"]
            positions = line_col_to_position_batch(
                code,
                [
                    (r["start"]["line"], r["start"]["character"]),
                    (r["end"]["line"], r["end"]["character"]),
                ],
            )
            content.append({"startPos": positions[0], "endPos": positions[1]})
    return_id = metadata["return_id"]
    num_messages = metadata["num_messages"]
    content = {"positions": content, "numMessages": num_messages}
    return content, return_id
