import C from "constants/constants.json";
import { getActiveSectionsBounds } from "forks/xyflow/core/utils/graph";
import _ from "lodash";
import { dbCreateCopyOfSections } from "requests/pasteSections";
import { useActiveSection, useMisc, useSectionInfos } from "state/definitions";
import { setNotificationMessage } from "../notification";
import { loadSectionIntoState } from "../sections/loadSections";

export async function paste(props) {
  let x;
  try {
    x = JSON.parse(await navigator.clipboard.readText());
  } catch {
    return;
  }
  if (x.copyType === "sections") {
    pasteSections({ data: x.data, ...props });
  }
}

async function pasteSections({ data, asRef = false }) {
  let dataToPaste;
  if (asRef) {
    dataToPaste = data;
  } else {
    const res = await dbCreateCopyOfSections(data);
    if (res.status === 200) {
      dataToPaste = res.data;
    }
  }
  if (dataToPaste) {
    dataToPaste.sections = removeSingletonSectionsIfAlreadyPresent(dataToPaste);
    const topLevelIds = findTopLevelSections(
      dataToPaste.sections,
      dataToPaste.sectionVariants,
    );

    loadSectionIntoState({
      ...dataToPaste,
      topLevelIds,
      ...getPasteLocation(),
      incrementVersion: true,
    });
  }
}

function findTopLevelSections(sections, sectionVariants) {
  const allChildren = new Set();
  for (const v of Object.values(sectionVariants)) {
    for (const c of v.children) {
      allChildren.add(c);
    }
  }

  const topLevelIds = [];
  for (const id of Object.keys(sections)) {
    if (!allChildren.has(id)) {
      topLevelIds.push(id);
    }
  }
  return topLevelIds;
}

function removeSingletonSectionsIfAlreadyPresent(pasteData) {
  const { sections, uiTypes } = pasteData;

  const {
    [C.GLOBAL_VARIABLES]: globalVariables,
    [C.GLOBAL_PARAM_SWEEP]: globalParamSweep,
  } = useSectionInfos.getState().singletonSections;
  if (!globalVariables && !globalParamSweep) {
    return sections;
  }

  const toRemove = [];
  const usedJsonSources = new Set();
  for (const s of Object.values(useSectionInfos.getState().x)) {
    if (s.jsonSource) {
      usedJsonSources.add(s.jsonSource);
    }
  }

  for (const s of Object.values(sections)) {
    const uiTypeName = uiTypes[s.uiTypeId].type;
    if (
      (globalVariables && uiTypeName === C.GLOBAL_VARIABLES) ||
      (globalParamSweep && uiTypeName === C.GLOBAL_PARAM_SWEEP)
    ) {
      toRemove.push(s.id);
      toRemove.push(s.paramSweepSectionId);
      setNotificationMessage("Can't have more than 1 global section!");
    }
    if (usedJsonSources.has(s.jsonSource)) {
      toRemove.push(s.id);
      setNotificationMessage(
        "Can't have more than 1 section referring to the same json source",
      );
    }
  }

  return _.omit(sections, toRemove);
}

function getPasteLocation() {
  if (useActiveSection.getState().ids.length === 0) {
    return useMisc.getState().lastPaneClickLocation;
  }
  // paste directly to the right of the active sections
  const { x, y, width } = getActiveSectionsBounds();
  return { x: x + width, y };
}
