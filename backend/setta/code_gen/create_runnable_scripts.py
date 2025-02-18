import copy
from datetime import datetime
from pathlib import Path

from setta.code_gen.export_selected import (
    export_selected,
    get_gen_code_template_var,
    get_section_name,
    get_section_type,
    get_selected_section_variant,
)
from setta.code_gen.find_placeholders import parse_template_var, tp
from setta.code_gen.python.generate_code import (
    convert_var_names_to_readable_form,
    generate_code,
    generate_imports,
    get_chars_in_line_before_position,
)
from setta.code_gen.python.validate_imports import (
    maybe_validate_imports_and_update_code,
)
from setta.code_gen.utils import process_refs
from setta.utils.constants import (
    CODE_FOLDER,
    CODE_FOLDER_ENV_VARIABLE,
    CWD,
    USER_SETTINGS,
    C,
)
from setta.utils.utils import prune_dict


async def runCode(message, lsp_writers):
    p = message["content"]
    exporter_obj = export_selected(
        p, always_export_args_objs=False, force_include_template_var=True
    )
    folder_path = create_timestamped_folder(CODE_FOLDER)

    code_dict = await generate_final_code_for_sections(
        p,
        exporter_obj,
        lsp_writers,
        folder_path,
        do_prepend_with_setup_code=True,
        do_convert_var_names_to_readable_form=True,
    )

    if p["runCodeBlocks"] is None:
        p["runCodeBlocks"] = [
            exporter_obj.code_gen_template_var_section_details["section"]["id"]
        ]

    to_write, section_dependencies = prune_and_topological_sort(
        code_dict, p["runCodeBlocks"]
    )
    id_to_relpath = {}
    for sid in to_write:
        curr_code = code_dict[sid]
        rel_path_str = write_code_to_file(
            folder_path,
            curr_code["sanitized_full_name"],
            curr_code["code"],
            curr_code["codeLanguage"],
        )
        id_to_relpath[sid] = rel_path_str

    # Only run code that isn't referenced by other code
    run_order = [
        x for x in to_write if all(x not in y for y in section_dependencies.values())
    ]

    # create a wrapper script if there are multiple files to run
    if len(run_order) > 1:
        rel_path_str = create_wrapper_bash_script(folder_path, run_order, code_dict)
        command = codeCallStr(rel_path_str, "bash")
    else:
        sid = run_order[0]
        command = codeCallStr(id_to_relpath[sid], code_dict[sid]["codeLanguage"])

    return command


async def generate_final_code_for_sections(
    p,
    exporter_obj,
    lsp_writers,
    folder_path,
    do_prepend_with_setup_code=False,
    do_convert_var_names_to_readable_form=False,
    push_var_name=None,
    template_var_replacement_values=None,
):
    code_sections = {
        k: v for k, v in p["sections"].items() if get_section_type(p, k) == C.CODE
    }

    code_gen_template_var_section_details = (
        exporter_obj.code_gen_template_var_section_details
    )

    if (
        exporter_obj.force_include_template_var
        and code_gen_template_var_section_details["section"]["id"] is None
    ):
        code_sections[None] = code_gen_template_var_section_details["section"]
        p["sectionPathFullNames"][None] = code_sections[None]["name"]

    code_dict = {}
    for s in code_sections.values():
        if s["id"] is None:
            section_variant = code_gen_template_var_section_details["sectionVariant"]
        else:
            section_variant = get_selected_section_variant(p, s["id"])

        (
            curr_code,
            curr_section_dependencies,
            curr_var_name_to_decl_rel_position_dict,
            curr_ref_template_var_positions,
        ) = await generate_final_code_for_section(
            sectionId=s["id"],
            code=section_variant["code"],
            codeLanguage=s["codeLanguage"],
            evRefs=section_variant["evRefs"],
            templateVars=section_variant["templateVars"],
            exporter_obj=exporter_obj,
            lsp_writers=lsp_writers,
            folder_path=folder_path,
            projectConfigName=p["projectConfig"]["name"],
            do_prepend_with_setup_code=do_prepend_with_setup_code,
            do_convert_var_names_to_readable_form=do_convert_var_names_to_readable_form,
            template_var_replacement_values=template_var_replacement_values,
            push_var_name=push_var_name,
        )

        sanitized_full_name = sanitize_section_path_full_name(
            p["sectionPathFullNames"][s["id"]]
        )
        code_dict[s["id"]] = {
            "name": s["name"],
            "sanitized_full_name": sanitized_full_name,
            "code": curr_code,
            "codeLanguage": s["codeLanguage"],
            "var_name_to_decl_rel_position_dict": curr_var_name_to_decl_rel_position_dict,
            "ref_template_var_positions": curr_ref_template_var_positions,
            "section_dependencies": curr_section_dependencies,
        }

    return code_dict


