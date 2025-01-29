from fastapi import APIRouter
from pydantic import BaseModel

from setta.utils.constants import C
from setta.utils.utils import replace_at_positions

router = APIRouter()


class MakeEVRefTemplateVarReplacementsRequest(BaseModel):
    codeAreaReplacements: dict
    codeInfoReplacements: dict
    paramEVReplacements: dict


def get_original(r):
    if "originalEVRef" in r:
        return r["originalEVRef"]
    elif "originalTemplateVar" in r:
        return r["originalTemplateVar"]
    else:
        raise KeyError


def create_replacements_array(replacements):
    output = []
    for startPos, r in replacements.items():
        oldName = get_original(r)["keyword"]
        newName = r["newName"]
        output.append((startPos, oldName, newName))
    return output


def create_new_ev_refs_template_vars(replacements, newStartPositions):
    evRefs = []
    templateVars = []
    for oldPos, startPos, newName in newStartPositions:
        common = {"startPos": startPos, "keyword": newName}
        r = replacements[oldPos]
        if "originalEVRef" in r:
            evRefs.append({**r["originalEVRef"], **common})
        elif "originalTemplateVar" in r:
            templateVars.append({**r["originalTemplateVar"], **common})
        else:
            raise KeyError

    # frontend needs it sorted by startPos
    evRefs = sorted(evRefs, key=lambda x: x["startPos"])
    templateVars = sorted(templateVars, key=lambda x: x["startPos"])
    return evRefs, templateVars


def get_new_value_and_positions(details):
    return replace_at_positions(
        details["string"],
        create_replacements_array(details["replacements"]),
        return_positions=True,
    )


def convert_to_dict(replacements):
    output = {}
    for r in replacements:
        output[get_original(r)["startPos"]] = r
    return output


@router.post(C.ROUTE_MAKE_EV_REF_TEMPLATE_VAR_REPLACEMENTS)
def route_make_ev_ref_template_var_replacements(
    x: MakeEVRefTemplateVarReplacementsRequest,
):
    newCodeAreaValues = {}
    for variantId, details in x.codeAreaReplacements.items():
        details["replacements"] = convert_to_dict(details["replacements"])
        newValue, newStartPositions = get_new_value_and_positions(details)
        newCodeAreaValues[variantId] = [
            newValue,
            *create_new_ev_refs_template_vars(
                details["replacements"], newStartPositions
            ),
        ]

    newCodeInfoValues = {}
    for codeInfoId, details in x.codeInfoReplacements.items():
        details["replacements"] = convert_to_dict(details["replacements"])
        newValue, newStartPositions = get_new_value_and_positions(details)
        newCodeInfoValues[codeInfoId] = [
            newValue,
            *create_new_ev_refs_template_vars(
                details["replacements"], newStartPositions
            ),
        ]

    newParamEVValues = {}
    for variantId, v in x.paramEVReplacements.items():
        newParamEVValues[variantId] = {}
        for referringParamInfoId, details in v.items():
            details["replacements"] = convert_to_dict(details["replacements"])
            newValue, newStartPositions = get_new_value_and_positions(details)
            newParamEVValues[variantId][referringParamInfoId] = [
                newValue,
                *create_new_ev_refs_template_vars(
                    details["replacements"], newStartPositions
                ),
            ]

    return {
        "newCodeAreaValues": newCodeAreaValues,
        "newCodeInfoValues": newCodeInfoValues,
        "newParamEVValues": newParamEVValues,
    }
