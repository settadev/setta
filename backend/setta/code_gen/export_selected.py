import copy

from setta.database.db.codeInfo.utils import new_code_info_col
from setta.database.db.sectionVariants.utils import new_ev_entry, new_section_variant
from setta.database.db.uiTypes.utils import new_ui_type_col_entry
from setta.utils.section_contents import findAllParametersAndPathMaps
from setta.utils.utils import QuoteInsensitiveDict, replace_null_keys_with_none

from ..utils.constants import BASE_UI_TYPES, C
from .find_placeholders import tp
from .utils import process_refs


def get_section_type(p, id):
    ui_type_id = p["sections"][id]["uiTypeId"]
    ui_type = p["uiTypes"].get(ui_type_id) or BASE_UI_TYPES[ui_type_id]
    return ui_type["type"]


def get_artifacts(p, id):
    artifactGroupIds = p["sections"][id]["artifactGroupIds"]
    artifacts = []
    for groupId in artifactGroupIds:
        for transform in p["artifactGroups"][groupId]["artifactTransforms"]:
            artifacts.append(p["artifacts"][transform["artifactId"]])
    return artifacts


def get_drawing(p, id):
    return p["sections"][id]["drawing"]


def get_chat_message(p, id):
    return p["sections"][id]["latestChatMessage"]


def get_section_name(p, id):
    return p["sections"][id]["name"]


def get_selected_item(p, id):
    selected_item = get_selected_section_variant(p, id)["selectedItem"]
    if selected_item:
        return p["codeInfo"][selected_item]
    return None


def get_selected_item_name(p, id):
    selected_item = get_selected_item(p, id)
    if selected_item:
        return selected_item["name"]
    return None


def get_selected_item_id(p, id):
    selected_item = get_selected_item(p, id)
    if selected_item:
        return selected_item["id"]
    return None


def get_selected_item_ev_refs(p, id):
    selected_item = get_selected_item(p, id)
    if selected_item:
        return selected_item["evRefs"]
    return None


def get_code_info_children(p, section_id, id):
    codeInfoChildren = get_section_code_info_children(p, section_id)
    return codeInfoChildren.get(id, [])


def get_section_code_info_children(p, section_id):
    codeInfoColId = get_selected_section_variant(p, section_id)["codeInfoColId"]
    if not codeInfoColId:
        codeInfoCol = new_code_info_col()
    else:
        codeInfoCol = p["codeInfoCols"][codeInfoColId]
    return codeInfoCol["children"]


def get_top_level_param_ids(p, id):
    selected_item_id = get_selected_item_id(p, id)
    children = get_code_info_children(p, id, selected_item_id)
    return [c for c in children if p["codeInfo"][c]["rcType"] == C.PARAMETER]


def get_param_ui_type(p, section_id, id):
    ui_type_col_id = p["sections"][section_id]["uiTypeColId"]
    ui_type_col = p["uiTypeCols"][ui_type_col_id] if ui_type_col_id else {}
    ui_type_col_entry = ui_type_col.get(id, new_ui_type_col_entry())
    ui_type_id = ui_type_col_entry["uiTypeId"]
    ui_type = p["uiTypes"].get(ui_type_id) or BASE_UI_TYPES[ui_type_id]
    return ui_type["type"]


def get_selected_section_variant(p, section_id):
    variantId = get_selected_section_variant_id(p, section_id)
    return p["sectionVariants"][variantId]


def get_section_variant_ids(p, section_id):
    return p["sections"][section_id]["variantIds"]


def get_section_variants(p, section_id):
    variantIds = get_section_variant_ids(p, section_id)
    return [p["sectionVariants"][v] for v in variantIds]


def get_selected_section_variant_id(p, section_id):
    return p["sections"][section_id]["variantId"]


def get_section_variant_attr(p, variantId, attr):
    return p["sectionVariants"][variantId][attr]


def get_variant_code(p, variantId):
    return get_section_variant_attr(p, variantId, "code")


def get_variant_name(p, variantId):
    return get_section_variant_attr(p, variantId, "name")


def get_section_code(p, id):
    return get_selected_section_variant(p, id)["code"]


def get_section_children(p, id):
    return get_selected_section_variant(p, id)["children"]


