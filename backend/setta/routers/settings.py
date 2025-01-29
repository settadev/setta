from fastapi import APIRouter, Depends
from pydantic import BaseModel

from setta.utils.constants import C

from .dependencies import get_settings_file

router = APIRouter()


class SaveSettingsRequest(BaseModel):
    settings: dict


class SaveSettingsProjectRequest(BaseModel):
    settingsProject: dict


@router.post(C.ROUTE_SAVE_SETTINGS)
def route_save_settings(
    x: SaveSettingsRequest, settings_file=Depends(get_settings_file)
):
    return settings_file.save_settings(x.settings)


@router.post(C.ROUTE_LOAD_SETTINGS)
def route_load_settings(settings_file=Depends(get_settings_file)):
    return settings_file.load_settings()


@router.post(C.ROUTE_SAVE_SETTINGS_PROJECT)
def route_save_settings_project(
    x: SaveSettingsProjectRequest, settings_file=Depends(get_settings_file)
):
    return settings_file.save_settings_project(x.settingsProject)


@router.post(C.ROUTE_LOAD_SETTINGS_PROJECT)
def route_load_settings_project(settings_file=Depends(get_settings_file)):
    return settings_file.load_settings_project()
