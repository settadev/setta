import C from "constants/constants.json";
import { dbImportCodeBlocks } from "requests/interactive";
import {
  useActiveSection,
  useInMemoryFn,
  useSectionInfos,
} from "state/definitions";
import {
  maybeGetNewArtifactIds,
  updateInteractiveArtifacts,
} from "./interactive";
import { setNotificationMessage } from "./notification";
import {
  getProjectDataToGenerateCode,
  getProjectRuns,
  sendRunCodeMessage,
} from "./project/generateCode";
import { getSectionInfo, getSectionType } from "./sectionInfos";

export async function importCodeBlocks(sectionIds) {
  if (sectionIds.length === 0) {
    return;
  }

  setNotificationMessage("Importing your code...");
  const res = await dbImportCodeBlocks(sectionIds);
  if (res.status === 200) {
    for (const metadata of Object.values(res.data.metadata)) {
      if (metadata.dependencies !== null) {
        metadata.dependencies = new Set(
          metadata.dependencies.map((d) => JSON.stringify(d)),
        );
      }
    }
    useInMemoryFn.setState((state) => ({
      metadata: { ...state.metadata, ...res.data.metadata },
    }));
    await maybeGetNewArtifactIds(res.data.content);
    await updateInteractiveArtifacts(res.data.content);
    setNotificationMessage("Done importing");
  }
}

export async function runCodeBlocks(sectionIds) {
  if (sectionIds.length === 0) {
    return;
  }
  const project = getProjectDataToGenerateCode({
    includeInfoToFullName: false,
  });
  project.runCodeBlocks = sectionIds;
  await sendRunCodeMessage(project);
}

export async function runOrImportAllCode() {
  const { inMemory, asSubprocess } = getInMemoryAndAsSubprocessCodeBlocks();

  // The legnth === 0 condition is for when there are no code blocks.
  // In that case we still want to run the sections, and assume that
  // the imaginary code block just contains $SETTA_GENERATED_PYTHON
  if (
    asSubprocess.length > 0 ||
    (inMemory.length === 0 && asSubprocess.length === 0)
  ) {
    const project = getProjectDataToGenerateCode({
      includeInfoToFullName: false,
    });
    let count = 0;
    for (const projectVariant of getProjectRuns(project)) {
      await sendRunCodeMessage(projectVariant, count);
      count += 1;
    }
  }

  importCodeBlocks(inMemory);
}

export function runOrImportActiveCode() {
  const { inMemory, asSubprocess } = getInMemoryAndAsSubprocessCodeBlocks(true);
  importCodeBlocks(inMemory);
  runCodeBlocks(asSubprocess);
}

function getInMemoryAndAsSubprocessCodeBlocks(onlyActiveSections = false) {
  const inMemory = [];
  const asSubprocess = [];
  const ids = onlyActiveSections
    ? useActiveSection.getState().ids
    : Object.keys(useSectionInfos.getState().x);

  for (const id of ids) {
    if (getSectionType(id) !== C.CODE) {
      continue;
    }
    if (getSectionInfo(id).runInMemory) {
      inMemory.push(id);
    } else {
      asSubprocess.push(id);
    }
  }
  return { inMemory, asSubprocess };
}
