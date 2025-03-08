import asyncio

import black
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.code_gen.create_runnable_scripts import (
    generate_final_code_for_sections,
    get_import_order_for_top_node,
    prune_and_find_top_nodes,
    sanitize_section_path_full_name,
)
from setta.code_gen.export_selected import (
    export_for_in_memory_fn,
    export_selected,
    get_section_code,
    get_section_type,
)
from setta.code_gen.find_placeholders import parse_template_var
from setta.tasks.fns.utils import replace_template_vars_with_random_names
from setta.tasks.tasks import construct_subprocess_key
from setta.utils.constants import C
from setta.utils.utils import multireplace

from .dependencies import get_lsp_writers, get_tasks

router = APIRouter()


class UpdateInteractiveCodeRequest(BaseModel):
    projects: list


class FormatCodeRequest(BaseModel):
    project: dict
    candidateTemplateVars: dict


@router.post(C.ROUTE_SEND_PROJECT_TO_INTERACTIVE_CODE)
async def route_send_project_to_interactive_code(
    x: UpdateInteractiveCodeRequest,
    tasks=Depends(get_tasks),
):
    to_run = []
    for idx, p in enumerate(x.projects):
        exporter_obj_in_memory = export_for_in_memory_fn(p)
        to_run.append(
            tasks.call_in_memory_subprocess_fn_with_new_exporter_obj(
                p["projectConfig"]["id"], idx, exporter_obj_in_memory
            )
        )
    return await process_returned_content_from_multiple_tasks(tasks, to_run)


@router.post(C.ROUTE_UPDATE_INTERACTIVE_CODE)
async def route_update_interactive_code(
    x: UpdateInteractiveCodeRequest,
    tasks=Depends(get_tasks),
    lsp_writers=Depends(get_lsp_writers),
):
    # Create list of coroutines to run in parallel
    update_tasks = [
        update_interactive_code(p, tasks, lsp_writers, idx)
        for idx, p in enumerate(x.projects)
    ]
    return await process_returned_content_from_multiple_tasks(tasks, update_tasks)


async def process_returned_content_from_multiple_tasks(tasks, to_run):
    all_content = await asyncio.gather(*to_run)
    content = []
    exception_occurred = False
    for sublist in all_content:
        for item in sublist:
            if isinstance(item, Exception):
                exception_occurred = True
            else:
                content.append(item)
    inMemorySubprocessInfo = tasks.getInMemorySubprocessInfo()
    return {
        "inMemorySubprocessInfo": inMemorySubprocessInfo,
        "content": content,
        "exceptionOccurred": exception_occurred,
    }


async def update_interactive_code(p, tasks, lsp_writers, idx):
    exporter_obj = export_selected(
        p, always_export_args_objs=False, force_include_template_var=True
    )
    exporter_obj_in_memory = export_for_in_memory_fn(p)

    template_var_replacement_values = {}
    for variant in p["sectionVariants"].values():
        for t in variant["templateVars"]:
            _, keyword_type = parse_template_var(t["keyword"])
            if t["sectionId"] and keyword_type == C.TEMPLATE_VAR_IMPORT_PATH_SUFFIX:
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

    runCodeBlocks = p["runCodeBlocks"]
    if runCodeBlocks is None:
        runCodeBlocks = [
            k for k in p["sections"].keys() if get_section_type(p, k) == C.CODE
        ]

    top_node_ids, section_dependencies = prune_and_find_top_nodes(
        code_dict, runCodeBlocks
    )
    code_graph = []
    project_config_id = p["projectConfig"]["id"]
    for section_id in top_node_ids:
        import_order = get_import_order_for_top_node(section_id, section_dependencies)
        imports = [
            {
                "code": code_dict[s]["code"],
                "module_name": create_in_memory_module_name(p, s),
            }
            for s in import_order
        ]

        code_graph.append(
            {
                "imports": imports,
                "subprocess_key": construct_subprocess_key(
                    project_config_id, section_id, idx
                ),
                "subprocessStartMethod": p["sections"][section_id][
                    "subprocessStartMethod"
                ],
            }
        )

    initialContent = await tasks.add_custom_fns(
        code_graph,
        exporter_obj=exporter_obj_in_memory,
    )

    return initialContent


@router.post(C.ROUTE_KILL_IN_MEMORY_SUBPROCESSES)
async def route_kill_in_memory_subprocesses(tasks=Depends(get_tasks)):
    tasks.kill_in_memory_subprocesses()


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
