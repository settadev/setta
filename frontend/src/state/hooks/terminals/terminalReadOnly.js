import C from "constants/constants.json";
import { useEffect, useRef } from "react";
import { URLS } from "utils/constants";
import { Terminal } from "xterm";
import { AttachAddon } from "xterm-addon-attach";
import "xterm/css/xterm.css";
import {
  scrollSensitivityUpdater,
  terminalCleanup,
  terminalTheme,
  useFitAddon,
} from "./utils";

export function useTerminalReadOnly({ width, height, setHasScrollbar }) {
  const terminalRef = useRef(null); // Ref for the terminal container
  const fitAddon = useFitAddon();

  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: false,
      theme: terminalTheme,
      disableStdin: true,
    });
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    const ws = new WebSocket(
      `${URLS.WEBSOCKET}${C.ROUTE_IN_MEMORY_FN_STDOUT_WEBSOCKET}`,
    );

    const attachAddon = new AttachAddon(ws);
    terminal.loadAddon(attachAddon);

    const unsub = scrollSensitivityUpdater(terminal, setHasScrollbar);

    return () => {
      terminalCleanup(ws, terminal);
      unsub();
    };
  }, []);

  useEffect(() => {
    fitAddon.fit();
  }, [width, height]);

  return terminalRef;
}
