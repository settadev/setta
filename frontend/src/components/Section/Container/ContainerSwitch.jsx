import { DndSlotAndDndWatcher } from "./ContainerWrappers";
import { TopLevelContainer } from "./TopLevelContainer";

export function ContainerSwitch({
  isGroup,
  sectionId,
  dragListeners,
  children,
  isTopLevel,
  visibility,
  viewingEditingMode,
}) {
  return isTopLevel ? (
    <TopLevelContainer
      isGroup={isGroup}
      sectionId={sectionId}
      visibility={visibility}
      viewingEditingMode={viewingEditingMode}
    >
      {children}
    </TopLevelContainer>
  ) : (
    <DndSlotAndDndWatcher
      isGroup={isGroup}
      sectionId={sectionId}
      isTopLevel={isTopLevel}
      dragListeners={dragListeners}
      visibility={visibility}
      viewingEditingMode={viewingEditingMode}
    >
      {children}
    </DndSlotAndDndWatcher>
  );
}
