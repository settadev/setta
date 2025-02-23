import C from "constants/constants.json";
import { JustListOfArtifacts } from "./ListOfArtifacts";

export function ChatAreaSettings({ sectionId }) {
  return <JustListOfArtifacts sectionId={sectionId} sectionTypeName={C.CHAT} />;
}
