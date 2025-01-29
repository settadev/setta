import re

import docstring_parser


def process_signature_help_response(response):
    content = None
    if response["result"]:
        content = parse_signature(response["result"]["signatures"][0])
    return content


def parse_signature(signature):
    docstring = process_docstring(signature)
    param_info_list = wrapper_parse_signature(
        signature, docstring, get_pyright_param_proposals
    )
    if len(param_info_list) == 0:
        param_info_list = wrapper_parse_signature(
            signature, docstring, get_docstring_parser_param_proposals
        )
    documentation = signature.get("documentation", {"value": ""})["value"]
    return [documentation, param_info_list]


def process_docstring(signature):
    if "documentation" in signature:
        parsed = docstring_parser.parse(signature["documentation"]["value"])
        return {
            extract_variable_name(v.arg_name): {
                "default": v.default,
                "description": v.description,
            }
            for v in parsed.params
        }
    return {}


def wrapper_parse_signature(signature, docstring, get_proposed_params):
    params = get_proposed_params(signature, docstring)
    param_info_list = []
    positional_only_indicator_idx = -1

    for idx, (name, default, description) in enumerate(params):
        if name == "/":
            positional_only_indicator_idx = idx
            continue
        if name in [None, "", "*", "..."]:
            continue

        if not default:
            default = ""

        if not description:
            description = docstring.get(name, {}).get("description", "")

        # Append parsed information to list
        param_info_list.append(
            {
                "name": name,
                "defaultVal": default,
                "description": description,
                "positionalOnly": False,
            }
        )

    for idx in range(0, positional_only_indicator_idx):
        param_info_list[idx]["positionalOnly"] = True

    return param_info_list


def get_docstring_parser_param_proposals(_, docstring):
    return [(k, v["default"], v["description"]) for k, v in docstring.items()]


def get_pyright_param_proposals(signature, _):
    parameters = signature["parameters"]
    params = [(p["label"], p["documentation"]["value"]) for p in parameters]
    proposals = []
    for param, description in params:
        # Extract parameter name and default value
        if param.startswith("/"):
            proposals.append((param, None, None))
            continue
        parts = param.split("=")
        name = extract_variable_name(parts[0].strip())
        default = parts[1].strip() if len(parts) > 1 else None
        proposals.append((name, default, description))

    return proposals


def extract_variable_name(code_string):
    # Find potential variable names
    potential_names = re.findall(r"\b[a-zA-Z_]\w*\b", code_string)

    # Return the first valid identifier
    return next((name for name in potential_names if name.isidentifier()), None)
