import black
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.code_gen.create_runnable_scripts import (
    generate_final_code_for_sections,
    prune_and_topological_sort,
    sanitize_section_path_full_name,
)
from setta.code_gen.export_selected import (
    export_for_in_memory_fn,
    export_selected,
    get_section_code,
    get_section_type,
)
from setta.tasks.fns.utils import replace_template_vars_with_random_names
from setta.utils.constants import C
from setta.utils.utils import multireplace

from .dependencies import get_lsp_writers, get_tasks

router = APIRouter()


class UpdateInteractiveCodeRequest(BaseModel):
    project: dict


class FormatCodeRequest(BaseModel):
    project: dict
    candidateTemplateVars: dict


@router.post(C.ROUTE_UPDATE_INTERACTIVE_CODE)
async def route_update_interactive_code(
    x: UpdateInteractiveCodeRequest,
    tasks=Depends(get_tasks),
    lsp_writers=Depends(get_lsp_writers),
):
    p = x.project
    exporter_obj = export_selected(
        p, always_export_args_objs=False, force_include_template_var=True
    )
    exporter_obj_in_memory = export_for_in_memory_fn(p)

    template_var_replacement_values = {}
    for variant in p["sectionVariants"].values():
        for t in variant["templateVars"]:
            if not t["sectionId"]:
                continue
            template_var_replacement_values[
                t["keyword"]
            ] = create_in_memory_module_name(p, t["sectionId"])

    code_dict = await generate_final_code_for_sections(
        p,
        exporter_obj,
        lsp_writers=lsp_writers,
        folder_path="",
        do_prepend_with_setup_code=True,
        do_convert_var_names_to_readable_form=True,
        template_var_replacement_values=template_var_replacement_values,
    )

    to_import, _ = prune_and_topological_sort(code_dict, p["importCodeBlocks"])
    to_import = to_import[::-1]  # we want to import the dependencies first
    code_list = []
    for section_id in to_import:
        v = code_dict[section_id]
        task_name = create_in_memory_module_name(p, section_id)
        code_list.append(
            {
                "code": v["code"],
                "module_name": task_name,
            }
        )

    metadata, error_msgs, content = await tasks.add_custom_fns(
        code_list,
        to_cache=exporter_obj_in_memory,
    )
    return {"metadata": metadata, "errorMsgs": error_msgs, "content": content}


@router.post(C.ROUTE_FORMAT_CODE)
async def route_format_code(x: FormatCodeRequest):
    p = x.project
    formattedCode = {}
    for id, s in p["sections"].items():
        if get_section_type(p, id) == C.CODE:
            if s["codeLanguage"] == "python":
                code = get_section_code(p, id)
                (
                    code,
                    _,
                    reverse_var_name_mapping,
                ) = replace_template_vars_with_random_names(
                    x.candidateTemplateVars[id], code
                )
                formattedCode[id] = multireplace(
                    format_python_code(code), reverse_var_name_mapping
                )

    return formattedCode


def format_python_code(code: str) -> str:
    try:
        return black.format_str(code, mode=black.Mode())
    except black.InvalidInput:
        pass


def create_in_memory_module_name(p, sectionId):
    projectConfigName = p["projectConfig"]["name"]
    sanitized_full_name = sanitize_section_path_full_name(
        p["sectionPathFullNames"][sectionId]
    )
    return f"setta_in_memory_{projectConfigName}_{sanitized_full_name}"
