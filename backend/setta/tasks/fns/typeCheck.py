from setta.code_gen.create_runnable_scripts import generate_final_code_for_sections
from setta.code_gen.export_selected import export_selected
from setta.tasks.task_runner import RunType

from .utils import (
    TaskDefinition,
    send_document_open_request_with_diagnostics_with_code_dict,
)


# this just initializes a document which gets the lsp to send back diagnostics
async def _typeCheck(message, lsp_writers):
    project = message.content
    exporter_obj = export_selected(
        project, always_export_args_objs=False, force_include_template_var=True
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

    return None


typeCheck = TaskDefinition(
    name="typeCheck",
    return_message_type="typeCheckReturn",
    fn=_typeCheck,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
