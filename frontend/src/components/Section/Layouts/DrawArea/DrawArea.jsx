import * as fabric from "fabric";
import { useEffect, useRef } from "react";

export function DrawArea({ sectionId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current);

    return () => {
      // `dispose` is async
      // however it runs a sync DOM cleanup
      // its async part ensures rendering has completed
      // and should not affect react
      canvas.dispose();
    };
  }, [canvasRef]);

  return (
    <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
      <div className="single-cell-child single-cell-container">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
