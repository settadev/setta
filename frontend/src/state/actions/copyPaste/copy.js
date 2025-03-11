import C from "constants/constants.json";
import { getSectionRect } from "forks/xyflow/core/utils/graph";
import _ from "lodash";
import { useActiveSection, useSectionInfos } from "state/definitions";
import { getForSectionId } from "state/hooks/paramSweep";
import { findAll } from "utils/getDescendants";
import { addTemporaryNotification } from "../notifications";
import {
  getAllSectionsForDeletionOrCopying,
  getSectionType,
} from "../sectionInfos";

export async function copy() {
  const activeSectionIds = useActiveSection.getState().ids;
  if (activeSectionIds.length > 0 && window.getSelection().toString() === "") {
    const data = copySections(activeSectionIds);
    await navigator.clipboard.writeText(
      JSON.stringify({
        data,
        copyType: "sections",
      }),
    );
  }
}

export function copySections(sectionIds) {
  const state = useSectionInfos.getState();
  const sections = getSections(sectionIds, state);
  const sectionVariants = getSectionVariants(sections, state);
  const uiTypeCols = getUITypeCols(sections, state);
  const uiTypes = getUITypes(sections, uiTypeCols, state);
  const codeInfoCols = getCodeInfoCols(sectionVariants, state);
  const codeInfo = getCodeInfo(codeInfoCols, state);
  const relativePositions = getRelativePositions(sections);
  return {
    sections,
    sectionVariants,
    uiTypeCols,
    uiTypes,
    codeInfoCols,
    codeInfo,
    relativePositions,
  };
}

function getSections(sectionIds, state) {
  const ids = getAllSectionsForDeletionOrCopying(sectionIds, state);
  const allSections = _.pick(state.x, ids);

  const withoutLoneParamSweeps = _.pickBy(allSections, (s) => {
    if (getSectionType(s.id) !== C.PARAM_SWEEP) {
      return true;
    }
    // if it's a param sweep section, then keep it only if it's corresponding section is also being copied.
    return !!getForSectionId(s.id, allSections);
  });

  if (_.size(allSections) !== _.size(withoutLoneParamSweeps)) {
    addTemporaryNotification("Lone param sweeps won't be included in copy");
  }

  return withoutLoneParamSweeps;
}

function getSectionVariants(sections, state) {
  const output = {};
  for (const s of Object.values(sections)) {
    Object.assign(output, _.pick(state.variants, s.variantIds));
  }
  return output;
}

function getUITypeCols(sections, state) {
  return _.pick(
    state.uiTypeCols,
    _.map(sections, (x) => x.uiTypeColId),
  );
}

function getUITypes(sections, uiTypeCols, state) {
  const uiTypeIds = [];
  for (const s of Object.values(sections)) {
    uiTypeIds.push(s.uiTypeId);
    uiTypeIds.push(...s.nonPresetUITypeIds);
  }
  for (const col of Object.values(uiTypeCols)) {
    for (const u of Object.values(col)) {
      uiTypeIds.push(u.uiTypeId);
      uiTypeIds.push(...u.nonPresetUITypeIds);
    }
  }
  return _.pick(state.uiTypes, uiTypeIds);
}

function getCodeInfoCols(sectionVariants, state) {
  return _.pick(
    state.codeInfoCols,
    _.map(sectionVariants, (x) => x.codeInfoColId),
  );
}

function getCodeInfo(codeInfoCols, state) {
  let output = [];
  for (const codeInfoCol of Object.values(codeInfoCols)) {
    const { ids } = findAll(state.codeInfo, codeInfoCol.children);

    for (const id of ids) {
      output.push(state.codeInfo[id]);
    }
  }
  output = _.keyBy(_.cloneDeep(output), (x) => x.id);

  return output;
}

function getRelativePositions(sections) {
  const positions = {};
  for (const k of Object.keys(sections)) {
    const rect = getSectionRect(k);
    if (rect) {
      positions[k] = { x: rect.x, y: rect.y, zIndex: 0 };
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  for (const p of Object.values(positions)) {
    if (p.x < minX) {
      minX = p.x;
    }
    if (p.y < minY) {
      minY = p.y;
    }
  }

  return _.mapValues(positions, (v) => ({
    x: v.x - minX,
    y: v.y - minY,
    zIndex: v.zIndex,
  }));
}
