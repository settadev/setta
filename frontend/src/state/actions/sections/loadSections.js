import { addNodes } from "state/actions/nodeInternals";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos } from "state/definitions";
import { updateSectionInfos } from "../sectionInfos";

export function loadSectionIntoState({
  sections,
  sectionVariants,
  uiTypeCols,
  uiTypes,
  codeInfoCols,
  codeInfo,
  relativePositions,
  topLevelIds,
  x,
  y,
  incrementVersion,
}) {
  const topLevelMapping = {};
  for (const i of topLevelIds) {
    topLevelMapping[i] = {
      x: x + relativePositions[i].x,
      y: y + relativePositions[i].y,
      zIndex: relativePositions[i].zIndex,
    };
  }

  useSectionInfos.setState((state) => {
    updateSectionInfos({
      sections,
      sectionVariants,
      uiTypes,
      uiTypeCols,
      codeInfo,
      codeInfoCols,
      state,
    });
  });

  const nodes = [];
  for (const [id, n] of Object.entries(topLevelMapping)) {
    nodes.push({
      id,
      position: { x: n.x, y: n.y },
      zIndex: n.zIndex,
      tempZIndex: n.zIndex,
    });
  }
  addNodes(nodes);
  maybeIncrementProjectStateVersion(incrementVersion);
}
