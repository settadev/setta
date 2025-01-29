import asyncio
from typing import List, Optional

from pydantic import BaseModel

from setta.code_gen.export_selected import get_gen_code_template_var
from setta.code_gen.python.check_scope import are_positions_in_scope_with_variable
from setta.database.utils import create_new_id
from setta.tasks.task_runner import RunType
from setta.utils.utils import multireplace

from .utils import (
    TaskDefinition,
    generate_unique_variable,
    prepare_code_for_scope_checking,
)


class TextFieldFindReferencesContent(BaseModel):
    sectionId: str
    paramInfoId: Optional[str] = None
    candidateEVRefs: List[list]
    templateVars: Optional[List[dict]] = None
    onlyAfterGenCodeTemplateVar: Optional[bool] = False
    fullText: str


async def _findEVRefs(message, lsp_writers):
    message_id = message.id
    message = TextFieldFindReferencesContent.parse_obj(message.content)
    request_ids = await sendEVRefRequests(
        message_id,
        message.sectionId,
        message.paramInfoId,
        message.candidateEVRefs,
        message.templateVars,
        message.onlyAfterGenCodeTemplateVar,
        message.fullText,
        lsp_writers,
        local=False,
    )

    if len(request_ids) == 0:
        return {"content": {"data": {"positions": [], "numMessages": 1}}}

    return None


async def sendEVRefRequests(
    message_id,
    sectionId,
    paramInfoId,
    candidateEVRefs,
    templateVars,
    onlyAfterGenCodeTemplateVar,
    fullText,
    lsp_writers,
    local,
):
    candidateEVRefs = filterCandidatesByScope(
        candidateEVRefs,
        fullText,
        onlyAfterGenCodeTemplateVar,
        templateVars,
    )

    if len(candidateEVRefs) == 0:
        return []

    code, position_offset, num_keywords = generateCodeForReferenceFinding(
        candidateEVRefs,
        fullText,
        onlyAfterGenCodeTemplateVar,
        templateVars,
    )
    code_id = f"{sectionId}-{paramInfoId}-find-references"

    await lsp_writers["basic"].send_document_open_request(code_id, code)
    request_ids = []
    for idx in range(num_keywords):
        request_id = f"{message_id}-{idx}"
        request_ids.append(request_id)
        lsp_writers["basic"].create_asyncio_task(
            lsp_writers["basic"].send_reference_request(
                position_offset=position_offset,
                line=idx,
                character=0,
                code_id=code_id,
                request_id=request_id,
                return_id=message_id,
                num_messages=num_keywords,
            ),
            request_id,
            local=local,
        )

    return request_ids


async def findEVRefsLocally(
    sectionId,
    paramInfoId,
    candidateEVRefs,
    templateVars,
    onlyAfterGenCodeTemplateVar,
    fullText,
    fullNameToInfo,
    lsp_writers,
):
    evRefRequestId = create_new_id()
    request_ids = await sendEVRefRequests(
        evRefRequestId,
        sectionId,
        paramInfoId,
        candidateEVRefs,
        templateVars,
        onlyAfterGenCodeTemplateVar,
        fullText,
        lsp_writers,
        local=True,
    )

    if len(request_ids) == 0:
        return []

    responses = await waitForEVRefResponses(request_ids, lsp_writers)
    positions = []
    for r in responses:
        positions.extend(r["data"]["positions"])
    return construct_ev_refs(positions, fullNameToInfo, fullText)


def construct_ev_refs(keyword_positions, fullNameToInfo, fullText):
    output = []
    for k in keyword_positions:
        keyword = fullText[k["startPos"] : k["endPos"]]
        if keyword in fullNameToInfo:
            info = fullNameToInfo[keyword]
            output.append(
                {
                    "sectionId": info["sectionId"],
                    "paramInfoId": info["paramInfoId"],
                    "isArgsObj": info["isArgsObj"],
                    "startPos": k["startPos"],
                    "keyword": keyword,
                }
            )
    return output


async def waitForEVRefResponses(request_ids, lsp_writers):
    request_futures = []
    for r in request_ids:
        future = lsp_writers["basic"].wait_for_response(r)
        request_futures.append(future)

    return await asyncio.gather(*request_futures)


def filterCandidatesByScope(
    candidateEVRefs, fullText, onlyAfterGenCodeTemplateVar, templateVars
):
    if not onlyAfterGenCodeTemplateVar:
        return candidateEVRefs
    matching_template_var = get_gen_code_template_var(templateVars)
    if matching_template_var is None:
        return []

    fullText, the_special_var_name = prepare_code_for_scope_checking(
        fullText, templateVars, matching_template_var
    )

    response = are_positions_in_scope_with_variable(
        fullText, [x[1] for x in candidateEVRefs], the_special_var_name
    )

    return [x for idx, x in enumerate(candidateEVRefs) if response[idx]]


def generateCodeForReferenceFinding(
    candidateEVRefs, fullText, onlyAfterGenCodeTemplateVar, templateVars
):
    position_offset = 0

    if onlyAfterGenCodeTemplateVar:
        matching_template_var = get_gen_code_template_var(templateVars)
        if matching_template_var is None:
            return "", position_offset, 0
        # If SETTA_GENERATED_PYTHON is present, we only want to consider
        # code that comes after it.
        startPos = matching_template_var["startPos"]
        keyword = matching_template_var["keyword"]
        endPos = startPos + len(keyword)
        template_str_len = endPos - startPos
        before_text = fullText[:startPos]
        fullText = fullText[endPos:]
        position_offset -= len(before_text) + template_str_len

    output = []
    var_name_mapping = {}
    visited_keywords = set()
    for keyword, _ in candidateEVRefs:
        # candidateEVRefs might contain multiple suggestions to the same keyword
        # like in the case of fn(a=a), it'll suggest "a" in two positions
        # but we only need to write the a=None declaration once
        # so we keep track of keywords we've already visited
        if keyword in visited_keywords:
            continue
        visited_keywords.add(keyword)
        # Replace reference names like
        # list_of_models[0]
        # with a random valid variable name of the same length.
        # If "[" is ever in the keyword,
        # we know it will have a length of at least 4, e.g. x[0] has 4 characters.
        # So we don't have to worry about clashes.
        if "[" in keyword:
            new_keyword = generate_unique_variable(fullText, keyword)
            var_name_mapping[keyword] = new_keyword
            keyword = new_keyword
        output.append(f"{keyword}=None")

    output = "\n".join(output)
    # the plus 1 is for the newline between output and fullText
    position_offset += len(output) + 1
    if len(var_name_mapping) > 0:
        fullText = multireplace(fullText, var_name_mapping)
    return f"{output}\n{fullText}", position_offset, len(visited_keywords)


findEVRefs = TaskDefinition(
    name="findEVRefs",
    return_message_type="findEVRefsReturn",
    fn=_findEVRefs,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
