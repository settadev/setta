import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { NAVBAR_HEIGHT } from "utils/constants";

export function ContextMenuCore({ children, x, y, isOpen, closeContextMenu }) {
  const ref = useOutsideAlerter(isOpen, closeContextMenu);
  const [position, setPosition] = useState({
    top: -9999,
    left: -9999,
    opacity: 0,
  });
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: -9999, left: -9999, opacity: 0 });
      return;
    }

    // Use requestAnimationFrame to wait for the next render cycle
    requestAnimationFrame(() => {
      if (contentRef.current) {
        const menuRect = contentRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let newTop = y;
        let newLeft = x;

        // Check if menu would overflow bottom of viewport
        if (y + menuRect.height > viewportHeight) {
          newTop = y - menuRect.height;
        }

        // Check if menu would overflow right of viewport
        if (x + menuRect.width > viewportWidth) {
          newLeft = x - menuRect.width;
        }

        // Ensure menu doesn't go above navbar
        if (newTop < NAVBAR_HEIGHT) {
          // If opening downward would fit, open downward
          if (y + menuRect.height <= viewportHeight) {
            newTop = y;
          } else {
            // Otherwise, position just below navbar
            newTop = NAVBAR_HEIGHT;
          }
        }

        // Ensure menu doesn't go beyond left of viewport
        if (newLeft < 0) {
          newLeft = 0;
        }

        // Set final position with opacity
        setPosition({ top: newTop, left: newLeft, opacity: 1 });
      }
    });
  }, [x, y, isOpen]);

  return (
    <DropdownMenu.Root open={isOpen} modal={false}>
      <DropdownMenu.Content
        className="absolute z-10 flex max-h-[80vh] w-[clamp(5rem,_20vw,_10rem)] min-w-32 cursor-pointer flex-col overflow-y-auto rounded-md border border-solid border-setta-500/50 bg-white px-2 py-2 shadow-xl dark:bg-setta-900"
        style={{
          left: position.left,
          top: position.top,
          opacity: position.opacity,
        }}
        ref={(element) => {
          // Combine refs
          ref.current = element;
          contentRef.current = element;
        }}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

// https://stackoverflow.com/a/42234988
function useOutsideAlerter(isOpen, closeContextMenu) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target) && isOpen) {
        closeContextMenu();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, isOpen]);
  return ref;
}
