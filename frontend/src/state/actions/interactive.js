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
  const { throttledSendFns } = useInMemoryFn.getState();
  if (key in throttledSendFns) {
    throttledSendFns[key](key, value);
  } else if (null in throttledSendFns) {
    throttledSendFns[null](key, value);
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

export function updateInMemorySubprocessInfo(inMemorySubprocessInfo) {
  const newInfo = getNewInMemorySubprocessInfo(inMemorySubprocessInfo);
  const newThrottledSendFns = getNewThrottledSendFns(newInfo);

  for (const fn of Object.values(useInMemoryFn.getState().throttledSendFns)) {
    fn.cancel();
  }

  useInMemoryFn.setState({
    inMemorySubprocessInfo: newInfo,
    throttledSendFns: newThrottledSendFns,
  });

  console.log(useInMemoryFn.getState());
}

function getNewInMemorySubprocessInfo(inMemorySubprocessInfo) {
  const newInfo = _.cloneDeep(inMemorySubprocessInfo);

  // convert dependencies to Sets
  for (const subprocessInfo of Object.values(newInfo)) {
    for (const fnInfo of Object.values(subprocessInfo.fnInfo)) {
      const newDependencies = new Set();
      for (const d of fnInfo.dependencies) {
        const stringD = d === null ? d : JSON.stringify(d);
        newDependencies.add(stringD);
      }
      fnInfo.dependencies = newDependencies;
    }
  }

  return newInfo;
}

function getNewThrottledSendFns(inMemorySubprocessInfo) {
  const newThrottledSendFns = {};
  for (const subprocessInfo of Object.values(inMemorySubprocessInfo)) {
    for (const fnInfo of Object.values(subprocessInfo.fnInfo)) {
      for (const d of fnInfo.dependencies) {
        // key is usually the same as d, except when d is null.
        // So we have to pass key to the throttled function
        newThrottledSendFns[d] = _.throttle(
          (key, value) => {
            sendMessage({
              id: createNewId(),
              content: { [key]: value },
              messageType: "inMemoryFn",
            });
          },
          getThrottleDelay(inMemorySubprocessInfo, d),
        );
      }
    }
  }

  return newThrottledSendFns;
}

function getThrottleDelay(inMemorySubprocessInfo, key) {
  let maxRunTime = 0;

  for (const subprocessInfo of Object.values(inMemorySubprocessInfo)) {
    for (const fnInfo of Object.values(subprocessInfo.fnInfo)) {
      if (fnInfo.dependencies.has(key) || fnInfo.dependencies.has(null)) {
        if (fnInfo.averageRunTime > maxRunTime) {
          maxRunTime = fnInfo.averageRunTime;
        }
      }
    }
  }

  console.log("maxRunTime", maxRunTime);

  // maxRunTime is in seconds
  return Math.max(maxRunTime * 1000, 50); // Minimum 50ms throttle
}
