import C from "constants/constants.json";
import _ from "lodash";
import { Resizable } from "re-resizable";
import React, { useEffect, useRef, useState } from "react";
import { HiCheck, HiOutlineDuplicate } from "react-icons/hi";
import { addSectionInEmptySpace } from "state/actions/sections/createSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos, useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { positiveMod, shortcutPrettified } from "utils/utils";
import { create } from "zustand";

export const useFloatingBox = create(() => ({
  isFrozen: false,
  isEnabled: false,
  contentArray: null,
  idx: 0,
  copied: false,
}));

let mouseMoved = false;
const TOOLTIP_DIV_ID = "setta-tooltip-floating-box";

export function FloatingBox() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isEnabled, contentArray, isFrozen, idx, copied } = useFloatingBox();
  const boxRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [tooltipWidth, setTooltipWidth] = localStorageFns.tooltipWidth.hook();

  // Store initial position when freezing
  useEffect(() => {
    if (isFrozen) {
      // Save current position when freezing
      const initialPos = { ...position };
      setPosition(initialPos);
    }
  }, [isFrozen]);

  // Handle mouse movement for both following cursor and dragging
  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseMoved = true;

      if (!isFrozen) {
        // Regular behavior: follow the mouse when not frozen
        setPosition({ x: event.clientX + 10, y: event.clientY + 10 });
      } else if (isDragging) {
        // Only update position when explicitly dragging in frozen mode
        setPosition({
          x: event.clientX - dragStartRef.current.x,
          y: event.clientY - dragStartRef.current.y,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFrozen, isDragging]);

  // Keep box within viewport bounds
  useEffect(() => {
    if (!boxRef.current || !isEnabled) return;

    const box = boxRef.current;
    const rect = box.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position if necessary
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 8;
    }

    // Adjust vertical position if necessary
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 8;
    }

    // Apply the adjusted position
    box.style.transform = `translate(${x}px, ${y}px)`;
  }, [isEnabled, position]);

  if (!isEnabled || !contentArray || contentArray.length === 0 || !mouseMoved)
    return null;

  // Create a custom drag handle when in frozen mode
  const dragHandleMouseDown = (event) => {
    if (!isFrozen) return;

    // Prevent default to avoid text selection during drag
    event.preventDefault();

    setIsDragging(true);
    const rect = boxRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      id={TOOLTIP_DIV_ID}
      className="absolute left-0 top-0 z-20"
      ref={boxRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${tooltipWidth}px`,
      }}
      onMouseUp={handleMouseUp}
    >
      <MaybeResizable
        isFrozen={isFrozen}
        className={`flex max-h-96 min-h-32 min-w-64 flex-col rounded-2xl border border-setta-200 bg-white p-4 shadow-lg focus:outline focus:outline-2 focus:outline-blue-600 dark:border-setta-700 dark:bg-setta-950 ${contentArray[idx].wrapperClassName}`}
        tabIndex="0"
        tooltipWidth={tooltipWidth}
        onResizeStop={(e, direction, ref, d) => {
          setTooltipWidth(tooltipWidth + d.width);
        }}
        width={tooltipWidth}
      >
        {/* Add a drag handle when in frozen mode */}
        {isFrozen && (
          <div
            className="absolute left-0 right-0 top-0 h-8 cursor-move rounded-t-2xl bg-transparent"
            onMouseDown={dragHandleMouseDown}
            style={{
              zIndex: 10, // Above other content but below copy button
              marginTop: "4px", // Match the p-4 padding
              marginLeft: "4px",
              marginRight: "4px",
              // Visualize the drag area subtly when debugging
              // backgroundColor: 'rgba(0,0,255,0.1)'
            }}
          />
        )}
        <TooltipCopyButton item={contentArray[idx]} copied={copied} />
        <TooltipPage item={contentArray[idx]} isFrozen={isFrozen} />
        <TooltipPageCountIndicator numPages={contentArray.length} idx={idx} />
      </MaybeResizable>
    </div>
  );
}

function MaybeResizable({
  isFrozen,
  className,
  tabIndex,
  children,
  onResizeStop,
  width,
}) {
  return isFrozen ? (
    <Resizable
      width={width}
      className={className}
      tabIndex={tabIndex}
      onResizeStop={onResizeStop}
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false,
      }}
    >
      {children}
    </Resizable>
  ) : (
    <div className={className} tabIndex={tabIndex}>
      {children}
    </div>
  );
}

const TooltipPage = React.memo(({ item, isFrozen }) => {
  return (
    <>
      {item.title && (
        <h3
          className={`break-words pb-1 pr-4 text-xs font-black uppercase text-setta-500 dark:text-setta-600 ${item.titleClassName}`}
        >
          {item.title}
        </h3>
      )}
      <article
        className={`flex-1 overflow-y-auto whitespace-pre-line break-words pr-4 text-sm text-setta-700 dark:text-setta-300 ${item.contentClassName}`}
      >
        {item.content}
      </article>
      {Boolean(item.content) && <FooterSwitch isFrozen={isFrozen} />}
    </>
  );
}, _.isEqual);

const TooltipCopyButton = React.memo(({ item, copied }) => {
  const handleCopy = async () => {
    try {
      const content = item.content ?? item.title;
      await navigator.clipboard.writeText(content);
      setTimeout(() => {
        useFloatingBox.setState({ copied: false });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  function onClick() {
    useFloatingBox.setState({ copied: true });
  }

  useEffect(() => {
    if (copied) {
      handleCopy();
    }
  }, [copied]);

  return (
    <button
      onClick={onClick}
      className="tooltip-copy absolute right-2 top-2 cursor-pointer rounded-lg p-1.5 text-setta-500 hover:bg-setta-100 dark:text-setta-400 dark:hover:bg-setta-800"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <HiCheck className="h-4 w-4" />
      ) : (
        <HiOutlineDuplicate className="h-4 w-4" />
      )}
    </button>
  );
}, _.isEqual);

const TooltipPageCountIndicator = React.memo(({ numPages, idx }) => {
  return numPages > 1 ? (
    <div className="tooltip-page mt-4 flex items-center justify-center gap-2">
      {Array.from({ length: numPages }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i === idx ? "bg-blue-500" : "bg-setta-300 dark:bg-setta-600"
          }`}
          aria-label={`Page ${i + 1} of ${numPages}${i === idx ? " (current)" : ""}`}
        />
      ))}
    </div>
  ) : null;
});

