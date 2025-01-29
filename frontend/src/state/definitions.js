import C from "constants/constants.json";
import { dummyRegExpObject } from "utils/utils";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  create,
  withProjectState,
  withResetFn,
  withTemporal,
  withVersion,
} from "./utils";

export const useActiveSection = withProjectState(
  create(
    withTemporal(
      withResetFn(() =>
        withVersion({
          ids: [],
        }),
      ),
    ),
  ),
);

export const useContextMenus = withProjectState(
  create(
    withResetFn(() => ({
      pane: { isOpen: false, x: 0, y: 0 },
      group: { isOpen: false, x: 0, y: 0, sectionId: null },
      selection: { isOpen: false, x: 0, y: 0, nodeIds: [] },
    })),
  ),
);

export const useSectionInfos = withProjectState(
  create(
    subscribeWithSelector(
      withTemporal(
        immer(
          withResetFn(() =>
            withVersion({
              x: {},
              variants: {},
              uiTypeCols: {},
              uiTypes: {},
              codeInfoCols: {},
              codeInfo: {},
              artifactGroups: {},
              singletonSections: {
                [C.GLOBAL_VARIABLES]: null,
                [C.GLOBAL_PARAM_SWEEP]: null,
                inMemoryFnStdoutTerminal: null,
              },
              shouldRenameReferences: false,
            }),
          ),
        ),
      ),
    ),
  ),
);

export const useHomePageSearch = create(
  withResetFn(() => ({
    value: "",
  })),
);

export const useInMemoryFn = create(
  withResetFn(() => ({
    metadata: {},
  })),
);

export const useEVRefRegex = create(
  withResetFn(() => ({
    pattern: dummyRegExpObject(),
    codeAreaPattern: dummyRegExpObject(),
    fullNameToInfo: {},
  })),
);

export const useTemplateVarRegex = create(
  withResetFn(() => ({
    pattern: dummyRegExpObject(),
    fullNameToSectionId: {},
  })),
);

// keys for textFields are of the form:
// {sectionId}-null for the main section combobox
// {sectionId}-{paramInfoId} for section parameter fields
export const useWaitingForLSPResult = withProjectState(
  create(
    immer(
      withResetFn(() => ({
        textFields: {},
        parametersRequest: {},
      })),
    ),
  ),
);

export const useModal = withProjectState(
  create(
    withResetFn(() => ({
      open: false,
      modalType: null,
      modalData: null,
    })),
  ),
);

export const useNodeInternals = withProjectState(
  create(
    withTemporal(
      withResetFn(() =>
        withVersion({
          x: new Map(),
        }),
      ),
    ),
  ),
);

export const useNotification = create(
  withResetFn(() => ({
    message: "",
    timeoutId: null,
  })),
);

export const useAllProjectConfigs = create(
  withResetFn(() => ({
    x: {},
    names: [],
  })),
);

export const useArtifacts = withProjectState(
  create(
    subscribeWithSelector(
      withTemporal(
        withResetFn(() => withVersion({ x: {}, namePathTypeToId: {} })),
      ),
    ),
  ),
);

export const useProjectConfig = withProjectState(
  create(
    withTemporal(
      immer(
        withResetFn(() =>
          withVersion({
            id: "",
            name: "",
          }),
        ),
      ),
    ),
  ),
);

export const useProjectSearch = withProjectState(
  create(
    withResetFn(() => ({
      sections: [],
      codeInfo: [],
      focused: {},
      lookup: new Set(),
      mode: "find",
    })),
  ),
);

export const useSectionRefs = withProjectState(
  create(
    subscribeWithSelector(
      immer(
        withResetFn(() => ({
          withNested: {},
          selfOnly: {},
        })),
      ),
    ),
  ),
);

export const useSettings = create(() => ({}));

export const useStateVersion = withProjectState(
  create(withTemporal(withResetFn(() => withVersion({})))),
);

export const useTypeErrors = withProjectState(
  create(
    immer(
      withResetFn(() => ({
        userRequested: false,
        errors: {},
      })),
    ),
  ),
);

export const useWebsocketConnectionList = create(
  withResetFn(() => ({
    connectedTo: null,
    connections: [],
  })),
);

export const useTemporaryMiscState = withProjectState(
  create(subscribeWithSelector(withResetFn(() => ({})))),
);

export const useProjectLoading = create(
  withResetFn(() => ({ projectIsLoading: false, projectIs404: false })),
);

export const useMisc = withProjectState(
  create(
    subscribeWithSelector(
      withResetFn(() => ({
        lastMouseDownLocation: null,
        lastMouseUpLocation: null,
        mouseDownDrawArea: false,
        mouseDownDraggingSection: false,
        lastPaneClickLocation: { x: 0, y: 0 },
        undoOrRedoWasTriggered: false,
        isSelectingParams: false,
        numDisplayedCodeAreas: 0,
        numInitializedCodeAreas: 0,
        requestUpdateNodeDimensions: false,
        updateDrawAreas: 0, // increments every time we want to update
      })),
    ),
  ),
);

// maps from variantId to yaml
export const useYamlValue = withProjectState(create(withResetFn(() => {})));

// maps from variantId to yaml metadata
export const useOriginalYamlObj = withProjectState(
  create(withResetFn(() => {})),
);

export const useSectionColumnWidth = withProjectState(
  create(subscribeWithSelector(withResetFn(() => {}))),
);

export const useResizerStore = withProjectState(
  create(
    withResetFn(() => ({
      activeResizer: null, // { sectionId, ref, startX, startWidth, containerWidth, maxNestedDepth }
      globalEventListenersInitialized: false,
    })),
  ),
);