def get_specific_template_var(template_vars, keyword, return_index=False):
    for i, t in enumerate(template_vars):
        if t["keyword"] == keyword:
            return (t, i) if return_index else t
    return (None, -1) if return_index else None


def get_gen_code_template_var(template_vars):
    return get_specific_template_var(template_vars, tp(C.SETTA_GENERATED_PYTHON))


def no_entered_value(value):
    return value is None or value == ""


def get_var_name(var_name_mapping):
    return f"{C.ARGS_PREFIX}x{len(var_name_mapping)}"


def get_for_section_id(p, section_id):
    for sid, s in p["sections"].items():
        if s["paramSweepSectionId"] == section_id:
            return sid
    return None


def get_param_full_path_name(id, pathMap, codeInfo):
    if len(pathMap[id]) == 1:
        return codeInfo[pathMap[id][0]]["name"]
    else:
        name = ""
        for pathIdx, currId in enumerate(pathMap[id]):
            if pathIdx == 0:
                name = codeInfo[currId]["name"]
            else:
                name += f'["{codeInfo[currId]["name"]}"]'
        return name


def export_selected(p, always_export_args_objs, force_include_template_var):
    p["codeInfoCols"] = replace_null_keys_with_none(p["codeInfoCols"])
    e = Exporter(
        p,
        always_export_args_objs=always_export_args_objs,
        force_include_template_var=force_include_template_var,
    )
    e.export()
    return e


def export_for_in_memory_fn(p):
    p["codeInfoCols"] = replace_null_keys_with_none(p["codeInfoCols"])
    e = ExporterForInMemoryFn(p)
    e.export()
    return e


def export_section_to_dict(
    codeInfo,
    codeInfoChildren,
    sectionVariant,
    pinnedUnpinnedDict,
):
    codeInfoChildren = replace_null_keys_with_none(codeInfoChildren)
    output = {}
    for k, v in pinnedUnpinnedDict.items():
        e = SectionToDict(
            codeInfo,
            codeInfoChildren,
            sectionVariant,
            v["topLevelParamIds"],
            v.get("requiredParamIds", None),
        )
        e.export()
        output[k] = e

    return output


def export_param_sweep_section_to_dict(sweep, codeInfo, codeInfoChildren):
    codeInfoChildren = replace_null_keys_with_none(codeInfoChildren)
    e = ParamSweepSectionToDict(sweep, codeInfo, codeInfoChildren)
    e.export()
    return e


def export_single_run_group_to_dict(runGroup, sections, sectionVariants):
    runGroup = replace_null_keys_with_none(runGroup)
    e = SingleRunGroupToDict(runGroup, sections, sectionVariants)
    e.export()
    return e


def remove_unneeded_sections(p, keep_section_types):
    to_pop = []
    for id in p["sections"].keys():
        section_type = get_section_type(p, id)
        if section_type not in keep_section_types:
            to_pop.append(id)
    for id in to_pop:
        parentId = p["sections"][id]["parentId"]
        if parentId:
            parentVariant = get_selected_section_variant(p, parentId)
            parentVariant["children"] = [
                c for c in parentVariant["children"] if c != id
            ]
        p["sections"].pop(id, None)
        p["projectConfig"]["children"].pop(id, None)


