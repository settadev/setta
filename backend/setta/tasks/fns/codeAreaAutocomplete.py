from typing import Any, Optional

from pydantic import BaseModel

from setta.code_gen.create_runnable_scripts import generate_final_code_for_section
from setta.code_gen.export_selected import get_gen_code_template_var
from setta.code_gen.find_placeholders import tp
from setta.code_gen.python.check_scope import are_positions_in_scope_with_variable
from setta.code_gen.python.generate_code import get_chars_in_line_before_position
from setta.code_gen.python.position_line_col import position_to_line_col
from setta.tasks.fns.codeAreaFindTemplateVars import findTemplateVarsLocally
from setta.tasks.fns.findEVRefs import findEVRefsLocally
from setta.tasks.task_runner import RunType
from setta.utils.constants import C

from .codeAreaInitializeCode import get_cache_key
from .utils import (
    TaskDefinition,
    prepare_code_for_scope_checking,
    send_document_open_request_with_diagnostics,
)


class CodeAreaAutocompleteContent(BaseModel):
    projectConfigId: str
    projectConfigName: str
    codeLanguage: str
    sectionId: str
    sectionName: str
    fullText: str
    position: int
    candidateEVRefs: list
    candidateTemplateVars: list
    cached: Optional[Any] = None


async def _codeAreaAutocomplete(message, lsp_writers):
    request_id = message.id
    message = CodeAreaAutocompleteContent.parse_obj(message.content)

    (
        template_var_replacement_values,
        generated_var_names,
        referencable_var_names,
        exporter_obj,
        fullNameToInfo,
        fullNameToSectionId,
    ) = message.cached

    templateVars = await findTemplateVarsLocally(
        message.sectionId,
        message.candidateTemplateVars,
        message.fullText,
        fullNameToSectionId,
        lsp_writers,
    )

    gen_code_template_var = get_gen_code_template_var(templateVars)
    if (
        gen_code_template_var
        and exporter_obj.code_gen_template_var_section_details["section"].get("id")
        != message.sectionId
    ):
        return {"content": {"data": C.CODE_AREA_GEN_CODE_NOT_INITIALIZED}}

    evRefs = await findEVRefsLocally(
        message.sectionId,
        None,
        message.candidateEVRefs,
        templateVars,
        True,
        message.fullText,
        fullNameToInfo,
        lsp_writers,
    )

    (
        code,
        _,
        _,
        ref_template_var_positions,
    ) = await generate_final_code_for_section(
        sectionId=message.sectionId,
        code=message.fullText,
        codeLanguage=message.codeLanguage,
        evRefs=evRefs,
        templateVars=templateVars,
        exporter_obj=exporter_obj,
        lsp_writers=lsp_writers,
        folder_path=lsp_writers["full"].project_code_folder(message.projectConfigName),
        cursor_position=message.position,
        template_var_replacement_values=template_var_replacement_values,
    )

    cursor_position = ref_template_var_positions["cursor"]
    line, column = position_to_line_col(code, cursor_position)

    generated_var_names, referencable_var_names = calculate_referencable_var_names(
        message.fullText,  # use original code
        templateVars,  # use original template vars
        message.position,  # use original cursor position
        generated_var_names,
        referencable_var_names,
    )

    code_id = await send_document_open_request_with_diagnostics(
        lsp_writers["full"],
        code,
        exporter_obj,
        ref_template_var_positions,
        message.projectConfigName,
        message.sectionName,
        message.sectionId,
    )

    await lsp_writers["full"].send_autocomplete_request(
        line,
        column,
        code_id=code_id,
        request_id=request_id,
        referencable_var_names=referencable_var_names,
        generated_var_names=generated_var_names,
        cursor_offset=cursor_position - message.position,
    )

    return None


def calculate_referencable_var_names(
    code,
    original_template_vars,
    original_cursor_position,
    generated_var_names,
    referencable_var_names,
):
    gen_code_template_var = get_gen_code_template_var(original_template_vars)
    gen_code_position = (
        gen_code_template_var["startPos"] if gen_code_template_var else None
    )

    if gen_code_position is None or original_cursor_position <= gen_code_position:
        return [], special_keywords_for_autocomplete(gen_code_template_var)

    code, the_special_var_name = prepare_code_for_scope_checking(
        code, original_template_vars, gen_code_template_var
    )

    code = add_placeholder_to_empty_line_for_scope_checking(
        code, original_cursor_position
    )

    response = are_positions_in_scope_with_variable(
        code, [original_cursor_position], the_special_var_name
    )

    if response[0]:
        referencable_var_names = [
            *special_keywords_for_autocomplete(gen_code_template_var),
            *referencable_var_names,
        ]
        return generated_var_names, referencable_var_names

    return [], []


# The are_positions_in_scope_with_variable function doesn't work with empty lines
# So if the cursor is on an empty line, we add a dummy _
def add_placeholder_to_empty_line_for_scope_checking(code, cursor_position):
    is_empty_line = False
    before_chars = get_chars_in_line_before_position(code, cursor_position)

    if len(before_chars.strip()) == 0:
        line_end_index = code.find("\n", cursor_position)
        if line_end_index == -1:
            # Check remaining characters if we're at the last line
            after_chars = code[cursor_position:]
        else:
            after_chars = code[cursor_position:line_end_index]

        if len(after_chars.strip()) == 0:
            is_empty_line = True

    if is_empty_line:
        code = code[:cursor_position] + "_" + code[cursor_position:]

    return code


def special_keywords_for_autocomplete(gen_code_template_var):
    if not gen_code_template_var:
        return [tp(C.SETTA_GENERATED_PYTHON)]
    return []


def read_cache(cache, message):
    message = message.content
    message["cached"] = cache.get(
        get_cache_key(message["projectConfigId"], message["sectionId"])
    )


codeAreaAutocomplete = TaskDefinition(
    name="codeAreaAutocomplete",
    return_message_type="codeAreaAutocompleteReturn",
    fn=_codeAreaAutocomplete,
    read_cache=read_cache,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
