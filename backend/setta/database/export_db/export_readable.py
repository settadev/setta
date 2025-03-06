import logging
import os
import shutil
from pathlib import Path

from setta.cli.logger import save_base64_to_png
from setta.code_gen.export_selected import (
    export_param_sweep_section_to_dict,
    export_section_to_dict,
    export_single_run_group_to_dict,
    get_for_section_id,
    get_section_name,
    get_section_type,
    get_section_variant_attr,
    get_section_variant_ids,
    get_selected_section_variant,
    get_selected_section_variant_id,
    get_variant_code,
    get_variant_name,
)
from setta.code_gen.yaml.section_dict import (
    param_sweep_dict_to_yaml,
    run_group_dict_to_yaml,
    section_dict_to_yaml,
)
from setta.database.db.artifacts.load import (
    load_artifact_metadata_and_maybe_value_from_disk,
)
from setta.utils.constants import C
from setta.utils.section_contents import getParamIdsToShowInArea

from .utils import get_configs_and_root_folder

logger = logging.getLogger(__name__)


def export_readable(db, filename, with_variants):
    configs, root_folder = get_configs_and_root_folder(db, filename)
    subfolder_name = "with_variants" if with_variants else "clean"
    root_folder = root_folder / subfolder_name
    try:
        logger.debug(f"try deleting: {root_folder}")
        shutil.rmtree(root_folder)
    except:
        pass

    logger.debug(f"exporting readable to {root_folder}")

    artifactIds = set()
    for c in configs:
        for ag in c["artifactGroups"].values():
            for t in ag["artifactTransforms"]:
                artifactIds.add(t["artifactId"])

    artifacts = load_artifact_metadata_and_maybe_value_from_disk(db, list(artifactIds))

    for c in configs:
        c["artifacts"] = artifacts
        export_config(root_folder, c, with_variants)


def export_config(folder, config, with_variants):
    config_folder = Path(folder) / config["projectConfig"]["name"]
    for k in config["projectConfig"]["children"].keys():
        os.makedirs(config_folder, exist_ok=True)
        export_section(config_folder, config, k, with_variants)


def export_section(folder, config, section_id, with_variants):
    exporter_fn = get_exporter_fn(config, section_id)
    if not exporter_fn:
        return
    variant_ids = (
        get_section_variant_ids(config, section_id)
        if with_variants
        else [get_selected_section_variant_id(config, section_id)]
    )
    for variant_id in variant_ids:
        if not variant_id:
            continue
        exporter_fn(folder, config, section_id, variant_id, with_variants)


def export_code(folder, config, section_id, variant_id, with_variants):
    codeLanguage = config["sections"][section_id]["codeLanguage"]
    code = get_variant_code(config, variant_id)
    base = maybe_with_variant_in_filename(config, section_id, variant_id, with_variants)
    extension = {"javascript": "js", "python": "py", "bash": "sh"}[codeLanguage]
    with open(f"{folder / base}.{extension}", "w") as file:
        file.write(code)


def export_regular_section(folder, config, section_id, variant_id, with_variants):
    sectionVariant = config["sectionVariants"][variant_id]
    selectedItemId = sectionVariant["selectedItem"]
    codeInfoChildren = (
        config["codeInfoCols"]
        .get(sectionVariant["codeInfoColId"], {})
        .get("children", {})
    )
    pinned = getParamIdsToShowInArea(
        True,
        config["codeInfo"],
        codeInfoChildren,
        selectedItemId,
    )
    unpinned = getParamIdsToShowInArea(
        False,
        config["codeInfo"],
        codeInfoChildren,
        selectedItemId,
    )
    pinned["requiredParamIds"] = pinned["requiredParamIdsToPaths"].keys()
    unpinned["requiredParamIds"] = unpinned["requiredParamIdsToPaths"].keys()
    del pinned["requiredParamIdsToPaths"]
    del unpinned["requiredParamIdsToPaths"]

    output = export_section_to_dict(
        config["codeInfo"],
        codeInfoChildren,
        sectionVariant,
        {"pinned": pinned, "unpinned": unpinned},
    )
    yamlValue = section_dict_to_yaml(output, config["codeInfo"], sectionVariant)
    base = maybe_with_variant_in_filename(config, section_id, variant_id, with_variants)

    with open(folder / f"{base}.yaml", "w") as file:
        file.write(yamlValue)


