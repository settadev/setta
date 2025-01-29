import asyncio
from typing import List

from pydantic import BaseModel

from setta.code_gen.python.position_line_col import position_to_line_col
from setta.database.utils import create_new_id
from setta.tasks.task_runner import RunType

from .utils import TaskDefinition, replace_template_vars_with_random_names


class CodeAreaFindTemplateVarsContent(BaseModel):
    sectionId: str
    candidateTemplateVars: List[list]
    fullText: str


async def _codeAreaFindTemplateVars(message, lsp_writers):
    message_id = message.id
    message = CodeAreaFindTemplateVarsContent.parse_obj(message.content)
    request_ids = await sendTemplateVarRequests(
        message_id,
        message.sectionId,
        message.candidateTemplateVars,
        message.fullText,
        lsp_writers,
        local=False,
    )
    if len(request_ids) == 0:
        return {"content": {"data": {"positions": [], "numMessages": 1}}}

    return None


async def sendTemplateVarRequests(
    message_id, sectionId, candidateTemplateVars, fullText, lsp_writers, local
):
    if len(candidateTemplateVars) == 0:
        return []

    code, positions_to_test, _ = replace_template_vars_with_random_names(
        candidateTemplateVars, fullText
    )
    code_id = f"{sectionId}-find-template-vars"

    await lsp_writers["basic"].send_document_open_request(code_id, code)
    num_messages = len(positions_to_test)
    request_ids = []
    for idx in range(num_messages):
        startPos = positions_to_test[idx]
        line, col = position_to_line_col(code, startPos)
        request_id = f"{message_id}-{idx}"
        request_ids.append(request_id)
        lsp_writers["basic"].create_asyncio_task(
            lsp_writers["basic"].send_document_highlight_request(
                line=line,
                character=col,
                code_id=code_id,
                request_id=request_id,
                return_id=message_id,
                num_messages=num_messages,
            ),
            request_id,
            local=local,
        )

    return request_ids


async def findTemplateVarsLocally(
    sectionId,
    candidateTemplateVars,
    fullText,
    fullNameToSectionId,
    lsp_writers,
):
    templateVarRequestId = create_new_id()
    request_ids = await sendTemplateVarRequests(
        templateVarRequestId,
        sectionId,
        candidateTemplateVars,
        fullText,
        lsp_writers,
        local=True,
    )

    if len(request_ids) == 0:
        return []

    responses = await waitForTemplateVarResponses(request_ids, lsp_writers)
    positions = []
    for r in responses:
        positions.extend(r["data"]["positions"])
    return construct_template_vars(positions, fullNameToSectionId, fullText)


def construct_template_vars(keyword_positions, fullNameToSectionId, fullText):
    output = []
    for k in keyword_positions:
        keyword = fullText[k["startPos"] : k["endPos"]]
        if keyword in fullNameToSectionId:
            output.append(
                {
                    "sectionId": fullNameToSectionId[keyword],
                    "startPos": k["startPos"],
                    "keyword": keyword,
                }
            )
    return output


async def waitForTemplateVarResponses(request_ids, lsp_writers):
    request_futures = []
    for r in request_ids:
        future = lsp_writers["basic"].wait_for_response(r)
        request_futures.append(future)

    return await asyncio.gather(*request_futures)


codeAreaFindTemplateVars = TaskDefinition(
    name="codeAreaFindTemplateVars",
    return_message_type="codeAreaFindTemplateVarsReturn",
    fn=_codeAreaFindTemplateVars,
    run_as=RunType.NONE,
    server_dependencies=["lsp_writers"],
)
