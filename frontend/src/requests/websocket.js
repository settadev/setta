import C from "constants/constants.json";
import _ from "lodash";
import { updateInteractiveArtifacts } from "state/actions/interactive";
import { setNotificationMessage } from "state/actions/notification";
import { setTemporaryMiscState } from "state/actions/temporaryMiscState";
import { processTypeErrors } from "state/actions/typeErrors";
import { updateConnectedTo } from "state/actions/websocketConnectionList";
import { useWebsocketConnectionList } from "state/definitions";
import { URLS } from "utils/constants";

let wss;

export const openWebSocket = _.debounce(
  (pathname) => {
    if (!wssReady()) {
      wss = new WebSocket(`${URLS.WEBSOCKET}${C.ROUTE_WEBSOCKET_MANAGER}`);
      wss.addEventListener("open", () => {
        sendLocation(pathname);
      });

      wss.addEventListener("message", (event) => {
        receiveMessage(event.data);
      });

      wss.addEventListener("error", closeWebSocket);

      wss.addEventListener("close", () => {
        wss = null;
        // Attempt to reconnect
        setTimeout(() => {
          openWebSocket(pathname);
        }, 3000);
      });
    }
  },
  1000,
  { leading: true },
);

function closeWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }
}

function wssReady() {
  return wss && wss.readyState === 1;
}

function receiveMessage(message) {
  const m = JSON.parse(message);
  if (m.messageType === C.WS_ALL_CONNECTIONS) {
    updateConnectedTo(m);
  } else if (m.messageType === C.WS_LSP_DIAGNOSTICS) {
    processTypeErrors(m.content);
  } else if (m.messageType === C.WS_LSP_STATUS) {
    setNotificationMessage(`Language Server ${m.content.data}`);
  } else if (
    m.messageType === C.WS_ARTIFACT ||
    m.messageType === C.WS_IN_MEMORY_FN_RETURN
  ) {
    updateInteractiveArtifacts(m.content);
  } else if (m.id) {
    setTemporaryMiscState(m.id, m.content);
  }
}

export function sendLocation(pathname) {
  if (wssReady()) {
    wss.send(JSON.stringify({ location: pathname }));
  }
}

export async function sendMessage({ content, id, messageType }) {
  const connectedTo = useWebsocketConnectionList.getState().connectedTo;
  if (wssReady() && connectedTo) {
    wss.send(
      JSON.stringify({
        id,
        content,
        toWebsocketId: connectedTo,
        messageType,
      }),
    );
  }
}
