import _ from "lodash";
import { manualDndChildrenReset } from "state/actions/sectionInfos";
import { create, withProjectState, withResetFn } from "state/utils";
import { immer } from "zustand/middleware/immer";

const initialState = {
  activeId: null,
  activeIsTopLevel: false,
  overId: null,
  triggerDistCondition: false,
  isSorting: false,
  isMovingFree: false,
  disabled: {},
  width: null,
  height: null,
  times: {},
};

export const useDndState = withProjectState(
  create(
    immer(
      withResetFn((set, get) => ({
        ...initialState,
        setActive: ({ id, isTopLevel, width, height }) =>
          set({ activeId: id, activeIsTopLevel: isTopLevel, width, height }),
        activateSortingMode: () =>
          set({ isSorting: true, isMovingFree: false }),
        activateMovingFreeMode: () => {
          set({ isMovingFree: true, isSorting: false });
        },
        deactivate: () => {
          set({ ...initialState, disabled: get().disabled });
          manualDndChildrenReset();
        },
        setDisabled: (sectionId, disabled) =>
          set((state) => {
            state.disabled[sectionId] = disabled;
          }),
        setTime: (sectionId) =>
          set((state) => {
            state.times[sectionId] = Date.now();
          }),
      })),
    ),
  ),
);

const dndIdSuffix = "-TempDND";

export function getDndSectionId(sectionId) {
  return `${sectionId}${dndIdSuffix}`;
}

export function isTempSection(sectionId) {
  return sectionId.slice(-dndIdSuffix.length) === dndIdSuffix;
}

export function useDndMode() {
  return useDndState(
    (x) => ({
      isSorting: x.isSorting,
      isMovingFree: x.isMovingFree,
    }),
    _.isEqual,
  );
}
