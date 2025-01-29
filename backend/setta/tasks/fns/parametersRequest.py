from setta.code_gen.python.position_line_col import position_to_line_col
from setta.tasks.task_runner import RunType

from .textFieldAutocomplete import (
    CodeCompletionContent,
    get_code_and_cursor_position,
    read_cache,
)
from .utils import TaskDefinition, send_document_open_request_with_diagnostics


async def _parametersRequest(message, lsp_writers):
    request_id = message.id
    message = CodeCompletionContent.parse_obj(message.content)
    cached = message.cached
    if cached is None:
        return {"content": {"data": None}}

    (
        gen_code_dict,
        var_name,
        _,
        _,
        exporter_obj,
        fullNameToInfo,
    ) = cached

    (
        evRefs,
        code,
        cursor_position,
        ref_template_var_positions,
    ) = await get_code_and_cursor_position(
        message,
        fullNameToInfo,
        gen_code_dict,
        var_name,
        exporter_obj,
        lsp_writers,
    )
    code = code[:cursor_position] + "()" + code[cursor_position + 2 :]
    # move cursor into parentheses
    cursor_position += 1
    line, column = position_to_line_col(code, cursor_position)
    code_id = await send_document_open_request_with_diagnostics(
        lsp_writers["full"],
        code,
        exporter_obj,
        ref_template_var_positions,
        message.projectConfigName,
        gen_code_dict["sanitized_full_name"],
        exporter_obj.code_gen_template_var_section_details["section"]["id"],
    )
    await lsp_writers["full"].send_signature_help_request(
        line,
        column,
        code_id,
        request_id,
        otherData={"evRefs": evRefs},
    )
    return None


parametersRequest = TaskDefinition(
    name="parametersRequest",
    return_message_type="parametersRequestReturn",
    fn=_parametersRequest,
    read_cache=read_cache,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
