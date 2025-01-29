import os
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.cli.logger import load_from_csv_base64
from setta.database.db.artifacts.load import (
    load_artifact_from_disk,
    load_artifact_metadata_and_maybe_value_from_disk,
    load_available_artifacts,
)
from setta.database.db.artifacts.save_or_create import (
    get_artifact_ids,
    save_or_create_artifacts,
)
from setta.utils.constants import C

from .dependencies import get_dbq, get_websocket_manager

router = APIRouter()


class SendArtifactRequest(BaseModel):
    data: List[dict]
    saveTo: str
    messageType: str


class LoadArtifactsRequest(BaseModel):
    artifactIds: List[str]


class LoadAvailableArtifactsRequest(BaseModel):
    sectionType: str


class CheckIfFileExistsRequests(BaseModel):
    filepath: str


class LoadArtifactFromDiskRequest(BaseModel):
    filepath: str
    type: str


class ReadCSVBase64Request(BaseModel):
    base64Str: str


class GetArtifactIdsFromNamePathType(BaseModel):
    namesPathsTypes: list


@router.post(C.ROUTE_SEND_ARTIFACT)
async def route_send_artifact(
    x: SendArtifactRequest,
    dbq=Depends(get_dbq),
    websocket_manager=Depends(get_websocket_manager),
):
    with dbq as db:
        artifact_ids = save_or_create_artifacts(db, x.data, x.saveTo)

    for idx, d in enumerate(x.data):
        d["id"] = artifact_ids[idx]

    await websocket_manager.broadcast({"content": x.data, "messageType": x.messageType})
    return artifact_ids


@router.post(C.ROUTE_LOAD_ARTIFACTS)
def route_load_artifacts(x: LoadArtifactsRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        return load_artifact_metadata_and_maybe_value_from_disk(db, x.artifactIds)


@router.post(C.ROUTE_LOAD_AVAILABLE_ARTIFACTS)
def route_load_available_artifacts(
    x: LoadAvailableArtifactsRequest, dbq=Depends(get_dbq)
):
    with dbq as db:
        return load_available_artifacts(db, x.sectionType)


@router.post(C.ROUTE_CHECK_IF_FILE_EXISTS)
def route_check_if_file_exists(x: CheckIfFileExistsRequests):
    return os.path.exists(x.filepath)


@router.post(C.ROUTE_LOAD_ARTIFACT_FROM_DISK)
def route_load_artifact_from_disk(x: LoadArtifactFromDiskRequest):
    return load_artifact_from_disk(x.filepath, x.type)


@router.post(C.ROUTE_READ_CSV_BASE64)
def route_read_csv_base64(x: ReadCSVBase64Request):
    return load_from_csv_base64(x.base64Str)


@router.post(C.ROUTE_GET_ARTIFACT_IDS_FROM_NAME_PATH_TYPE)
def route_get_artifact_ids_from_name_path_type(
    x: GetArtifactIdsFromNamePathType, dbq=Depends(get_dbq)
):
    with dbq as db:
        return get_artifact_ids(db, x.namesPathsTypes)
