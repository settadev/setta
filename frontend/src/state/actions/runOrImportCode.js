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

export async function importCodeBlocks(sectionIds, withSweep = false) {
  setNotificationMessage("Importing your code...");
  const project = await getProjectDataToGenerateCode({ includeDrawings: true });
  let projects = [];
  if (withSweep) {
    projects.push(...getProjectRuns(project));
  } else {
    project.runCodeBlocks = sectionIds;
    projects.push(project);
  }
  const res = await dbImportCodeBlocks(projects);
  console.log("res", res);
  if (res.status === 200) {
    useInMemoryFn.setState({
      dependencies: new Set(
        res.data.dependencies.map((d) => (d === null ? d : JSON.stringify(d))),
      ),
    });
    await maybeGetNewArtifactIds(res.data.content);
    await updateInteractiveArtifacts(res.data.content);
    setNotificationMessage("Done importing");
  }
}

export async function runCodeBlocks(sectionIds, withSweep = false) {
  const project = await getProjectDataToGenerateCode({});
  if (withSweep) {
    let count = 0;
    for (const projectVariant of getProjectRuns(project)) {
      await sendRunCodeMessage(projectVariant, count);
      count += 1;
    }
  } else {
    project.runCodeBlocks = sectionIds;
    await sendRunCodeMessage(project);
  }
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
    runCodeBlocks(asSubprocess, true);
  }

  if (inMemory.length > 0) {
    importCodeBlocks(inMemory, true);
  }
}

export function runOrImportActiveCode() {
  const { inMemory, asSubprocess } = getInMemoryAndAsSubprocessCodeBlocks(true);
  if (inMemory.length > 0) {
    importCodeBlocks(inMemory);
  }
  if (asSubprocess.length > 0) {
    runCodeBlocks(asSubprocess);
  }
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
