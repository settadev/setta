from setta.code_gen.export_selected import get_gen_code_template_var
from setta.code_gen.python.make_parseable import make_parseable
from setta.utils.utils import replace_at_positions

from ...utils.constants import C, ParameterPassingStyle
from ..utils import push_var_deep
from .ast_utils import find_missing_imports, find_top_level_symbols


def get_import_text(code, chars_before_template_var):
    imports = [f"import {x}" for x in find_missing_imports(code)]
    return f"\n{chars_before_template_var}".join(imports)


def get_mappings(var_names, selected, is_dict=False, passingStyles=None):
    if passingStyles is None:
        passingStyles = {}
    output = ""
    relative_positions = []
    curr_position = 0
    for idx, v in enumerate(var_names):
        prefix = "" if idx == 0 else ", "
        if passingStyles.get(v) == ParameterPassingStyle.ARGS:
            prefix = "*"
        elif passingStyles.get(v) == ParameterPassingStyle.KWARGS:
            prefix = "**"
        elif is_dict or (
            passingStyles.get(v) == ParameterPassingStyle.DEFAULT
            or passingStyles.get(v) == ParameterPassingStyle.KEYWORD_ONLY
        ):
            var_decl_prefix = var_declaration(
                selected[v]["name"],
                v,
                is_dict,
                return_prefix=True,
                is_callable_param=True,
            )
            prefix += var_decl_prefix

        curr_output = f"{prefix}{v}"
        relative_positions.append({"startPos": curr_position + len(prefix), "value": v})
        curr_position += len(curr_output)
        output += curr_output

    return output, relative_positions


def get_dict_contents(var_names, selected):
    return get_mappings(var_names, selected, is_dict=True)


def get_callable_params(var_names, passingStyles, selected):
    return get_mappings(var_names, selected, passingStyles=passingStyles)


def get_list_of_vars(var_names):
    return get_mappings(var_names, None)


def get_boolean(value):
    return "True" if value == "true" else "False"


def var_declaration(
    var_name, value, is_dict=False, return_prefix=False, is_callable_param=False
):
    if is_dict:
        prefix = f'"{var_name}": '
    else:
        prefix = f"{var_name}=" if is_callable_param else f"{var_name} = "
    if return_prefix:
        return prefix
    return f"{prefix}{value}"


# returns the value and a relative_positions array (for populating some ref_var_name_positions) or None if not applicable
# TODO: remove str(x["value"]). I don't think it's necessary since x["value"] should always be a string already.
def get_value(x, selected):
    type_value = x["type"]
    if (
        type_value == C.TEXT
        or type_value == C.SLIDER
        or type_value == C.DROPDOWN
        or type_value == C.PASSWORD
    ):
        output = str(x["value"])
        relative_positions = []
    elif type_value == C.SWITCH:
        output = str(get_boolean(x["value"]))
        relative_positions = []
    elif type_value == C.COLOR_PICKER:
        output = f'"{x["value"]}"'
        relative_positions = []
    elif type_value == C.TEXT_BLOCK:
        output = f'"""{x["value"]}"""'
        relative_positions = []
    elif type_value == C.SECTION:
        if not x["value"]["callable"]:
            output, relative_positions = get_dict_contents(
                x["value"]["usedParams"], selected
            )
            prefix = "{"
            output = prefix + output + "}"
            prefix_len = len(prefix)
        else:
            output, relative_positions = get_callable_params(
                x["value"]["usedParams"], x["value"]["passingStyles"], selected
            )
            prefix = f"{x['value']['callable']}("
            output = f"{prefix}{output})"
            prefix_len = len(prefix)
        relative_positions = [
            {**r, "startPos": r["startPos"] + prefix_len} for r in relative_positions
        ]
    elif type_value == C.LIST_ROOT:
        output, relative_positions = get_list_of_vars(x["value"])
        output = f"[{output}]"
        relative_positions = [
            {**r, "startPos": r["startPos"] + 1} for r in relative_positions
        ]
    elif type_value in [C.DICT_ROOT, C.GROUP, C.NESTED_PARAM]:
        output, relative_positions = get_dict_contents(x["value"], selected)
        output = "{" + output + "}"
        relative_positions = [
            {**r, "startPos": r["startPos"] + 1} for r in relative_positions
        ]
    else:
        output = None
        relative_positions = []

    return output, relative_positions


def create_line(var_name, x, selected, force_appear):
    value, relative_positions = get_value(x, selected)
    # include any ref positions that were calculated in export_selected,
    # because they too need to be shifted by the length of the variable declaration
    relative_positions.extend(x["ref_var_name_positions"])
    if value or force_appear:
        prefix = var_declaration(var_name, value, return_prefix=True)
        prefix_len = len(prefix)
        value = f"{prefix}{value}"
        relative_positions = [
            {**r, "startPos": r["startPos"] + prefix_len} for r in relative_positions
        ]
    return value, relative_positions


