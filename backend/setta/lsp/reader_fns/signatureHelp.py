import re

import docstring_parser

from setta.utils.constants import ParameterPassingStyle


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
    keyword_only_indicator_idx = -1

    for idx, (name, _, _) in enumerate(params):
        if name == "/":
            positional_only_indicator_idx = idx
        if name == "*":
            keyword_only_indicator_idx = idx

    for idx, (name, default, description) in enumerate(params):
        if name in [None, "/", "*", "", "..."]:
            continue

        passingStyle = get_passing_style(
            idx, positional_only_indicator_idx, keyword_only_indicator_idx, name
        )

        if not default:
            default = ""

        if not description:
            description = docstring.get(name, {}).get("description", "")

        # Append parsed information to list
        param_info_list.append(
            {
                "name": name.lstrip("*"),
                "defaultVal": default,
                "description": description,
                "passingStyle": passingStyle,
            }
        )

    return param_info_list


def get_docstring_parser_param_proposals(_, docstring):
    return [(k, v["default"], v["description"]) for k, v in docstring.items()]


def get_pyright_param_proposals(signature, _):
    parameters = signature["parameters"]
    params = [(p["label"], p["documentation"]["value"]) for p in parameters]
    proposals = []
    for param, description in params:
        name, _, default = parse_param_name(param)
        proposals.append((name, default, description))

    return proposals


def parse_param_name(param_string):
    # Special cases for / and *
    if param_string in ["/", "*"]:
        return param_string, None, None

    # Extract default value if present
    default_value = None
    if "=" in param_string:
        param_string, default_part = param_string.split("=", 1)
        default_value = default_part.strip()

    # Extract type annotation if present
    type_annotation = None
    if ":" in param_string:
        param_string, type_part = param_string.split(":", 1)
        type_annotation = type_part.strip()

    # Variable name is what remains, trimmed of whitespace
    name = extract_variable_name(param_string)

    return name, type_annotation, default_value


def extract_variable_name(code_string):
    # Find potential variable names including * and ** prefixes
    potential_names = re.findall(r"\*{1,2}?[a-zA-Z_]\w*|\b[a-zA-Z_]\w*\b", code_string)

    # For names with * or **, we don't need to check isidentifier() since they're not standard identifiers
    # Just return the first match
    if potential_names:
        return potential_names[0]
    return None


def get_passing_style(
    idx, positional_only_indicator_idx, keyword_only_indicator_idx, name
):
    if name.startswith("**"):  # Check for **kwargs first
        return ParameterPassingStyle.KWARGS
    if name.startswith("*"):  # Check for *args second
        return ParameterPassingStyle.ARGS
    if 0 <= idx < positional_only_indicator_idx:  # Then check position
        return ParameterPassingStyle.POSITIONAL_ONLY
    if keyword_only_indicator_idx > -1 and idx > keyword_only_indicator_idx:
        return ParameterPassingStyle.KEYWORD_ONLY
    return ParameterPassingStyle.DEFAULT
