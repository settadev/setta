import * as Menubar from "@radix-ui/react-menubar";
import { useParams } from "react-router-dom";
import { EditMenu } from "./EditMenu";
import { FileMenu } from "./FileMenu";
import { RunButton } from "./RunButton";
import { StopButton } from "./StopButton";
import { WebsocketConnections } from "./WebsocketConnections";

export function ProjectNav() {
  return (
    <nav className="flex space-x-2">
      <ProjectNavSwitch />
    </nav>
  );
}

function ProjectNavSwitch() {
  const { projectConfigName } = useParams();

  return (
    projectConfigName && (
      <div className="ml-4 flex gap-1">
        <Menubar.Root className="contents">
          <FileMenu />
          <EditMenu />
          <WebsocketConnections />
        </Menubar.Root>
        <RunButton />
        <StopButton />
      </div>
    )
  );
}
