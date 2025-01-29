import asyncio
import copy
import logging

from setta.code_gen.export_selected import get_specific_template_var
from setta.code_gen.find_placeholders import tp
from setta.database.utils import create_new_id
from setta.utils.constants import C

logger = logging.getLogger(__name__)


async def maybe_validate_imports_and_update_code(
    sectionId, code, ref_template_var_positions, lsp_writers
):
    templateVars = ref_template_var_positions["templateVars"]
    generated_imports_info, idx = get_specific_template_var(
        templateVars, tp(C.SETTA_GENERATED_PYTHON_IMPORTS), return_index=True
    )
    if not generated_imports_info:
        return code, templateVars
    old_value = generated_imports_info["value"]
    new_value, did_change = await validate_imports(sectionId, old_value, lsp_writers)
    if not did_change:
        return code, templateVars

    # this shouldn't happen
    if len(new_value) != len(old_value):
        logger.debug("new imports have different length from old imports")
        return code, templateVars

    templateVars = copy.deepcopy(ref_template_var_positions["templateVars"])
    generated_imports_info = templateVars[idx]
    generated_imports_info["value"] = new_value
    startPos = generated_imports_info["startPos"]
    endPos = generated_imports_info["startPos"] + len(new_value)
    code = code[:startPos] + new_value + code[endPos:]
    return code, templateVars


async def validate_imports(sectionId, generated_imports, lsp_writers):
    if not generated_imports:
        return generated_imports, False

    code_id = f"{sectionId}-validate-imports"
    await lsp_writers["full"].send_document_open_request(
        code_id=code_id, code=generated_imports, virtual=True
    )

    lines = generated_imports.split("\n")
    message_id = create_new_id()

    # First, send all requests and store the futures
    request_futures = []
    line_indices = []  # Keep track of which line each request is for
    for idx, line in enumerate(lines):
        if not line:
            continue
        request_id = f"{message_id}-{idx}"
        # Send request without awaiting
        lsp_writers["full"].create_asyncio_task(
            lsp_writers["full"].send_definition_request(
                idx, len(line) - 1, code_id, request_id, virtual=True
            ),
            request_id,
            local=True,
        )
        # Store the future for waiting later
        future = lsp_writers["full"].wait_for_response(request_id)
        request_futures.append(future)
        line_indices.append(idx)  # Store the original line index

    # Then await all responses concurrently
    responses = await asyncio.gather(*request_futures)

    did_change = False
    # Use line_indices to map responses back to correct lines
    for response_idx, response in enumerate(responses):
        original_idx = line_indices[response_idx]
        if not response["data"]:
            # replace with equal length comment so that we don't have
            # to change any position information
            lines[original_idx] = "#" * len(lines[original_idx])
            did_change = True

    generated_imports = "\n".join(lines)
    return generated_imports, did_change
