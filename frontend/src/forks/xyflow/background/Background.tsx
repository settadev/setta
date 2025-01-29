import { memo, useRef } from "react";
import { useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { shallow } from "zustand/shallow";
import { useReactFlow } from "../core/store";
import { DotPattern, LinePattern } from "./Patterns";
import { BackgroundVariant } from "./types";

function Background() {
  const offset = 2;
  const [darkMode] = localStorageFns.darkMode.hook();
  const patternColor = useSettings((x) =>
    darkMode ? x.gui.gridColorDarkMode : x.gui.gridColor,
  );
  const patternSize = useSettings((x) => x.gui.gridPatternSize);
  const gapXY: [number, number] = useSettings((x) => x.gui.snapGrid);
  const variant = useSettings((x) => BackgroundVariant[x.gui.gridPattern]);
  const ref = useRef<SVGSVGElement>(null);

  const isDots = variant === BackgroundVariant.Dots;
  const isCross = variant === BackgroundVariant.Cross;

  return (
    <svg
      className="react-flow__background"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
      ref={ref}
      data-testid="rf__background"
    >
      <BackgroundCore
        offset={offset}
        gapXY={gapXY}
        patternColor={patternColor}
        patternSize={patternSize}
        isCross={isCross}
        isDots={isDots}
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`url(#ReactFlowBackground`}
      />
    </svg>
  );
}

Background.displayName = "Background";

export default memo(Background);

const BackgroundCore = memo(
  ({ offset, gapXY, patternColor, patternSize, isCross, isDots }) => {
    const transform = useReactFlow((x) => x.transform, shallow);
    const scaledGap: [number, number] = [
      gapXY[0] * transform[2] || 1,
      gapXY[1] * transform[2] || 1,
    ];
    const scaledSize = patternSize * transform[2];

    const patternDimensions: [number, number] = isCross
      ? [scaledSize, scaledSize]
      : scaledGap;

    const patternOffset = isDots
      ? [scaledSize / offset, scaledSize / offset]
      : [patternDimensions[0] / offset, patternDimensions[1] / offset];

    return (
      <pattern
        id="ReactFlowBackground"
        x={transform[0] % scaledGap[0]}
        y={transform[1] % scaledGap[1]}
        width={scaledGap[0]}
        height={scaledGap[1]}
        patternUnits="userSpaceOnUse"
        patternTransform={`translate(-${patternOffset[0]},-${patternOffset[1]})`}
      >
        {isDots ? (
          <DotPattern color={patternColor} radius={scaledSize / offset} />
        ) : (
          <LinePattern
            dimensions={patternDimensions}
            color={patternColor}
            lineWidth={patternSize * transform[2]}
          />
        )}
      </pattern>
    );
  },
);