class Exporter:
    def __init__(self, p, always_export_args_objs, force_include_template_var):
        self.output = {}
        self.p = copy.deepcopy(p)
        self.var_name_mapping = {}
        self.var_name_reverse_mapping = {}
        self.always_export_args_objs = always_export_args_objs
        self.force_include_template_var = force_include_template_var
        self.code_gen_template_var_section_details = {
            "section": {},
            "sectionVariant": {},
        }
        if force_include_template_var:
            section_details = {
                "id": None,
                "name": C.DEFAULT_PYTHON_SCRIPT_NAME,
                "codeLanguage": "python",
            }
            _, section_variant = new_section_variant(
                code=tp(C.SETTA_GENERATED_PYTHON),
                templateVars=[
                    {
                        "startPos": 0,
                        "keyword": tp(C.SETTA_GENERATED_PYTHON),
                        "sectionId": None,
                    }
                ],
            )
            self.code_gen_template_var_section_details = {
                "section": section_details,
                "sectionVariant": section_variant,
            }
        self.section_types_to_process = [
            C.SECTION,
            C.LIST_ROOT,
            C.DICT_ROOT,
            C.GROUP,
            C.CODE,
            C.GLOBAL_VARIABLES,
            C.TEXT_BLOCK,
        ]

    def export(self):
        remove_unneeded_sections(
            self.p,
            self.section_types_to_process,
        )
        self.export_sections(list(self.p["projectConfig"]["children"].keys()))

    def export_sections(self, ids):
        return [self.export_section(x) for x in ids]

    def export_section(self, id):
        var_name = self.maybe_create_var_name(
            id,
            None,
        )
        if var_name not in self.output:
            type = get_section_type(self.p, id)
            info = {
                "sectionId": id,
                "name": get_section_name(self.p, id),
                "type": type,
            }
            if type == C.SECTION:
                if self.always_export_args_objs:
                    self.export_args_obj(id)
                (
                    used_params,
                    unused_params,
                    passingStyles,
                ) = self.export_section_params(id)

                selected_item_ev_refs = get_selected_item_ev_refs(self.p, id)
                if selected_item_ev_refs:
                    callable, ref_template_var_positions = process_refs(
                        get_selected_item_name(self.p, id),
                        selected_item_ev_refs,
                        self.maybe_create_ref_var_name,
                    )
                    ref_var_name_positions = ref_template_var_positions["refs"]
                    used_ref_var_names = [x["value"] for x in ref_var_name_positions]
                else:
                    callable = get_selected_item_name(self.p, id)
                    used_ref_var_names = []
                    ref_var_name_positions = []

                info["value"] = {
                    "callable": callable,
                    "usedParams": used_params,
                    "unusedParams": unused_params,
                    "passingStyles": passingStyles,
                }
                info["dependencies"] = [*used_params, *used_ref_var_names]
                info["ref_var_name_positions"] = ref_var_name_positions
                self.output[var_name] = info
            elif type in [C.LIST_ROOT, C.DICT_ROOT, C.GROUP]:
                children = get_section_children(self.p, id)
                children = [
                    c
                    for c in children
                    if get_section_type(self.p, c) in self.section_types_to_process
                ]
                # some sections (like CODE) don't get added to self.output
                info["value"] = [
                    x for x in self.export_sections(children) if x in self.output
                ]
                info["dependencies"] = info["value"]
                info[
                    "ref_var_name_positions"
                ] = []  # has to be populated when the code is generated
                self.output[var_name] = info
            elif type == C.CODE:
                variant = get_selected_section_variant(self.p, id)
                gen_code_template_var = get_gen_code_template_var(
                    variant["templateVars"]
                )
                if gen_code_template_var:
                    self.code_gen_template_var_section_details = {
                        "section": self.p["sections"][id],
                        "sectionVariant": variant,
                    }
                    # Make sure any necessary variables get created.
                    # We don't do any replacements here, because that's done later
                    # when the code is actually run.
                    process_refs(
                        get_section_code(self.p, id),
                        variant["evRefs"],
                        self.maybe_create_ref_var_name,
                    )
            elif type == C.GLOBAL_VARIABLES:
                # don't need to process the output since the global variables get added directly to the output
                # i.e. they aren't children of anything
                self.export_section_params(id)
            elif type == C.TEXT_BLOCK:
                variant = get_selected_section_variant(self.p, id)
                info["value"] = variant["description"]
                info["dependencies"] = []
                info["ref_var_name_positions"] = []
                self.output[var_name] = info
            else:
                raise ValueError
        return var_name

    def export_args_obj(self, id):
        var_name = self.maybe_create_var_name(
            id,
            None,
            is_args_obj=True,
        )
        if var_name not in self.output:
            (
                used_params,
                unused_params,
                passingStyles,
            ) = self.export_section_params(id)
            info = {
                "sectionId": id,
                "name": get_section_name(self.p, id),
                "type": C.SECTION,
                "value": {
                    "callable": None,
                    "usedParams": used_params,
                    "unusedParams": unused_params,
                    "passingStyles": passingStyles,
                },
                "dependencies": used_params,
                "ref_var_name_positions": [],  # has to be populated when the code is generated
            }
            self.output[var_name] = info
        return var_name

    def export_section_params(self, section_id):
        ids = get_top_level_param_ids(self.p, section_id)
        return self.export_params(section_id, ids)

    def export_params(self, section_id, ids):
        var_names = [self.export_param(section_id, x) for x in ids]
        var_names = [x for x in var_names if x]
        used_params = []
        unused_params = []
        passingStyles = {}
        for v in var_names:
            if no_entered_value(self.output[v]["value"]):
                unused_params.append(v)
            else:
                used_params.append(v)

            curr_param_info_id = self.output[v]["paramInfoId"]
            passingStyles[v] = self.p["codeInfo"][curr_param_info_id].get(
                "passingStyle", None
            )
        return used_params, unused_params, passingStyles

    def export_param(self, section_id, id):
        codeInfo = self.p["codeInfo"][id]
        param_name = codeInfo["name"]
        if not param_name:
            return None
        var_name = self.maybe_create_var_name(
            section_id,
            id,
        )

        if var_name not in self.output:
            param_children = get_code_info_children(self.p, section_id, id)
            if len(param_children) > 0:
                used_params, _, _ = self.export_params(section_id, param_children)
                info = {
                    "sectionId": section_id,
                    "paramInfoId": id,
                    "name": param_name,
                    "type": C.NESTED_PARAM,
                    "value": used_params,
                    "dependencies": used_params,
                    "ref_var_name_positions": [],  # has to be populated when the code is generated
                }
                self.output[var_name] = info
            else:
                (
                    value,
                    used_ref_var_names,
                    ref_var_name_positions,
                ) = self.export_param_value(section_id, id)
                self.output[var_name] = {
                    "sectionId": section_id,
                    "paramInfoId": id,
                    "name": param_name,
                    "type": get_param_ui_type(self.p, section_id, id),
                    "value": value,
                    "dependencies": used_ref_var_names,
                    "ref_var_name_positions": ref_var_name_positions,
                }

        return var_name

    def export_param_value(self, section_id, id):
        variant = get_selected_section_variant(self.p, section_id)
        if id in variant["values"]:
            value = variant["values"][id]["value"]
            refs = variant["values"][id]["evRefs"]
            value, ref_template_var_positions = process_refs(
                value, refs, self.maybe_create_ref_var_name
            )
            ref_var_name_positions = ref_template_var_positions["refs"]
            used_ref_var_names = [x["value"] for x in ref_var_name_positions]
        else:
            value = new_ev_entry()["value"]
            used_ref_var_names = []
            ref_var_name_positions = []
        return value, used_ref_var_names, ref_var_name_positions

    def maybe_create_ref_var_name(
        self, ref_section_id, ref_param_info_id, ref_is_args_obj
    ):
        if ref_is_args_obj:
            return self.export_args_obj(ref_section_id)
        elif ref_param_info_id:
            return self.export_param(ref_section_id, ref_param_info_id)
        elif ref_section_id:
            return self.export_section(ref_section_id)
        else:
            raise ValueError

    def get_ref_var_name(self, ref_section_id, ref_param_info_id, ref_is_args_obj):
        return self.var_name_mapping[
            (ref_section_id, ref_param_info_id, ref_is_args_obj)
        ]

    def maybe_create_var_name(
        self,
        section_id,
        param_info_id,
        is_args_obj=False,
    ):
        mapping_key = (section_id, param_info_id, is_args_obj)
        var_name = self.var_name_mapping.get(mapping_key)
        if not var_name:
            var_name = get_var_name(self.var_name_mapping)
            self.var_name_mapping[mapping_key] = var_name
            self.var_name_reverse_mapping[var_name] = mapping_key
        elif var_name not in self.output:
            # this means the var_name has already been created
            # but it hasn't been added to the output.
            # This only happens in a circular dependency.
            raise RecursionError("There is a circular reference")
        return var_name


