import C from "constants/constants.json";
import { JustListOfArtifacts } from "./ListOfArtifacts";

export function ImageAreaSettings({ sectionId }) {
  return (
    <JustListOfArtifacts sectionId={sectionId} sectionTypeName={C.IMAGE} />
  );
}
