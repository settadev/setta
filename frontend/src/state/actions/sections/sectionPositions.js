import { zoomIdentity } from "d3-zoom";
import { useReactFlow } from "forks/xyflow/core/store";
import {
  getD3Transition,
  getSectionRect,
  getViewportForBounds,
} from "forks/xyflow/core/utils/graph";
import _ from "lodash";
import potpack from "potpack";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useNodeInternals, useSettings } from "state/definitions";
import { setActiveSectionIds } from "../activeSections";
import { getNewNodes } from "../nodeInternals";

export function setZIndices(sectionIds, incrementVersion) {
  const nodeInternals = useNodeInternals.getState().x;
  const excludingInputIds = Array.from(nodeInternals.values()).filter(
    (x) => !sectionIds.includes(x),
  );

  excludingInputIds.sort((a, b) => a.zIndex - b.zIndex); //sort in increasing order of zindex

  const newValues = _.cloneDeep(nodeInternals);
  for (let i = 0; i < excludingInputIds.length; i++) {
    const curr = newValues.get(excludingInputIds[i].id);
    curr.zIndex = i;
    curr.tempZIndex = curr.zIndex;
  }
  for (let i = 0; i < sectionIds.length; i++) {
    if (!nodeInternals.has(sectionIds[i])) {
      continue;
    }
    const curr = newValues.get(sectionIds[i]);
    curr.zIndex = i + excludingInputIds.length;
    curr.tempZIndex = curr.zIndex;
  }

  useNodeInternals.setState({ x: newValues });

  maybeIncrementProjectStateVersion(incrementVersion);
}

export function goToSection(sectionId) {
  const rfStore = useReactFlow.getState();
  const {
    x: sectionX,
    y: sectionY,
    width: sectionWidth,
    height: sectionHeight,
  } = getSectionRect(sectionId);
  const { x, y, zoom } = getViewportForBounds(
    { x: sectionX, y: sectionY, width: sectionWidth, height: sectionHeight },
    rfStore.width,
    rfStore.height,
    0,
    1,
    0.1,
    true,
  );

  const duration = useSettings.getState().gui.transitionDuration;
  const nextTransform = zoomIdentity.translate(x, y).scale(zoom);
  rfStore.d3Zoom.transform(
    getD3Transition(rfStore.d3Selection, duration),
    nextTransform,
  );

  setActiveSectionIds([sectionId]);
  setZIndices([sectionId]);
}

export function autoLayout() {
  const margin = 50;
  const newNodes = getNewNodes();

  let sizes = [];
  newNodes.forEach((x) => {
    sizes.push({
      id: x.id,
      w: x.width + margin,
      h: x.height + margin,
    });
  });

  potpack(sizes); // mutates input
  sizes = _.keyBy(sizes, "id");

  let minX = Infinity;
  let minY = Infinity;
  newNodes.forEach((n) => {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
  });

  newNodes.forEach((node, key) => {
    node.position = {
      x: sizes[node.id].x + minX,
      y: sizes[node.id].y + minY,
    };
    newNodes.set(key, node);
  });

  useNodeInternals.setState({ x: newNodes });
}
