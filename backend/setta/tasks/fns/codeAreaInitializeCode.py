import json

from pydantic import BaseModel

from setta.code_gen.create_runnable_scripts import generate_final_code_for_sections
from setta.code_gen.export_selected import export_selected
from setta.code_gen.find_placeholders import tp
from setta.tasks.task_runner import RunType
from setta.utils.constants import C

from .utils import (
    TaskDefinition,
    send_document_open_request_with_diagnostics_with_code_dict,
)


class CodeAreaInitializeCodeContent(BaseModel):
    project: dict
    sectionId: str


async def _codeAreaInitializeCode(message, lsp_writers):
    message = CodeAreaInitializeCodeContent.parse_obj(message.content)
    project = message.project
    exporter_obj = export_selected(
        project, always_export_args_objs=True, force_include_template_var=False
    )
    projectConfigName = project["projectConfig"]["name"]
    code_dict = await generate_final_code_for_sections(
        project,
        exporter_obj,
        lsp_writers=lsp_writers,
        folder_path=lsp_writers["full"].project_code_folder(projectConfigName),
    )
    send_document_open_request_with_diagnostics_with_code_dict(
        lsp_writers["full"],
        code_dict,
        exporter_obj,
        projectConfigName,
    )

    referencable_var_names = []
    generated_var_names = []
    if (
        exporter_obj.code_gen_template_var_section_details["section"].get("id")
        == message.sectionId
    ):
        generated_var_names = list(
            code_dict[message.sectionId]["var_name_to_decl_rel_position_dict"][
                tp(C.SETTA_GENERATED_PYTHON)
            ].keys()
        )
        infoToFullName = {
            tuple(json.loads(k)): v for k, v in project["infoToFullName"].items()
        }
        referencable_var_names = [
            infoToFullName[exporter_obj.var_name_reverse_mapping[v]]
            for v in generated_var_names
        ]

    template_var_replacement_values = {}
    for r in code_dict[message.sectionId]["ref_template_var_positions"]["templateVars"]:
        template_var_replacement_values[r["keyword"]] = r["value"]

    return {
        "content": True,
        "cache": [
            template_var_replacement_values,
            generated_var_names,
            referencable_var_names,
            exporter_obj,
            project["fullNameToInfo"],
            project["fullNameToSectionId"],
        ],
    }


def get_cache_key(projectConfigId, sectionId):
    return f"codeAreaInitializeCode-{projectConfigId}-{sectionId}"


def write_cache(cache, message, result):
    if result.get("cache") is None:
        return
    message = CodeAreaInitializeCodeContent.parse_obj(message.content)
    cache[
        get_cache_key(message.project["projectConfig"]["id"], message.sectionId)
    ] = result["cache"]


codeAreaInitializeCode = TaskDefinition(
    name="codeAreaInitializeCode",
    return_message_type="codeAreaInitializeCodeReturn",
    fn=_codeAreaInitializeCode,
    write_cache=write_cache,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
