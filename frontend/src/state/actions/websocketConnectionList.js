import { useWebsocketConnectionList } from "state/definitions";

export function updateConnectedTo(message) {
  const { connections } = message;
  const cliConnections = connections.filter((x) => x.isCLI);
  if (
    !cliConnections
      .map((x) => x.websocketId)
      .includes(useWebsocketConnectionList.getState().connectedTo)
  ) {
    if (cliConnections.length > 0) {
      setWebsocketConnectedTo(cliConnections[0].websocketId);
    } else {
      setWebsocketConnectedTo(null);
    }
  }
  setWebsocketConnections(connections);
}

export function setWebsocketConnectedTo(connectedTo) {
  useWebsocketConnectionList.setState({ connectedTo });
}

function setWebsocketConnections(connections) {
  useWebsocketConnectionList.setState({ connections });
}
