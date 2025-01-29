import C from "constants/constants.json";
import { useReactFlow } from "forks/xyflow/core/store";
import { getSectionRect } from "forks/xyflow/core/utils/graph";
import { moveSections } from "state/actions/sections/moveSections";
import {
  useActiveSection,
  useNodeInternals,
  useSectionInfos,
} from "state/definitions";
import { setActiveSectionIds } from "../activeSections";
import { getSectionType, getSectionVariant } from "../sectionInfos";
import { maybeIncrementProjectStateVersion } from "../undo";
import { addSectionAtPosition } from "./createSections";
import { deleteSections } from "./deleteSections";

export function createGroup({ nodeIds, x, y }) {
  let groupId;
  useSectionInfos.setState((state) => {
    groupId = addSectionAtPosition({
      type: C.GROUP,
      position: { x, y },
      state,
    });

    moveSections({
      oldParentId: null,
      newParentId: groupId,
      sectionIds: nodeIds,
      state,
    });

    state.shouldRenameReferences = true;
  });

  setActiveSectionIds([groupId]);

  maybeIncrementProjectStateVersion(true);
}

export async function groupSections() {
  const activeSectionIds = useActiveSection.getState().ids;
  const selectedNodes = [...useNodeInternals.getState().x].filter((x) =>
    activeSectionIds.includes(x[0]),
  );
  const numSelected = selectedNodes.length;
  if (numSelected > 0) {
    const nodeIds = selectedNodes.map((x) => x[1].id);
    const x = Math.min(...selectedNodes.map((x) => x[1].position.x));
    const y = Math.min(...selectedNodes.map((x) => x[1].position.y));
    createGroup({ nodeIds, x, y });
    useReactFlow.setState({ nodesSelectionDims: null });
  }
}

export function ungroup(groupId, state) {
  if (getSectionType(groupId, state) !== C.GROUP) {
    return;
  }
  const childIds = getSectionVariant(groupId, state).children;
  const positions = {};
  childIds.forEach((id) => {
    const { x, y } = getSectionRect(id);
    positions[id] = { x, y };
  });

  moveSections({
    oldParentId: groupId,
    newParentId: null,
    sectionIds: childIds,
    positions,
    state,
  });

  deleteSections([groupId], state);

  state.shouldRenameReferences = true;
}

export function ungroupActiveGroup() {
  useSectionInfos.setState((state) => {
    const ids = useActiveSection.getState().ids;
    // TODO: support multiple groups
    if (ids.length === 1) {
      ungroup(ids[0], state);
    }
  });
  maybeIncrementProjectStateVersion(true);
}