def generate_code(selected, chars_before_each_line, push_var_name=None):
    code = ""
    var_name_to_decl_position = {}
    last_var_name = None
    if push_var_name:
        for v in selected.values():
            if (
                isinstance(v["value"], dict)
                and push_var_name in v["value"]["unusedParams"]
            ):
                v["value"]["usedParams"].append(push_var_name)
                v["dependencies"].append(push_var_name)
                v["value"]["unusedParams"].remove(push_var_name)
        selected = [{"var_name": k, **v} for k, v in selected.items()]
        selected = push_var_deep(selected, push_var_name)
        selected = {v.pop("var_name"): v for v in selected}

    for var_name, x in selected.items():
        force_appear = push_var_name == var_name
        var_str, ref_var_name_positions = create_line(
            var_name, x, selected, force_appear=force_appear
        )
        if var_str:
            last_var_name = var_name
            # We add the "before chars" after the new line.
            # This way every var decl starts with the var instead of with the leading chars.
            var_str = construct_var_decl_with_trailing_whitespace(
                var_str, chars_before_each_line
            )
            startPos = len(code)
            var_name_to_decl_position[var_name] = (
                startPos,
                var_str,
                chars_before_each_line,
            )
            code += var_str
            x["ref_var_name_positions"] = ref_var_name_positions

    # Since each var declaration ends with the chars_before_each_line
    # we need to remove the hanging one on the final variable declaration.
    if last_var_name is not None:
        startPos, var_str, chars_after_line = var_name_to_decl_position[last_var_name]
        new_var_str = var_str.rstrip(chars_after_line)
        var_name_to_decl_position[last_var_name] = startPos, new_var_str, ""
        code = code.rstrip(chars_after_line)

    return code, var_name_to_decl_position


def construct_var_decl_with_trailing_whitespace(var_decl, chars_after_line):
    return f"{var_decl}\n{chars_after_line}"


def generate_imports(
    code,
    push_var_name,
    var_name_to_decl_position,
    template_var,
    chars_before_template_var,
):
    if push_var_name:
        startPos, var_decl, chars_after_line = var_name_to_decl_position[push_var_name]
        endPos = startPos + len(var_decl)
        parseable_str = make_parseable(code[startPos:endPos], push_var_name)
        if parseable_str is None:
            parseable_str = var_declaration(push_var_name, "None")
        var_decl = construct_var_decl_with_trailing_whitespace(
            parseable_str, chars_after_line
        )
        code = code[:startPos] + var_decl + code[endPos:]
    startPos = template_var["startPos"]
    endPos = startPos + len(template_var["keyword"])
    # remove template var to infer imports, because ast will raise syntax error
    code = code[:startPos] + code[endPos:]
    imports = get_import_text(code, chars_before_template_var)
    if len(imports) > 0:
        imports += "\n"
    return imports


def convert_var_names_to_readable_form(
    generated_code,
    var_name_to_decl_rel_position,
    exporter_obj,
    ref_template_var_positions,
    setup_code,
):
    # need to adjust line numbers and positions with prepended setup code length
    # because the setup code has been prepended to the generated code
    # after the line numbers and positions are calculated.
    setup_code_len = len(setup_code)

    all_ref_var_name_positions = [
        (r["startPos"] + setup_code_len, r["value"])
        for r in ref_template_var_positions["refs"]
    ]

    gen_code_template_var = get_gen_code_template_var(
        ref_template_var_positions["templateVars"]
    )

    # convert to global positions
    for var_name, (startPos, _, _) in var_name_to_decl_rel_position.items():
        newStartPos = startPos + setup_code_len
        if gen_code_template_var:
            newStartPos += gen_code_template_var["startPos"]
        all_ref_var_name_positions.append((newStartPos, var_name))
        for r in exporter_obj.output[var_name]["ref_var_name_positions"]:
            all_ref_var_name_positions.append((newStartPos + r["startPos"], r["value"]))

    # create nice var names for references
    top_level_symbols = find_top_level_symbols(generated_code)
    var_name_to_nice_var_name_mapping = {}
    for idx in range(len(all_ref_var_name_positions)):
        position, var_name = all_ref_var_name_positions[idx]

        # only create nice_var_name if we haven't already created it for this var_name
        if var_name not in var_name_to_nice_var_name_mapping:
            nice_name = exporter_obj.output[var_name]["name"]
            # TODO: do the same thing on the frontend to find naming conflicts
            nice_name = nice_name.replace(" ", "_")
            nice_var_name = create_nice_var_name(top_level_symbols, nice_name)
            top_level_symbols.add(nice_var_name)
            var_name_to_nice_var_name_mapping[var_name] = nice_var_name

        nice_var_name = var_name_to_nice_var_name_mapping[var_name]
        all_ref_var_name_positions[idx] = position, var_name, nice_var_name

    generated_code = replace_at_positions(generated_code, all_ref_var_name_positions)
    return generated_code


def create_nice_var_name(top_level_symbols, nice_name):
    trial_name = nice_name
    counter = 2
    while trial_name in top_level_symbols:
        trial_name = f"{nice_name}_{counter}"
        counter += 1
    return trial_name


def get_chars_in_line_before_position(string, position):
    last_newline = string.rfind("\n", 0, position)
    if last_newline != -1:
        return string[last_newline + 1 : position]
    return ""
