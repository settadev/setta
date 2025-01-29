import re

from setta.code_gen.export_selected import get_gen_code_template_var
from setta.code_gen.python.position_line_col import line_col_to_position_batch


def process_diagnostics_response(response, get_code_metadata):
    params = response["params"]
    metadata = get_code_metadata(params["uri"])
    if not metadata["needsDiagnostics"] or metadata["version"] != params["version"]:
        return None, False

    convert_diagnostic_line_cols_to_positions(metadata["code"], params["diagnostics"])

    code_split = metadata["code"].split("\n")
    diagnostics = process_diagnostics(
        params["diagnostics"],
        code_split,
        metadata["codeJson"],
        metadata["ref_template_var_positions"],
    )

    return {
        "projectConfigId": metadata["projectConfigId"],
        "codeSectionId": metadata["codeSectionId"],
        "diagnostics": diagnostics,
    }, True


def process_diagnostics(diagnostics, code_split, codeJson, ref_template_var_positions):
    output = []
    gen_code_template_var = get_gen_code_template_var(
        ref_template_var_positions["templateVars"]
    )
    if gen_code_template_var:
        gen_code_start = gen_code_template_var["startPos"]
        gen_code_end = gen_code_start + len(gen_code_template_var["value"])
    for d in diagnostics:
        start, end = d["range"]["start"], d["range"]["end"]
        if gen_code_template_var and gen_code_start <= start["position"] < gen_code_end:
            result = process_gen_code_diagnostic(d, code_split, codeJson, start, end)
            output.extend(result)
        # TODO: process diagnostics for non-generated code:
        # else:
        #     output.append(d)

    return output


def process_gen_code_diagnostic(d, code_split, codeJson, start, end):
    if "code" not in d or not codeJson:
        return []
    if d["code"] == "reportArgumentType":
        problem_var = code_split[start["line"]][
            start["character"] : end["character"]
        ].strip()
        return [get_message_with_ids(codeJson, problem_var, d["message"])]
    elif d["code"] == "reportCallIssue" and "missing" in d["message"]:
        missing_params = extract_parameters(d["message"])
        # get variable to the left of the equal sign
        assigned_to = code_split[start["line"]].split("=")[0].strip()
        unusedParams = codeJson[assigned_to]["value"]["unusedParams"]
        output = []
        for potential_problem_var in unusedParams:
            if codeJson[potential_problem_var]["name"] in missing_params:
                output.append(
                    get_message_with_ids(codeJson, potential_problem_var, d["message"])
                )
        return output
    return []


def get_message_with_ids(code_json, problem_var, message):
    section_id, param_info_id = (
        code_json[problem_var]["sectionId"],
        code_json[problem_var]["paramInfoId"],
    )
    return {"sectionId": section_id, "paramInfoId": param_info_id, "message": message}


def extract_parameters(error_string):
    pattern = r'"([^"]+)"'
    parameters = re.findall(pattern, error_string)
    return parameters


def convert_diagnostic_line_cols_to_positions(code, diagnostics):
    line_cols = []
    for d in diagnostics:
        x = d["range"]["start"]
        line_cols.append((x["line"], x["character"]))
        x = d["range"]["end"]
        line_cols.append((x["line"], x["character"]))

    positions = line_col_to_position_batch(code, line_cols)

    for i, d in enumerate(diagnostics):
        d["range"]["start"]["position"] = positions[i * 2]
        d["range"]["end"]["position"] = positions[(i * 2) + 1]