class ExporterForInMemoryFn:
    def __init__(self, p):
        self.output = {}
        self.p = copy.deepcopy(p)
        self.var_name_mapping = {}
        self.var_name_reverse_mapping = QuoteInsensitiveDict()

    def export(self):
        remove_unneeded_sections(
            self.p,
            [
                C.SECTION,
                C.LIST_ROOT,
                C.DICT_ROOT,
                C.GROUP,
                C.IMAGE,
                # C.CHART,
                C.DRAW,
                C.CHAT,
                C.GLOBAL_VARIABLES,
                C.TEXT_BLOCK,
            ],
        )
        for id in list(self.p["projectConfig"]["children"].keys()):
            name = get_section_name(self.p, id)
            value, value_is_returned = self.export_section(id, name)
            if value_is_returned:
                self.output[name] = value

    def export_section(self, id, name):
        type = get_section_type(self.p, id)
        self.create_var_mapping((id,), name)
        value = None
        value_is_returned = True
        if type == C.SECTION:
            selectedItem = get_selected_item_name(self.p, id)
            params = self.export_section_params(
                id, f'{name}["params"]', is_global=False
            )
            value = {"selectedItem": selectedItem, "params": params}
            self.create_var_mapping((id, "selectedItem"), f'{name}["selectedItem"]')
        elif type in [C.LIST_ROOT, C.DICT_ROOT, C.GROUP]:
            children = get_section_children(self.p, id)
            if type == C.LIST_ROOT:
                value = [
                    self.export_section(c, f"{name}[{idx}]")
                    for idx, c in enumerate(children)
                ]
            elif type in [C.DICT_ROOT, C.GROUP]:
                value = {}
                for c in children:
                    child_name = get_section_name(self.p, c)
                    value[child_name] = self.export_section(
                        c, f'{name}["{child_name}"]'
                    )
        elif type in [C.IMAGE]:
            artifacts = get_artifacts(self.p, id)
            img = artifacts[0]["value"] if len(artifacts) > 0 else None
            value = {"image": img}
            self.create_var_mapping((id, "image"), f'{name}["image"]')
        elif type == C.DRAW:
            value = {
                "drawing": get_drawing(self.p, id),
            }
            self.create_var_mapping((id, "drawing"), f'{name}["drawing"]')
        elif type == C.CHAT:
            latestChatMessage = get_chat_message(self.p, id)
            artifacts = get_artifacts(self.p, id)
            chatHistory = artifacts[0]["value"] if len(artifacts) > 0 else None
            value = {"latestChatMessage": latestChatMessage, "chatHistory": chatHistory}
            self.create_var_mapping(
                (id, "latestChatMessage"), f'{name}["latestChatMessage"]'
            )
            self.create_var_mapping((id, "chatHistory"), f'{name}["chatHistory"]')
        elif type == C.GLOBAL_VARIABLES:
            self.output.update(self.export_section_params(id, "", is_global=True))
            value_is_returned = False
        elif type == C.TEXT_BLOCK:
            variant = get_selected_section_variant(self.p, id)
            value = {"text": variant["description"]}
            self.create_var_mapping((id, "text"), f'{name}["text"]')
        else:
            raise ValueError
        return value, value_is_returned

    def export_section_params(self, section_id, name, is_global):
        return self.export_params(
            section_id, get_top_level_param_ids(self.p, section_id), name, is_global
        )

    def export_params(self, section_id, ids, name, is_global):
        params = {}
        for param_id in ids:
            codeInfo = self.p["codeInfo"][param_id]
            param_name = codeInfo["name"]
            if not param_name:
                continue
            param_children = get_code_info_children(self.p, section_id, param_id)
            if len(param_children) > 0:
                value = self.export_params(section_id, param_children, name, is_global)
            else:
                value = self.export_param_value(section_id, param_id)
            param_name = codeInfo["name"]
            params[param_name] = value
            if is_global:
                self.create_var_mapping((section_id, param_id), param_name)
            else:
                self.create_var_mapping(
                    (section_id, param_id), f'{name}["{param_name}"]'
                )
        return params

    def export_param_value(self, section_id, id):
        values = get_selected_section_variant(self.p, section_id)["values"]
        if id in values:
            return values[id]["value"]
        return ""

    def create_var_mapping(self, key, value):
        self.var_name_mapping[key] = value
        self.var_name_reverse_mapping[value] = key


