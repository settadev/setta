import _ from "lodash";
import { useMisc, useSettings, useStateVersion } from "state/definitions";
import { stateDict, STATE_TYPES } from "state/utils";
import { saveProject } from "./project/saveProject";

export const undoProjectState = _.throttle(() => {
  const pastStates = useStateVersion.temporal.getState().pastStates;
  if (pastStates.length <= 1) {
    return;
  }

  const version = useStateVersion.getState().version;
  for (const s of stateDict[STATE_TYPES.PROJECT_STATE]) {
    if (s.temporal && version === s.getState().version) {
      s.temporal.getState().undo(2);
      undoSetPastAndFutureStates(s);
    }
  }
  autoSave();
  useMisc.setState({ undoOrRedoWasTriggered: true });
}, 100);

function undoSetPastAndFutureStates(s) {
  s.temporal.setState((state) => ({
    pastStates: [...state.pastStates, s.getState()],
    futureStates: filterPastOrFutureStates(state.futureStates),
  }));
}

function filterPastOrFutureStates(states) {
  const output = [];
  const versions = new Set();
  for (const f of states) {
    if (!versions.has(f.version)) {
      output.push(f);
      versions.add(f.version);
    }
  }
  return output;
}

export const redoProjectState = _.throttle(() => {
  const version = useStateVersion.getState().version;
  for (const s of stateDict[STATE_TYPES.PROJECT_STATE]) {
    if (s.temporal && version === s.getState().version) {
      s.temporal.getState().redo();
      redoSetPastAndFutureStates(s);
    }
  }
  autoSave();
  useMisc.setState({ undoOrRedoWasTriggered: true });
}, 100);

function redoSetPastAndFutureStates(s) {
  s.temporal.setState((state) => ({
    pastStates: filterPastOrFutureStates([...state.pastStates, s.getState()]),
  }));
}

function incrementStateVersion(states) {
  let stateActuallyChanged = false;
  for (const s of states) {
    if (
      s.temporal &&
      !_.isEqual(s.getState(), s.temporal.getState().pastStates.at(-1))
    ) {
      stateActuallyChanged = true;
      break;
    }
  }

  if (!stateActuallyChanged) {
    return;
  }

  const version = useStateVersion.getState().version;
  for (const s of states) {
    if (s.temporal) {
      s.setState({ version: version + 1 });
      resumeThenPauseTemporal(s, () => s.setState({})); //trigger a zundo update without actually changing state
    }
  }
}

function resumeThenPauseTemporal(statePointer, callback) {
  statePointer.temporal.getState().resume();
  callback();
  statePointer.temporal.getState().pause();
}

export const maybeIncrementProjectStateVersion = _.throttle(
  (doIncrementVersion, doAutoSave = true) => {
    if (doIncrementVersion) {
      incrementStateVersion(stateDict[STATE_TYPES.PROJECT_STATE]);
      if (doAutoSave) {
        autoSave();
      }
    }
  },
  500,
);

const autoSave = _.debounce(() => {
  if (useSettings.getState().backend.autosave) {
    saveProject();
  }
}, 1000);
