from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.routers.dependencies import get_api_specs_in_memory
from setta.utils.constants import C
from setta.utils.openapi_utils import (
    get_endpoint_parameters,
    get_endpoints_from_spec,
    get_openapi_spec,
)

router = APIRouter()


class FetchAPISpecsRequest(BaseModel):
    apiSpecsURL: str


class GetListOfEndpointsRequest(BaseModel):
    apiSpecsURL: str


class GetEndpointParametersRequest(BaseModel):
    apiSpecsURL: str
    endpoint: str
    method: str


@router.post(C.ROUTE_FETCH_API_SPECS)
def route_fetch_api_specs(
    x: FetchAPISpecsRequest, api_specs_in_memory=Depends(get_api_specs_in_memory)
):
    res = get_openapi_spec_and_store_endpoints_in_memory(
        x.apiSpecsURL, api_specs_in_memory
    )
    return res is not None


@router.post(C.ROUTE_GET_LIST_OF_ENDPOINTS)
def route_get_list_of_endpoints(
    x: GetListOfEndpointsRequest, api_specs_in_memory=Depends(get_api_specs_in_memory)
):
    if x.apiSpecsURL not in api_specs_in_memory:
        res = get_openapi_spec_and_store_endpoints_in_memory(
            x.apiSpecsURL, api_specs_in_memory
        )
        if not res:
            return []
    return [
        {"label": a["path"], "type": a["method"]}
        for a in api_specs_in_memory[x.apiSpecsURL]["endpoints"]
    ]


@router.post(C.ROUTE_GET_ENDPOINT_PARAMETERS)
def route_get_endpoint_parameters(
    x: GetEndpointParametersRequest,
    api_specs_in_memory=Depends(get_api_specs_in_memory),
):
    if x.apiSpecsURL not in api_specs_in_memory:
        res = get_openapi_spec_and_store_endpoints_in_memory(
            x.apiSpecsURL, api_specs_in_memory
        )
        if not res:
            return []
    endpoint_info = get_endpoint_parameters(
        api_specs_in_memory[x.apiSpecsURL]["specs"], x.endpoint, x.method
    )

    params = endpoint_info["requestBody"]["content"]["application/json"]["schema"][
        "properties"
    ]

    return [
        {
            "name": name,
            "defaultVal": p.get("default"),
            "description": p.get("description", ""),
            "positionalOnly": False,
        }
        for name, p in params.items()
    ]


def get_openapi_spec_and_store_endpoints_in_memory(apiSpecsURL, api_specs_in_memory):
    res = get_openapi_spec(apiSpecsURL)
    if res:
        if apiSpecsURL not in api_specs_in_memory:
            api_specs_in_memory[apiSpecsURL] = {
                "specs": res,
                "endpoints": get_endpoints_from_spec(res),
            }
    return res
