from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.routers.dependencies import get_api_specs_in_memory
from setta.utils.constants import C
from setta.utils.openapi_utils import get_endpoints_from_spec, get_openapi_spec

router = APIRouter()


class FetchAPISpecsRequest(BaseModel):
    apiSpecsURL: str


@router.post(C.ROUTE_FETCH_API_SPECS)
def route_fetch_api_specs(
    x: FetchAPISpecsRequest, api_specs_in_memory=Depends(get_api_specs_in_memory)
):
    res = get_openapi_spec(x.apiSpecsURL)
    if res:
        if x.apiSpecsURL not in api_specs_in_memory:
            api_specs_in_memory[x.apiSpecsURL] = {
                "endpoints": get_endpoints_from_spec(res)
            }
    return res is not None