function FooterSwitch({ isFrozen }) {
  const className =
    "tooltip-footer mt-4 border-t border-solid border-setta-100 pt-1 text-[10px] text-setta-500 dark:border-setta-700 dark:text-setta-600";

  return isFrozen ? (
    <FrozenFooter className={className} />
  ) : (
    <Footer className={className} />
  );
}

function FrozenFooter({ className }) {
  const shortcuts = useSettings((x) => {
    return {
      frozenTooltipToPlaintextShortcut: shortcutPrettified(
        x.shortcuts.frozenTooltipToPlaintextShortcut,
      ),
      frozenTooltipToMarkdownShortcut: shortcutPrettified(
        x.shortcuts.frozenTooltipToMarkdownShortcut,
      ),
    };
  }, _.isEqual);

  return (
    <p className={className}>
      press <span className="font-black">&quot;Esc&quot;</span> to close, or{" "}
      <span className="font-black">
        &quot;{shortcuts.frozenTooltipToPlaintextShortcut}&quot;
      </span>{" "}
      (plaintext) or{" "}
      <span className="font-black">
        &quot;{shortcuts.frozenTooltipToMarkdownShortcut}&quot;
      </span>{" "}
      (markdown) to open tooltip as new section
    </p>
  );
}

function Footer({ className }) {
  const shortcuts = useSettings((x) => {
    return {
      tooltipToPlaintextShortcut: shortcutPrettified(
        x.shortcuts.tooltipToPlaintextShortcut,
      ),
      tooltipToMarkdownShortcut: shortcutPrettified(
        x.shortcuts.tooltipToMarkdownShortcut,
      ),
      freezeTooltipShortcut: shortcutPrettified(
        x.shortcuts.freezeTooltipShortcut,
      ),
    };
  }, _.isEqual);

  return (
    <ul className={className}>
      <li>
        <strong className="font-black tracking-tighter">
          &quot;{shortcuts.tooltipToPlaintextShortcut}&quot;
        </strong>{" "}
        convert to plaintext section
      </li>
      <li>
        <strong className="font-black tracking-tighter">
          &quot;{shortcuts.tooltipToMarkdownShortcut}&quot;
        </strong>{" "}
        convert to markdown section
      </li>
      <li>
        <strong className="font-black tracking-tighter">
          &quot;{shortcuts.freezeTooltipShortcut}&quot;
        </strong>{" "}
        freeze tooltip
      </li>
    </ul>
  );
}