async def generate_final_code_for_section(
    sectionId,
    code,
    codeLanguage,
    evRefs,
    templateVars,
    exporter_obj,
    lsp_writers,
    folder_path,
    projectConfigName=None,
    do_prepend_with_setup_code=False,
    do_convert_var_names_to_readable_form=False,
    cursor_position=None,
    template_var_replacement_values=None,
    var_name_to_decl_rel_position_dict=None,
    push_var_name=None,
):
    setup_code = ""
    section_dependencies = []
    if var_name_to_decl_rel_position_dict is None:
        var_name_to_decl_rel_position_dict = {}
    if template_var_replacement_values is None:
        template_var_replacement_values = {}

    code, evRefs, templateVars, cursor_position = preprocess_template_vars(
        code, evRefs, templateVars, cursor_position
    )

    (code, ref_template_var_positions) = process_refs(
        code,
        evRefs,
        exporter_obj.get_ref_var_name,
        cursor_position=cursor_position,
        templateVars=templateVars,
        get_template_var_replacement_value=get_template_var_replacement_value_fn(
            exporter_obj,
            folder_path,
            codeLanguage,
            section_dependencies,
            var_name_to_decl_rel_position_dict,
            template_var_replacement_values,
            push_var_name,
        ),
    )

    if USER_SETTINGS["backend"]["inferImports"]:
        (
            code,
            ref_template_var_positions["templateVars"],
        ) = await maybe_validate_imports_and_update_code(
            sectionId, code, ref_template_var_positions, lsp_writers
        )

    if codeLanguage == "python":
        if do_prepend_with_setup_code:
            code, setup_code = prepend_with_setup_code(
                code,
                codeLanguage,
                folder_path,
                projectConfigName,
            )

        if do_convert_var_names_to_readable_form:
            code = convert_var_names_to_readable_form(
                code,
                var_name_to_decl_rel_position_dict.get(
                    tp(C.SETTA_GENERATED_PYTHON), {}
                ),
                exporter_obj,
                ref_template_var_positions,
                setup_code,
            )

    return (
        code,
        section_dependencies,
        var_name_to_decl_rel_position_dict,
        ref_template_var_positions,
    )


def get_template_var_replacement_value_fn(
    exporter_obj,
    folder_path,
    codeLanguage,
    section_dependencies,
    var_name_to_decl_rel_position_dict,
    template_var_replacement_values,
    push_var_name,
):
    def get_template_var_replacement_value(
        code, template_var, ref_template_var_positions
    ):
        keyword = template_var["keyword"]
        if keyword in template_var_replacement_values:
            if template_var["sectionId"]:
                section_dependencies.append(template_var["sectionId"])
            return template_var_replacement_values[keyword]
        if codeLanguage == "python":
            if keyword == tp(C.SETTA_GENERATED_PYTHON):
                chars_before_template_var = get_chars_in_line_before_position(
                    code, template_var["startPos"]
                )

                code, var_name_to_decl_rel_position_dict[keyword] = generate_code(
                    exporter_obj.output,
                    chars_before_template_var,
                    push_var_name,
                )
                return code
            elif keyword == tp(C.SETTA_GENERATED_PYTHON_IMPORTS):
                chars_before_template_var = get_chars_in_line_before_position(
                    code, template_var["startPos"]
                )
                gen_code_template_var = get_gen_code_template_var(
                    ref_template_var_positions["templateVars"]
                )
                var_name_to_decl_position = (
                    get_absolute_decl_position_from_rel_position(
                        gen_code_template_var,
                        var_name_to_decl_rel_position_dict,
                    )
                )
                return generate_imports(
                    code,
                    push_var_name,
                    var_name_to_decl_position,
                    template_var,
                    chars_before_template_var,
                )
            else:
                return process_non_hardcoded_template_var(
                    keyword,
                    template_var,
                    exporter_obj,
                    section_dependencies,
                    folder_path,
                )

        elif codeLanguage == "bash":
            return process_non_hardcoded_template_var(
                keyword, template_var, exporter_obj, section_dependencies, folder_path
            )

    return get_template_var_replacement_value


