import { Badge } from "components/Utils/atoms/badges/badge";
import { NavbarMenuDropdown } from "components/Utils/atoms/menubar/menudropdown";
import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import _ from "lodash";
import { setWebsocketConnectedTo } from "state/actions/websocketConnectionList";
import { useWebsocketConnectionList } from "state/definitions";

export function WebsocketConnections() {
  return (
    <NavbarMenuDropdown trigger="CLI">
      <ConnectionList />
    </NavbarMenuDropdown>
  );
}

function ConnectionList() {
  const { connectedTo, connections } = useWebsocketConnectionList((x) => {
    return {
      connectedTo: x.connectedTo,
      connections: x.connections.filter((c) => c.isCLI),
    };
  }, _.isEqual);

  return connections.length > 0 ? (
    connections.map((x) => (
      <ConnectionItem info={x} key={x.websocketId} connectedTo={connectedTo} />
    ))
  ) : (
    <MenuItem>No CLI connections</MenuItem>
  );
}

function ConnectionItem({ info, connectedTo }) {
  const twClasses =
    connectedTo === info.websocketId
      ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
      : "bg-grey-100 dark:bg-grey-800 text-grey-800 dark:text-grey-100";

  return (
    <MenuItem onClick={() => setWebsocketConnectedTo(info.websocketId)}>
      <Badge twClasses={twClasses}>{"CLI"}</Badge>
      {info.websocketId}
    </MenuItem>
  );
}
