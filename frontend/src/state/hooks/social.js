import C from "constants/constants.json";
import { getSectionType } from "state/actions/sectionInfos";

export function getIsTwitterSection(sectionId, state) {
  return (
    getSectionType(sectionId) === C.SOCIAL &&
    linkIsTwitter(state.x[sectionId].social)
  );
}

export function getIsYouTubeSection(sectionId, state) {
  return (
    getSectionType(sectionId) === C.SOCIAL &&
    linkIsYouTube(state.x[sectionId].social)
  );
}

export function linkIsYouTube(x) {
  return x && (x.includes("youtube") || x.includes("youtu.be"));
}

export function linkIsTwitter(x) {
  return x && (x.includes("twitter") || x.includes("x.com"));
}
