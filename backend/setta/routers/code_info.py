import docstring_to_markdown
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from setta.database.db.codeInfo.save import save_code_info
from setta.utils.constants import C

from .dependencies import get_dbq

router = APIRouter()


class SaveCodeInfoRequest(BaseModel):
    codeInfo: dict


class DocstringToMarkdownRequest(BaseModel):
    docstring: str


@router.post(C.ROUTE_SAVE_CODE_INFO)
def route_save_code_info(x: SaveCodeInfoRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        save_code_info(db, x.codeInfo)


@router.post(C.ROUTE_DOCSTRING_TO_MARKDOWN)
def route_docstring_to_markdown(x: DocstringToMarkdownRequest):
    try:
        return docstring_to_markdown.convert(x.docstring)
    except docstring_to_markdown.UnknownFormatError as e:
        raise HTTPException(status_code=400, detail=str(e))