def export_list_section(folder, config, section_id, variant_id, with_variants):
    subfolder_name = maybe_with_variant_in_filename(
        config, section_id, variant_id, with_variants
    )
    children_folder = folder / subfolder_name
    os.makedirs(children_folder, exist_ok=True)
    for c in config["sectionVariants"][variant_id]["children"]:
        export_section(children_folder, config, c, with_variants)


def export_text_block_section(folder, config, section_id, variant_id, with_variants):
    base = maybe_with_variant_in_filename(config, section_id, variant_id, with_variants)
    section = config["sections"][section_id]
    description = get_section_variant_attr(config, variant_id, "description")
    renderMarkdown = section["renderMarkdown"]
    extension = ".md" if renderMarkdown else ".txt"
    with open(folder / f"{base}{extension}", "w") as file:
        file.write(description)


def export_param_sweep_section(folder, config, section_id, variant_id, with_variants):
    for_section_id = get_for_section_id(config, section_id)
    if not for_section_id:
        return

    sectionVariant = get_selected_section_variant(config, for_section_id)
    codeInfoChildren = config["codeInfoCols"][sectionVariant["codeInfoColId"]][
        "children"
    ]
    sweep = config["sectionVariants"][variant_id]["sweep"]
    e = export_param_sweep_section_to_dict(sweep, config["codeInfo"], codeInfoChildren)
    yamlValue = param_sweep_dict_to_yaml(e)
    base = maybe_with_variant_in_filename(config, section_id, variant_id, with_variants)
    with open(folder / f"{base}.yaml", "w") as file:
        file.write(yamlValue)


def export_global_param_sweep_section(folder, config, section_id, *_, **__):
    subfolder_name = get_section_name(config, section_id)
    folder = folder / subfolder_name
    os.makedirs(folder, exist_ok=True)
    variantIds = config["sections"][section_id]["variantIds"]
    for v in variantIds:
        variant = config["sectionVariants"][v]
        run_group = variant["runGroup"]
        e = export_single_run_group_to_dict(
            run_group,
            config["sections"],
            config["sectionVariants"],
        )
        yamlValue = run_group_dict_to_yaml(e)
        base = variant["name"]
        with open(folder / f"{base}.yaml", "w") as file:
            file.write(yamlValue)


def export_social_section(folder, config, section_id, *_, **__):
    section = config["sections"][section_id]
    url = section["social"]
    base = get_section_name(config, section_id)
    with open(folder / f"{base}.txt", "w") as file:
        file.write(url)


def export_image_section(folder, config, section_id, *_, **__):
    section = config["sections"][section_id]
    artifact_group_id = section["artifactGroupIds"][0]
    artifactId = config["artifactGroups"][artifact_group_id]["artifactTransforms"][0][
        "artifactId"
    ]
    artifact = config["artifacts"][artifactId]
    base = get_section_name(config, section_id)
    save_base64_to_png(artifact["value"], folder / f"{base}.png")


def export_canvas_rendered_value(folder, config, section_id, *_, **__):
    section = config["sections"][section_id]
    if section["renderedValue"]:
        base = get_section_name(config, section_id)
        save_base64_to_png(section["renderedValue"], folder / f"{base}.png")


def maybe_with_variant_in_filename(config, section_id, variant_id, with_variants):
    section_name = get_section_name(config, section_id)
    variant_name = get_variant_name(config, variant_id)
    if with_variants:
        return f"{section_name}@{variant_name}"
    return section_name


def get_exporter_fn(config, section_id):
    stype = get_section_type(config, section_id)
    if stype == C.CODE:
        return export_code
    elif stype in [C.SECTION, C.GLOBAL_VARIABLES]:
        return export_regular_section
    elif stype in [C.LIST_ROOT, C.DICT_ROOT, C.GROUP]:
        return export_list_section
    elif stype == C.TEXT_BLOCK:
        return export_text_block_section
    elif stype == C.PARAM_SWEEP:
        return export_param_sweep_section
    elif stype == C.GLOBAL_PARAM_SWEEP:
        return export_global_param_sweep_section
    # elif stype == C.DRAW:
    #     return export_canvas_rendered_value
    # elif stype == C.IMAGE:
    #     return export_image_section
    elif stype == C.SOCIAL:
        return export_social_section
    # elif stype == C.CHART:
    #     return export_canvas_rendered_value