class SectionToDict:
    def __init__(
        self,
        codeInfo,
        codeInfoChildren,
        sectionVariant,
        topLevelParamIds,
        requiredParamIds,
    ):
        self.output = {}
        self.prettyOutput = {}
        self.codeInfo = codeInfo
        self.codeInfoChildren = codeInfoChildren
        self.sectionVariant = sectionVariant
        self.topLevelParamIds = topLevelParamIds
        self.requiredParamIds = set(requiredParamIds) if requiredParamIds else None

    def export(self):
        self.output, self.prettyOutput = self.export_params(self.topLevelParamIds)

    def export_params(self, ids):
        params = {}
        prettyParams = {}
        for param_id in ids:
            if (
                self.requiredParamIds is not None
                and param_id not in self.requiredParamIds
            ):
                continue
            codeInfo = self.codeInfo[param_id]
            param_name = codeInfo["name"]
            if not param_name:
                continue
            param_children = self.codeInfoChildren[param_id]
            if len(param_children) > 0:
                value, prettyValue = self.export_params(param_children)
            else:
                value, prettyValue = self.export_param_value(param_id)
            params[codeInfo["name"]] = {
                "id": param_id,
                "value": value,
                "editable": codeInfo["editable"],
            }
            prettyParams[codeInfo["name"]] = prettyValue
        return params, prettyParams

    def export_param_value(self, id):
        values = self.sectionVariant["values"]
        if id in values:
            value = values[id]["value"]
        else:
            value = new_ev_entry()["value"]
        return value, value


