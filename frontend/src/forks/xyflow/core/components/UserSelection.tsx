import { useReactFlow } from "forks/xyflow/core/store";
import { shallow } from "zustand/shallow";
import type { ReactFlowState } from "../types";

const selector = (s: ReactFlowState) => ({
  userSelectionActive: s.userSelectionActive,
  userSelectionRect: s.userSelectionRect,
});

function UserSelection() {
  const { userSelectionActive, userSelectionRect } = useReactFlow(
    selector,
    shallow,
  );
  const isActive = userSelectionActive && userSelectionRect;

  if (!isActive) {
    return null;
  }

  return (
    <div
      className="react-flow__selection react-flow__container"
      style={{
        width: userSelectionRect.width,
        height: userSelectionRect.height,
        transform: `translate(${userSelectionRect.x}px, ${userSelectionRect.y}px)`,
      }}
    />
  );
}

export default UserSelection;
