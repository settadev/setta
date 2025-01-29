import { base64ToImageObj } from "components/Section/Layouts/DrawArea/base64Conversion";
import _ from "lodash";
import { dbGetArtifactIdsFromNamePathType } from "requests/artifacts";
import { dbFormateCode } from "requests/interactive";
import { sendMessage } from "requests/websocket";
import {
  useArtifacts,
  useInMemoryFn,
  useSectionInfos,
} from "state/definitions";
import { createNewId } from "utils/idNameCreation";
import { getNamePathTypeKey } from "./artifacts";
import { getSectionVariant } from "./sectionInfos";

export async function formatCode() {
  const res = await dbFormateCode();
  if (res.status === 200) {
    useSectionInfos.setState((state) => {
      for (const [sectionId, code] of Object.entries(res.data)) {
        if (code !== null) {
          getSectionVariant(sectionId, state).code = code;
        }
      }
    });
  }
}

export function sendToInteractiveTasks(sourceInfo, value) {
  const key = JSON.stringify(sourceInfo);
  const content = { [key]: value };
  for (const [fnName, metadata] of Object.entries(
    useInMemoryFn.getState().metadata,
  )) {
    if (metadata.dependencies === null || metadata.dependencies.has(key)) {
      sendMessage({ id: createNewId(), content, messageType: fnName });
    }
  }
}

export async function maybeGetNewArtifactIds(content) {
  if (content.length === 0) {
    return;
  }

  const namePathTypeToId = useArtifacts.getState().namePathTypeToId;
  const missingIdx = [];
  const namesPathsTypes = [];
  for (const [idx, c] of content.entries()) {
    if (!("path" in c)) c.path = "";

    const match = namePathTypeToId[getNamePathTypeKey(c)];

    if (!match) {
      missingIdx.push(idx);
      namesPathsTypes.push(_.pick(c, ["name", "path", "type"]));
    } else {
      c.id = match;
    }
  }

  const res = await dbGetArtifactIdsFromNamePathType(namesPathsTypes);
  if (res.status == 200) {
    for (const [idx, artifactId] of res.data.entries()) {
      const originalIdx = missingIdx[idx];
      content[originalIdx].id = artifactId ?? createNewId();
    }
  }
}

export async function updateInteractiveArtifacts(artifacts) {
  if (artifacts.length === 0) {
    return;
  }
  const newArtifacts = {};
  const artifactState = useArtifacts.getState();
  for (const a of artifacts) {
    if (!("path" in a)) a.path = "";
    if (a.type === "img") {
      a.value = await base64ToImageObj(a.value);
    }

    newArtifacts[
      a.id ?? artifactState.namePathTypeToId[getNamePathTypeKey(a)]
    ] = a;
  }

  useArtifacts.setState((state) => {
    return { x: { ...state.x, ...newArtifacts } };
  });

  // if (addSection) {
  //   for (const [id, data] of Object.entries(artifacts)) {
  //     maybeAddArtifactSection(id, data.sectionType);
  //   }
  // }
}

// function maybeAddArtifactSection(artifactId, sectionType) {
//   for (const s of Object.values(useSectionInfos.getState().x)) {
//     if (s.artifactIds.includes(artifactId)) {
//       return;
//     }
//   }

//   addSectionInEmptySpace({
//     type: sectionType,
//     sectionProps: { artifactIds: [artifactId] },
//   });
// }