export function getFloatingBoxHandlers(...contentArray) {
  function onMouseEnter() {
    if (contentArray && !useFloatingBox.getState().isFrozen) {
      useFloatingBox.setState({ contentArray });
    }
  }

  function onMouseLeave() {
    if (!useFloatingBox.getState().isFrozen) {
      useFloatingBox.setState({ contentArray: null, idx: 0, copied: false });
    }
  }

  return { onMouseEnter, onMouseLeave };
}

export function enableFloatingBox() {
  useFloatingBox.setState({ isEnabled: true });
}

export function disableFloatingBox() {
  useFloatingBox.setState({ isEnabled: false, idx: 0 });
}

export function getConvertFloatingBoxToSectionFn(renderMarkdown) {
  return async () => {
    const s = useFloatingBox.getState();
    if (s.contentArray) {
      const item = s.contentArray[s.idx];
      const content = item.title
        ? `## ${item.title}\n\n${item.content}`
        : item.content;
      useSectionInfos.setState((state) => {
        addSectionInEmptySpace({
          type: C.TEXT_BLOCK,
          sectionProps: {
            name: s.title,
            size: { width: 300, height: 300 },
            renderMarkdown,
          },
          sectionVariantProps: { description: content },
          state,
        });
      });
      maybeIncrementProjectStateVersion(true);
    }
    // if converting a frozen floating box, then we need to remove it
    removeFrozenFloatingBox();
  };
}

export function freezeFloatingBox() {
  useFloatingBox.setState({ isEnabled: true, isFrozen: true });
  document.getElementById(TOOLTIP_DIV_ID)?.focus({ preventScroll: true });
}

export function removeFrozenFloatingBox() {
  useFloatingBox.setState({ isEnabled: false, isFrozen: false });
}

export function incrementFloatingBoxIdx() {
  if (!useFloatingBox.getState().contentArray) {
    return;
  }
  useFloatingBox.setState((state) => ({
    idx: positiveMod(state.idx + 1, state.contentArray.length),
  }));
}

export function decrementFloatingBoxIdx() {
  if (!useFloatingBox.getState().contentArray) {
    return;
  }
  useFloatingBox.setState((state) => ({
    idx: positiveMod(state.idx - 1, state.contentArray.length),
  }));
}

export async function copyFloatingBoxContent() {
  if (!useFloatingBox.getState().contentArray) {
    return;
  }
  useFloatingBox.setState({ copied: true });
}

export function incrementFrozenFloatingBoxIdx() {
  if (tooltipOrChildrenFocused()) {
    incrementFloatingBoxIdx();
  }
}

export function decrementFrozenFloatingBoxIdx() {
  if (tooltipOrChildrenFocused()) {
    decrementFloatingBoxIdx();
  }
}

export function copyFrozenFloatingBoxContent() {
  if (tooltipOrChildrenFocused()) {
    copyFloatingBoxContent();
  }
}

function tooltipOrChildrenFocused() {
  if (
    useFloatingBox.getState().isEnabled &&
    useFloatingBox.getState().isFrozen
  ) {
    const tooltipDiv = document.getElementById(TOOLTIP_DIV_ID);
    return tooltipDiv?.contains(document.activeElement);
  }
  return false;
}
