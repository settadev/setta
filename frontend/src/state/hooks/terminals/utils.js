import { useRef } from "react";
import { useMisc } from "state/definitions";
import { FitAddon } from "xterm-addon-fit";

export const terminalTheme = {
  foreground: "#B8C2D5",
  // background: "#0D1016",
  background: "#06070A",
  cursor: "#B8C2D5",
  selection: "#49483e",
  black: "#272822",
  red: "#f92672",
  green: "#a6e22e",
  yellow: "#f4bf75",
  blue: "#66d9ef",
  magenta: "#ae81ff",
  cyan: "#a1efe4",
  white: "#f8f8f2",
  brightBlack: "#75715e",
  brightRed: "#f92672",
  brightGreen: "#a6e22e",
  brightYellow: "#f4bf75",
  brightBlue: "#66d9ef",
  brightMagenta: "#ae81ff",
  brightCyan: "#a1efe4",
  brightWhite: "#f9f8f5",
};

export function useFitAddon() {
  const fitAddon = useRef(null);

  if (!fitAddon.current) {
    fitAddon.current = new FitAddon();
  }

  return fitAddon.current;
}

export function scrollSensitivityUpdater(terminal, setHasScrollbar) {
  terminal.onRender(() => {
    setHasScrollbar(terminal.buffer.active.baseY > 0);
  });

  // Even though react flow calls preventDefault and stopPropagation when in pan scrolling mode,
  // xterm still picks up the scrolling. So this sets scrollSensitivity to a small number to disable scrolling when already moving via trackpad.
  const unsub = useMisc.subscribe(
    (x) => x.isPanScrolling,
    (isPanScrolling) => {
      if (isPanScrolling) {
        // can't make it 0
        terminal.options.scrollSensitivity = Number.MIN_VALUE;
      } else {
        terminal.options.scrollSensitivity = 1;
      }
    },
  );

  return unsub;
}

export function terminalCleanup(ws, terminal) {
  if (ws.readyState === 1) {
    ws.close();
    terminal.dispose();
  } else {
    ws.addEventListener("open", () => {
      ws.close();
      // Causes Uncaught TypeError: Cannot read properties of undefined (reading 'dimensions')
      // https://github.com/xtermjs/xterm.js/issues/4775
      terminal.dispose();
    });
  }
}