def process_non_hardcoded_template_var(
    keyword, template_var, exporter_obj, section_dependencies, folder_path
):
    keyword, keyword_type = parse_template_var(keyword)
    if keyword_type == C.TEMPLATE_VAR_IMPORT_PATH_SUFFIX:
        section_dependencies.append(template_var["sectionId"])
        return construct_module_path(folder_path, keyword)
    elif keyword_type == C.TEMPLATE_VAR_VERSION_SUFFIX:
        version_name = get_selected_section_variant(
            exporter_obj.p, template_var["sectionId"]
        )["name"]
        section_name = get_section_name(exporter_obj.p, template_var["sectionId"])
        return f'"{section_name}@{version_name}"'
    elif keyword_type == C.TEMPLATE_VAR_FILE_PATH_SUFFIX:
        section_dependencies.append(template_var["sectionId"])
        keyword = sanitize_section_path_full_name(keyword)
        return f'"{codePathStr(folder_path, keyword, "python")}"'


def get_absolute_decl_position_from_rel_position(
    template_var, var_name_to_decl_rel_position_dict
):
    return {
        k: (v[0] + template_var["startPos"], v[1], v[2])
        for k, v in var_name_to_decl_rel_position_dict[template_var["keyword"]].items()
    }


def preprocess_template_vars(code, evRefs, templateVars, cursor_position):
    has_gen_code = None
    has_gen_code_import = False
    for t in templateVars:
        if t["keyword"] == tp(C.SETTA_GENERATED_PYTHON):
            has_gen_code = True
        elif t["keyword"] == tp(C.SETTA_GENERATED_PYTHON_IMPORTS):
            t["processLast"] = True
            has_gen_code_import = True

    if (
        has_gen_code
        and not has_gen_code_import
        and USER_SETTINGS["backend"]["inferImports"]
    ):
        evRefs = copy.deepcopy(evRefs)
        templateVars = copy.deepcopy(templateVars)
        keyword = tp(C.SETTA_GENERATED_PYTHON_IMPORTS)
        keyword_new_line = f"{keyword}\n"
        code = f"{keyword_new_line}{code}"
        shiftAmount = len(keyword_new_line)
        for x in evRefs:
            x["startPos"] += shiftAmount
        for x in templateVars:
            x["startPos"] += shiftAmount

        if cursor_position is not None:
            cursor_position += shiftAmount

        templateVars.append(
            {"startPos": 0, "keyword": keyword, "sectionId": None, "processLast": True}
        )

    return code, evRefs, templateVars, cursor_position


def convert_folder_path_to_module_path(folder_path):
    return folder_path.relative_to(CWD).as_posix().replace("/", ".").replace("\\", ".")


def languageToExtension(x):
    return {"python": ".py", "bash": ".sh", "yaml": ".yaml"}[x]


def languageToCall(x):
    return {"python": "python", "bash": "bash"}[x]


def codePathStr(folder_path, filename, codeLanguage):
    extension = languageToExtension(codeLanguage)
    output = folder_path / f"{filename}{extension}"
    return output.relative_to(CWD).as_posix()


def codeCallStr(filepath, codeLanguage):
    return f"{languageToCall(codeLanguage)} {filepath}"


