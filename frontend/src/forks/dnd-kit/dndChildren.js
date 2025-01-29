import { create, withProjectState, withResetFn } from "state/utils";
import { immer } from "zustand/middleware/immer";
import { getDndSectionId } from "./dndState";

export const useDndChildren = withProjectState(
  create(
    immer(
      withResetFn((set) => ({
        x: {}, // parent id to list of children
        y: {}, // child id to parent id
        addChild: ({ oldParentId, newParentId, childId, index }) =>
          set((state) => {
            if (oldParentId) {
              state.x[oldParentId] = state.x[oldParentId].filter(
                (x) => x !== childId,
              );
            }

            state.x[newParentId] = [
              ...state.x[newParentId].slice(0, index),
              childId,
              ...state.x[newParentId].slice(index),
            ];

            state.y[childId] = newParentId;
          }),
        removeChild: (childId) =>
          set((state) => {
            const oldParentId = state.y[childId];
            if (oldParentId) {
              state.x[oldParentId] = state.x[oldParentId].filter(
                (x) => x !== childId,
              );
              state.y[childId] = undefined;
            }
          }),
        replaceWithTemp: (id) =>
          set((state) => {
            const parentId = state.y[id];
            if (parentId) {
              const index = state.x[parentId].indexOf(id);
              const tempId = getDndSectionId(id);
              state.x[parentId][index] = tempId;
              state.y[tempId] = parentId;
              state.y[id] = undefined;
            }
          }),
        update: (sectionIdsToChildren) =>
          set((state) => {
            state.x = sectionIdsToChildren;
            state.y = {};
            for (const [id, children] of Object.entries(sectionIdsToChildren)) {
              for (const c of children) {
                state.y[c] = id;
              }
            }
          }),
      })),
    ),
  ),
);