class ParamSweepSectionToDict:
    def __init__(
        self,
        sweep,
        codeInfo,
        codeInfoChildren,
    ):
        self.prettyOutput = []
        self.sweep = sweep
        self.codeInfo = codeInfo
        self.codeInfoChildren = codeInfoChildren

    def export(self):
        for selectedItemSweep in self.sweep:
            self.export_selected_item_sweep(selectedItemSweep)

    def export_selected_item_sweep(self, selectedItemSweep):
        selectedItem = selectedItemSweep["selectedItem"]
        params = selectedItemSweep["params"]
        if selectedItem:
            selectedItemName = self.codeInfo[selectedItem]["name"]
            currObj = {selectedItemName: []}
            curr = currObj[selectedItemName]
        else:
            curr = currObj = []
        result = findAllParametersAndPathMaps(
            allCodeInfo=self.codeInfo,
            codeInfoChildren=self.codeInfoChildren,
            startingId=selectedItem,
        )
        pathMap = result["pathMap"]
        for p in params:
            if p["paramInfoId"]:
                paramFullPathName = get_param_full_path_name(
                    p["paramInfoId"], pathMap, self.codeInfo
                )
            else:
                paramFullPathName = None
            curr.append({paramFullPathName: p["values"]})
        self.prettyOutput.append(currObj)


class SingleRunGroupToDict:
    def __init__(
        self,
        runGroup,
        sections,
        sectionVariants,
    ):
        self.prettyOutput = {}
        self.runGroup = runGroup
        self.sections = sections
        self.sectionVariants = sectionVariants

    def export(self):
        if not self.runGroup:
            return
        for s in self.sections.values():
            if not s["parentId"]:
                result = self.export_section_details(s["id"], None)
                if result:
                    self.prettyOutput.update(result)

    def export_section_details(self, sectionId, parentVariantId):
        details = self.runGroup.get(sectionId, {}).get(parentVariantId, None)
        if not details or not details["selected"]:
            return {}
        section_info = self.sections[sectionId]
        section_name = section_info["name"]
        output = {section_name: {}}

        for variantId, selected in details["versions"].items():
            if not selected:
                continue
            variant = self.sectionVariants[variantId]
            variant_name = f'@{variant["name"]}'
            children = variant["children"]
            child_dict = {}
            for c in children:
                child_result = self.export_section_details(c, variantId)
                if child_result:
                    child_dict.update(child_result)
            output[section_name][variant_name] = child_dict

        if len(section_info["variantIds"]) == 1:
            output[section_name] = output[section_name][variant_name]

        for paramSweepSectionVariantId, selected in details["paramSweeps"].items():
            if not selected:
                continue
            param_sweep_name = (
                f'~{self.sectionVariants[paramSweepSectionVariantId]["name"]}'
            )
            output[section_name][param_sweep_name] = {}

        return output
