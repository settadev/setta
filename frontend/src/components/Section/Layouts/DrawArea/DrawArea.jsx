import * as fabric from "fabric";
import _ from "lodash";
import { useEffect, useRef } from "react";
import { useSectionInfos } from "state/definitions";
import { setCanvasSize } from "./canvasUtils";

export function DrawArea({ sectionId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const size = useSectionInfos((state) => state.x[sectionId].size, _.isEqual);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {});

    return () => {
      // `dispose` is async
      // however it runs a sync DOM cleanup
      // its async part ensures rendering has completed
      // and should not affect react
      fabricCanvas.current.dispose();
    };
  }, [canvasRef]);

  useEffect(() => {
    if (!fabricCanvas.current) {
      return;
    }
    useSectionInfos.setState((state) =>
      setCanvasSize({
        sectionId,
        canvas: fabricCanvas.current,
        height: size.height,
        width: size.width,
        state,
      }),
    );
  }, [size.height, size.width]);

  return (
    <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
      <div className="single-cell-child single-cell-container">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