def create_wrapper_bash_script(folder_path, run_order, code_dict):
    bash_script = ""
    for sid in run_order:
        curr_code = code_dict[sid]
        codePath = codePathStr(
            folder_path, curr_code["name"], curr_code["codeLanguage"]
        )
        bash_script += f'{codeCallStr(codePath, curr_code["codeLanguage"])}\n'
    return write_code_to_file(
        folder_path, C.DEFAULT_BASH_SCRIPT_NAME, bash_script, "bash"
    )


def prune_and_topological_sort(code_dict, to_keep):
    section_dependencies = {k: v["section_dependencies"] for k, v in code_dict.items()}
    section_dependencies = prune_dict(section_dependencies, to_keep)
    return topological_sort(section_dependencies), section_dependencies


# TODO: eliminate redundancy between this and prune_and_topological_sort
def prune_and_find_top_nodes(code_dict, to_keep):
    section_dependencies = {k: v["section_dependencies"] for k, v in code_dict.items()}
    section_dependencies = prune_dict(section_dependencies, to_keep)
    return find_top_nodes(section_dependencies), section_dependencies


def get_import_order_for_top_node(top_node, dependency_dict):
    # Build a subgraph consisting of top_node and all its descendants.
    subgraph = get_subgraph(top_node, dependency_dict)
    # Get a topologically sorted list where each dependency comes before the node that depends on it.
    sorted_nodes = topological_sort(subgraph)
    # Because you plan to import starting from the end of the list and work backwards,
    # reverse the topological order so that the deepest dependency is imported first.
    import_order = sorted_nodes[::-1]
    return import_order


def find_top_nodes(dependency_dict):
    all_nodes = set(dependency_dict.keys())
    all_deps = {dep for deps in dependency_dict.values() for dep in deps}
    return all_nodes - all_deps


def get_subgraph(top_node, dependency_dict):
    visited = set()

    def dfs(node):
        if node not in visited:
            visited.add(node)
            for dep in dependency_dict.get(node, []):
                dfs(dep)

    dfs(top_node)
    return {node: dependency_dict.get(node, []) for node in visited}


# TODO: is this function actually necessary anymore?
def topological_sort(objects):
    graph = {node: refs for node, refs in objects.items()}
    visiting, visited = set(), set()
    order = []

    def dfs(node):
        if node in visiting:
            raise ValueError("Circular reference detected")
        if node not in visited:
            visiting.add(node)
            for neighbor in graph.get(node, []):
                dfs(neighbor)
            visiting.remove(node)
            visited.add(node)
            order.append(node)

    for node in graph.keys():
        if node not in visited:
            dfs(node)
    return order[::-1]


def create_timestamped_folder(base_dir, prefix=""):
    # Format the current timestamp with subsecond precision
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    # Create folder name with optional prefix and subsecond precision
    folder_name = f"_{prefix}{timestamp}"
    # Full path for the new folder
    folder_path = Path(base_dir) / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)
    return folder_path


def write_code_to_file(folder_path, filename, code, codeLanguage):
    extension = languageToExtension(codeLanguage)
    filepath = write_string_to_file(folder_path, f"{filename}{extension}", code)
    return filepath.relative_to(CWD).as_posix()


def write_string_to_file(folder, filename, content):
    file_path = Path(folder) / filename
    file_path.write_text(content)
    return file_path


def prepend_with_setup_code(code, codeLanguage, folder_path, project_config_name):
    setup_code = ""
    if codeLanguage == "python":
        setup_code = (
            "import sys\n"
            "import os\n"
            "sys.path.append(os.getcwd())\n"
            f"os.environ['{CODE_FOLDER_ENV_VARIABLE}'] = '{folder_path}'\n"
        )
        code = setup_code + code
    return code, setup_code


def construct_module_path(folder_path, section_path_full_name):
    module_path = convert_folder_path_to_module_path(folder_path)
    filename = sanitize_section_path_full_name(section_path_full_name)
    return f"{module_path}.{filename}"


def sanitize_section_path_full_name(name):
    # Replace brackets, quotes and other invalid chars with underscores
    invalid_chars = "[]\"' "
    name = "".join("_" if c in invalid_chars else c for c in name)

    # Remove consecutive underscores
    while "__" in name:
        name = name.replace("__", "_")

    # Remove leading/trailing underscores
    name = name.strip("_")

    return name
