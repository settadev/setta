import os
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from setta.code_gen.export_selected import (
    export_param_sweep_section_to_dict,
    export_section_to_dict,
    export_single_run_group_to_dict,
)
from setta.code_gen.yaml.section_dict import (
    param_sweep_dict_to_yaml,
    run_group_dict_to_yaml,
    section_dict_to_yaml,
)
from setta.database.db.sections.copy import (
    copy_relative_positions,
    copy_sections_and_other_info,
)
from setta.database.db.sections.jsonSource import save_json_source_data
from setta.database.db.sections.load import load_json_sources_into_data_structures
from setta.routers.dependencies import get_specific_file_watcher
from setta.utils.constants import C
from setta.utils.generate_new_filename import generate_new_filename

router = APIRouter()


class SectionsMakeCopyRequest(BaseModel):
    sectionsAndOtherInfo: dict


class SectionToYamlRequest(BaseModel):
    codeInfo: dict
    codeInfoChildren: dict
    sectionVariant: dict
    pinnedIds: Dict[str, List[str]]
    unpinnedIds: Dict[str, List[str]]


class ParamSweepSectionToYamlRequest(BaseModel):
    sweep: list
    codeInfo: dict
    codeInfoChildren: dict


class GlobalParamSweepSectionToYamlRequest(BaseModel):
    runGroup: Optional[dict]
    sections: dict
    sectionVariants: dict


class LoadSectionJSONSourceRequest(BaseModel):
    project: dict
    variantIdsToLoad: List[str]


class SaveSectionJSONSourceRequest(BaseModel):
    project: dict
    variantId: str


class NewJSONVersionNameRequest(BaseModel):
    filename: str


class CreateFileRequest(BaseModel):
    filepath: str


class GetJSONSourcePathToBeDeleted(BaseModel):
    variantName: str


class DeleteFileRequest(BaseModel):
    filepath: str


class FileWatchListRequest(BaseModel):
    filepaths: List[str]


@router.post(C.ROUTE_COPY_SECTIONS)
def route_sections_make_copy(x: SectionsMakeCopyRequest):
    output = copy_sections_and_other_info(x.sectionsAndOtherInfo)
    relativePositions = copy_relative_positions(
        x.sectionsAndOtherInfo["relativePositions"], output["section_id_map"]
    )
    output.pop("section_id_map")
    return {**output, "relativePositions": relativePositions}


@router.post(C.ROUTE_SECTION_TO_YAML)
def route_section_to_yaml(x: SectionToYamlRequest):
    output = export_section_to_dict(
        x.codeInfo,
        x.codeInfoChildren,
        x.sectionVariant,
        {"pinned": x.pinnedIds, "unpinned": x.unpinnedIds},
    )

    yamlValue = section_dict_to_yaml(output, x.codeInfo, x.sectionVariant)

    return {
        "yamlValue": yamlValue,
        "originalObj": {
            "pinned": output["pinned"].output,
            "unpinned": output["unpinned"].output,
        },
    }


@router.post(C.ROUTE_PARAM_SWEEP_SECTION_TO_YAML)
def route_param_sweep_section_to_yaml(x: ParamSweepSectionToYamlRequest):
    output = export_param_sweep_section_to_dict(x.sweep, x.codeInfo, x.codeInfoChildren)
    yamlValue = param_sweep_dict_to_yaml(output)
    return {"yamlValue": yamlValue, "originalObj": {}}


@router.post(C.ROUTE_GLOBAL_PARAM_SWEEP_SECTION_TO_YAML)
def route_global_param_sweep_section_to_yaml(x: GlobalParamSweepSectionToYamlRequest):
    output = export_single_run_group_to_dict(
        x.runGroup,
        x.sections,
        x.sectionVariants,
    )
    yamlValue = run_group_dict_to_yaml(output)
    return {"yamlValue": yamlValue, "originalObj": {}}


@router.post(C.ROUTE_LOAD_SECTION_JSON_SOURCE)
def route_load_section_json_source(x: LoadSectionJSONSourceRequest):
    p = x.project
    load_json_sources_into_data_structures(
        p["codeInfo"],
        p["codeInfoCols"],
        p["sectionVariants"],
        variant_ids=x.variantIdsToLoad,
    )
    return {"project": p}


@router.post(C.ROUTE_NEW_JSON_VERSION_NAME)
def route_new_json_version_name(x: NewJSONVersionNameRequest):
    new_filename = generate_new_filename(x.filename)
    Path(new_filename).parent.mkdir(parents=True, exist_ok=True)
    Path(new_filename).touch()
    return new_filename


@router.post(C.ROUTE_CREATE_FILE)
def route_create_file(x: CreateFileRequest):
    Path(x.filepath).parent.mkdir(parents=True, exist_ok=True)
    Path(x.filepath).touch()


@router.post(C.ROUTE_SAVE_SECTION_JSON_SOURCE)
def route_save_section_json_source(x: SaveSectionJSONSourceRequest):
    save_json_source_data(x.project, [x.variantId])


@router.post(C.ROUTE_GET_JSON_SOURCE_PATH_TO_BE_DELETED)
def route_get_json_source_path_to_be_deleted(x: GetJSONSourcePathToBeDeleted):
    return os.path.abspath(x.variantName)


@router.post(C.ROUTE_DELETE_FILE)
def route_delete_file(x: DeleteFileRequest):
    file = Path(x.filepath)
    if not file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{x.filepath}' not found",
        )

    try:
        file.unlink()
        return {"message": f"File '{x.filepath}' deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to delete file: {str(e)}",
        )


@router.post(C.ROUTE_FILE_WATCH_LIST)
def route_file_watch_list(
    x: FileWatchListRequest, specific_file_watcher=Depends(get_specific_file_watcher)
):
    # x.filepaths is the current list of file paths or glob patterns that should be watched
    specific_file_watcher.update_watch_list(x.filepaths)
