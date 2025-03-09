from fastapi import APIRouter
from pydantic import BaseModel

from setta.utils.constants import C
from setta.utils.openapi_utils import get_openapi_spec

router = APIRouter()


class FetchAPISpecsRequest(BaseModel):
    apiSpecsURL: str


@router.post(C.ROUTE_FETCH_API_SPECS)
def route_fetch_api_specs(x: FetchAPISpecsRequest):
    res = get_openapi_spec(x.apiSpecsURL)
    return res is not None
