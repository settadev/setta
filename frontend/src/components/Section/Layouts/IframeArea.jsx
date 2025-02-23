import React, { useEffect, useRef } from "react";
import { getDisplayedSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";

function _IframeArea({ sectionId }) {
  const code = useSectionInfos(
    (x) => getDisplayedSectionVariant(sectionId, x).code,
  );
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // If there's an iframe in the sanitized content, update its dimensions
        const iframeElement = containerRef.current.querySelector("iframe");
        if (iframeElement) {
          iframeElement.style.width = `${width}px`;
          iframeElement.style.height = `${height}px`;
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [code]);

  return !code || validateIframeCode(code) ? null : (
    <div
      className="section-main mb-2 mt-1.5 overflow-clip rounded-md"
      ref={containerRef}
    >
      <div dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  );
}

export const IframeArea = React.memo(_IframeArea);

// Basic security check for iframe code
const validateIframeCode = (code) => {
  // Check if it contains an iframe tag
  if (!code.toLowerCase().includes("<iframe")) {
    return "Input must contain an iframe tag";
  }

  // Check for potentially dangerous attributes
  const dangerousAttrs = [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "javascript:",
  ];
  if (dangerousAttrs.some((attr) => code.toLowerCase().includes(attr))) {
    return "Script events are not allowed in iframe code";
  }

  return "";
};
