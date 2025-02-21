import copy
from typing import Any, Optional

from pydantic import BaseModel

from setta.code_gen.create_runnable_scripts import generate_final_code_for_section
from setta.code_gen.export_selected import get_gen_code_template_var
from setta.code_gen.find_placeholders import tp
from setta.code_gen.python.generate_code import (
    construct_var_decl_with_trailing_whitespace,
    var_declaration,
)
from setta.code_gen.python.position_line_col import position_to_line_col
from setta.code_gen.utils import process_refs
from setta.tasks.fns.textFieldInitializeCode import get_cache_key
from setta.tasks.task_runner import RunType
from setta.utils.constants import C

from .findEVRefs import findEVRefsLocally
from .utils import TaskDefinition, send_document_open_request_with_diagnostics


class CodeCompletionContent(BaseModel):
    projectConfigId: str
    projectConfigName: str
    sectionId: str
    paramInfoId: Optional[str]
    fullText: str
    position: int
    candidateEVRefs: list
    cached: Optional[Any] = None


async def getEVRefsAndProcessThem(message, fullNameToInfo, exporter_obj, lsp_writers):
    evRefs = await findEVRefsLocally(
        message.sectionId,
        message.paramInfoId,
        message.candidateEVRefs,
        [],
        False,
        message.fullText,
        fullNameToInfo,
        lsp_writers,
    )

    # 1. Create new variable declaration with new value
    var_value, new_positions = process_refs(
        message.fullText,
        evRefs,
        exporter_obj.get_ref_var_name,
        cursor_position=message.position,
    )
    return evRefs, var_value, new_positions


async def get_code_and_cursor_position(
    message,
    fullNameToInfo,
    gen_code_dict,
    var_name,
    exporter_obj,
    lsp_writers,
):
    evRefs, var_value, new_positions = await getEVRefsAndProcessThem(
        message, fullNameToInfo, exporter_obj, lsp_writers
    )
    new_var_decl = var_declaration(var_name, var_value)

    # 2. Compute relative cursor position (cursor position in the context of the variable declaration)
    cursor_position = new_positions["cursor"]
    cursor_position += len(new_var_decl) - len(
        var_value
    )  # shift by length of var declaration (like x = ...)

    # 3. Get position of original variable declaration within generated code.
    #    This will have to be the relative position, not the position adjusted after code generation
    startPos, old_var_decl, chars_after_var_decl = gen_code_dict[
        "var_name_to_decl_rel_position_dict"
    ][tp(C.SETTA_GENERATED_PYTHON)][var_name]
    endPos = startPos + len(old_var_decl)

    # 4. Replace the old declaration with the new declaration.
    gen_code = get_gen_code_template_var(
        gen_code_dict["ref_template_var_positions"]["templateVars"]
    )["value"]
    gen_code = (
        gen_code[:startPos]
        + construct_var_decl_with_trailing_whitespace(
            new_var_decl, chars_after_var_decl
        )
        + gen_code[endPos:]
    )

    # 5. Call generate_final_code_for_section with the new generated code as a replacement value
    template_var_replacement_values = {tp(C.SETTA_GENERATED_PYTHON): gen_code}
    var_name_to_decl_rel_position_dict = copy.deepcopy(
        gen_code_dict["var_name_to_decl_rel_position_dict"]
    )
    var_name_to_decl_rel_position_dict[tp(C.SETTA_GENERATED_PYTHON)][var_name] = (
        startPos,
        new_var_decl,
        chars_after_var_decl,
    )
    gen_code_details = exporter_obj.code_gen_template_var_section_details
    gen_code_section = gen_code_details["section"]
    gen_code_section_variant = gen_code_details["sectionVariant"]

    (
        code,
        _,
        var_name_to_decl_rel_position_dict,
        ref_template_var_positions,
    ) = await generate_final_code_for_section(
        sectionId=message.sectionId,
        code=gen_code_section_variant[
            "code"
        ],  # this is the code with the template vars still in place
        codeLanguage=gen_code_section["codeLanguage"],
        evRefs=gen_code_section_variant["evRefs"],
        templateVars=gen_code_section_variant["templateVars"],
        exporter_obj=exporter_obj,
        lsp_writers=lsp_writers,
        folder_path=lsp_writers["full"].project_code_folder(message.projectConfigName),
        template_var_replacement_values=template_var_replacement_values,
        var_name_to_decl_rel_position_dict=var_name_to_decl_rel_position_dict,
        push_var_name=var_name,
    )

    # 6. Compute the cursor position using the value from step 2, plus the returned var_name_to_decl_rel_position_dict
    var_decl_rel_position = var_name_to_decl_rel_position_dict[
        tp(C.SETTA_GENERATED_PYTHON)
    ][var_name][0]
    gen_code_position = get_gen_code_template_var(
        ref_template_var_positions["templateVars"]
    )["startPos"]
    cursor_position += var_decl_rel_position + gen_code_position

    return evRefs, code, cursor_position, ref_template_var_positions


async def _textFieldCompletion(message, lsp_writers):
    request_id = message.id
    message = CodeCompletionContent.parse_obj(message.content)
    cached = message.cached
    if cached is None:
        return {"content": {"data": []}}

    (
        gen_code_dict,
        var_name,
        referencable_var_names,
        generated_var_names,
        exporter_obj,
        fullNameToInfo,
    ) = cached

    (
        _,
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
    await lsp_writers["full"].send_autocomplete_request(
        line,
        column,
        code_id,
        request_id,
        referencable_var_names,
        generated_var_names,
        cursor_offset=cursor_position - message.position,
    )

    return None


def read_cache(cache, message):
    message = message.content
    message["cached"] = cache.get(
        get_cache_key(
            message["projectConfigId"], message["sectionId"], message["paramInfoId"]
        )
    )


textFieldCompletion = TaskDefinition(
    name="textFieldCompletion",
    return_message_type="textFieldCompletionReturn",
    fn=_textFieldCompletion,
    read_cache=read_cache,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
