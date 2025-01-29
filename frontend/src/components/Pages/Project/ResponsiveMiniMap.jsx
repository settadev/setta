import { setCenter } from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import { MiniMap } from "forks/xyflow/minimap";
import "forks/xyflow/minimap/style.css";
import { localStorageFns } from "state/hooks/localStorage";

export function ResponsiveMiniMap() {
  const [uiEditorWidth] = localStorageFns.uiEditorTrueWidth.hook();
  const [darkMode] = localStorageFns.darkMode.hook();

  return (
    <MiniMap
      nodeStrokeColor={(n) => {
        if (n.style?.background) return n.style.background;
        if (n.type === "input") return "#0041d0";
        if (n.type === "output") return "#ff0072";
        if (n.type === "default") return "#1a192b";

        return "#e2e8f0";
      }}
      nodeColor={(n) => {
        if (n.style?.background) return n.style.background;

        if (darkMode) {
          return "#2D384D";
        }
        return "#e2e8f0";
      }}
      nodeBorderRadius={5}
      style={{ transform: `translateX(-${uiEditorWidth}px)` }}
      className="overflow-hidden rounded-md border border-solid border-[#ffffff00] shadow-md backdrop-blur-sm transition-transform"
      maskColor={darkMode ? "rgb(20, 22, 31, 0.5)" : "rgb(51, 65, 85, 0.3)"}
      maskStrokeColor=""
      maskStrokeWidth="1"
      pannable
      onClick={(e, { x, y }) => {
        setCenter(x, y, { zoom: useReactFlow.getState().transform[2] });
      }}
    />
  );
}
