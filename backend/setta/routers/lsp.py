from fastapi import APIRouter, Depends

from setta.lsp.utils import restart_lsps
from setta.utils.constants import C

from .dependencies import get_lsps

router = APIRouter()


@router.post(C.ROUTE_RESTART_LANGUAGE_SERVER)
async def route_restart_language_server(lsps=Depends(get_lsps)):
    lsps, lsp_readers, lsp_writers = lsps
    await restart_lsps(lsps, lsp_readers, lsp_writers)
