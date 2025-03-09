import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Item } from "components/Utils/atoms/dropdown/item";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import _ from "lodash";
import { closeAllContextMenus } from "state/actions/contextMenus";
import { addSectionAtPosition } from "state/actions/sections/createSections";
import { useCreateSectionsList } from "state/actions/sections/createSectionsHelper";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useContextMenus, useSectionInfos } from "state/definitions";
import { ContextMenuCore } from "./ContextMenuCore";

export function PaneContextMenu() {
  const { isOpen, x, y } = useContextMenus((x) => x.pane, _.isEqual);

  function onClick(specificProps) {
    useSectionInfos.setState((state) => {
      addSectionAtPosition({
        position: screenToFlowPosition({ x, y }),
        state,
        ...specificProps,
      });
    });
    maybeIncrementProjectStateVersion(true);
    closeAllContextMenus();
  }

  const contextMenuItems = useCreateSectionsList();

  return (
    <ContextMenuCore
      x={x}
      y={y}
      closeContextMenu={closeAllContextMenus}
      isOpen={isOpen}
    >
      {contextMenuItems.map((x) => (
        <DropdownGroup
          key={x.group}
          name={x.group}
          items={x.items}
          onClick={onClick}
        />
      ))}
    </ContextMenuCore>
  );
}

function DropdownGroup({ name, items = [], onClick }) {
  return (
    <DropdownMenu.Group>
      <DropdownMenu.Label className="mx-2 mb-1 mt-1.5 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
        {name}
      </DropdownMenu.Label>
      {items.map(
        (e) =>
          (e.doRender === undefined || e.doRender) && (
            <Item key={e.name} onClick={() => onClick(e.specificProps)}>
              {e.name}
            </Item>
          ),
      )}
    </DropdownMenu.Group>
  );
}
