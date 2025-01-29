import { getNodes, updateNodePositions } from "state/actions/nodeInternals";
import { useActiveSection, useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { useReactFlow } from "../store";

export const updatePositions = (params: {
  x: number;
  y: number;
  isShiftPressed: boolean;
}) => {
  const { nodesSelectionDims, nodesDraggable, shiftNodesSelection } =
    useReactFlow.getState();
  const { snapGrid } = useSettings.getState().gui;
  const [snapToGrid] = localStorageFns.snapToGrid.state();
  const activeSectionIds = useActiveSection.getState().ids;
  const selectedNodes = getNodes().filter(
    (n) =>
      activeSectionIds.includes(n.id) &&
      (n.draggable || (nodesDraggable && typeof n.draggable === "undefined")),
  );
  // by default a node moves 5px on each key press, or 20px if shift is pressed
  // if snap grid is enabled, we use that for the velocity.
  const xVelo = snapToGrid ? snapGrid[0] : 5;
  const yVelo = snapToGrid ? snapGrid[1] : 5;
  const factor = params.isShiftPressed ? 4 : 1;

  const positionDiffX = params.x * xVelo * factor;
  const positionDiffY = params.y * yVelo * factor;

  const nodeUpdates = selectedNodes.map((n) => {
    if (n.position) {
      const nextPosition = {
        x: n.position.x + positionDiffX,
        y: n.position.y + positionDiffY,
      };

      if (snapToGrid) {
        nextPosition.x = snapGrid[0] * Math.round(nextPosition.x / snapGrid[0]);
        nextPosition.y = snapGrid[1] * Math.round(nextPosition.y / snapGrid[1]);
      }

      n.position = nextPosition;
    }

    return n;
  });

  updateNodePositions(nodeUpdates);
  if (nodesSelectionDims) {
    shiftNodesSelection({ x: positionDiffX, y: positionDiffY });
  }
};
