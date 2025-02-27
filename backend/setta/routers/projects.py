import sqlite3
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from setta.database.backup import maybe_create_backup
from setta.database.db.projects.delete import delete_project_configs
from setta.database.db.projects.load import (
    ProjectNotFound,
    load_all_project_config_metadata,
    load_default_config_name,
    load_full_project,
    load_project_config,
    load_project_config_names,
)
from setta.database.db.projects.save import (
    create_project_config,
    save_project_config_name,
    save_project_details,
    set_as_default_project,
)
from setta.database.db.projects.saveAs import (
    save_as_existing_project_config,
    save_as_new_project_config,
)
from setta.database.db.projects.utils import (
    add_defaults_to_project_and_load_json_sources,
    filter_data_for_json_export,
)
from setta.database.export_db.export_db import maybe_export_database
from setta.utils.constants import C

from .dependencies import get_dbq

router = APIRouter()


class ProjectLoadRequest(BaseModel):
    projectConfigName: str


class ProjectLoadFullRequest(BaseModel):
    excludeProjectConfigName: Optional[str] = None


class ProjectSaveRequest(BaseModel):
    project: dict


class SaveAsNewProjectConfigRequest(BaseModel):
    project: dict
    newConfigName: str
    withRefs: bool


class SaveAsExistingProjectConfigRequest(BaseModel):
    project: dict
    configName: str


class CreateProjectConfigRequest(BaseModel):
    name: Optional[str] = None
    previewImgColor: str


class DeleteProjectConfigsRequest(BaseModel):
    ids: List[str]


class SetProjectConfigNameRequest(BaseModel):
    currProjectConfigName: str
    newProjectConfigName: str


class SetAsDefaultProjectRequest(BaseModel):
    projectId: str


class FilterDataForJSONExportRequest(BaseModel):
    project: dict


class AddDefaultDataForJSONImportRequest(BaseModel):
    project: dict


@router.post(C.ROUTE_ALL_PROJECT_CONFIG_METADATA)
def route_all_project_config_metadata(dbq=Depends(get_dbq)):
    with dbq as db:
        return load_all_project_config_metadata(db)


@router.post(C.ROUTE_LOAD_PROJECT_CONFIG_NAMES)
def route_load_project_config_names(dbq=Depends(get_dbq)):
    with dbq as db:
        return load_project_config_names(db)


@router.post(C.ROUTE_LOAD_PROJECT_CONFIG)
def route_load_project_config(
    x: ProjectLoadRequest,
    dbq=Depends(get_dbq),
):
    try:
        with dbq as db:
            return load_project_config(db, x.projectConfigName)
    except ProjectNotFound as e:
        raise HTTPException(status_code=404, detail=repr(e))


@router.post(C.ROUTE_LOAD_FULL_PROJECT)
def route_load_full_project(x: ProjectLoadFullRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        return load_full_project(
            db, excludeProjectConfigName=x.excludeProjectConfigName
        )


@router.post(C.ROUTE_SAVE_PROJECT)
def route_save_project(x: ProjectSaveRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        maybe_create_backup(db.path)
        save_project_details(db, x.project)
        maybe_export_database(db, db.path)


@router.post(C.ROUTE_CREATE_PROJECT_CONFIG)
def route_create_project_config(x: CreateProjectConfigRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        return create_project_config(db, x.name, x.previewImgColor)


@router.post(C.ROUTE_SAVE_AS_NEW_PROJECT_CONFIG)
def route_save_as_new_project_config(
    x: SaveAsNewProjectConfigRequest, dbq=Depends(get_dbq)
):
    with dbq as db:
        return save_as_new_project_config(db, x.project, x.newConfigName, x.withRefs)


@router.post(C.ROUTE_SAVE_AS_EXISTING_PROJECT_CONFIG)
def route_save_as_existing_project_config(
    x: SaveAsExistingProjectConfigRequest, dbq=Depends(get_dbq)
):
    with dbq as db:
        return save_as_existing_project_config(db, x.project, x.configName)


@router.post(C.ROUTE_DELETE_PROJECT_CONFIGS)
def route_delete_project_configs(x: DeleteProjectConfigsRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        return delete_project_configs(db, x.ids)


@router.post(C.ROUTE_SET_PROJECT_CONFIG_NAME)
def route_set_project_config_name(x: SetProjectConfigNameRequest, dbq=Depends(get_dbq)):
    try:
        with dbq as db:
            save_project_config_name(
                db, x.currProjectConfigName, x.newProjectConfigName
            )
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=422, detail=repr(e))


@router.post(C.ROUTE_GET_DEFAULT_CONFIG_NAME)
def router_get_default_config_name(dbq=Depends(get_dbq)):
    with dbq as db:
        return load_default_config_name(db)


@router.post(C.ROUTE_SET_AS_DEFAULT_PROJECT)
def router_set_as_default_project(x: SetAsDefaultProjectRequest, dbq=Depends(get_dbq)):
    with dbq as db:
        set_as_default_project(db, x.projectId)


@router.post(C.ROUTE_FILTER_DATA_FOR_JSON_EXPORT)
def router_filter_data_for_json_export(x: FilterDataForJSONExportRequest):
    filter_data_for_json_export(x.project)
    return x.project


@router.post(C.ROUTE_ADD_DEFAULT_DATA_FOR_JSON_IMPORT)
def router_add_default_data_for_json_import(x: FilterDataForJSONExportRequest):
    add_defaults_to_project_and_load_json_sources(x.project)
    return x.project
