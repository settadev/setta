import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Item } from "components/Utils/atoms/dropdown/item";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import _ from "lodash";
import { closeAllContextMenus } from "state/actions/contextMenus";
import { addSectionAtPosition } from "state/actions/sections/createSections";
import { getCreateSectionsList } from "state/actions/sections/createSectionsHelper";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useContextMenus, useSectionInfos } from "state/definitions";
import { ContextMenuCore } from "./ContextMenuCore";

export function PaneContextMenu() {
  const { isOpen, x, y } = useContextMenus((x) => x.pane, _.isEqual);
  const singletonSections = useSectionInfos(
    (x) => x.singletonSections,
    _.isEqual,
  );

  function getOnClickFn(specificProps) {
    return () => {
      useSectionInfos.setState((state) => {
        addSectionAtPosition({
          position: screenToFlowPosition({ x, y }),
          state,
          ...specificProps,
        });
      });
      maybeIncrementProjectStateVersion(true);
      closeAllContextMenus();
    };
  }

  const contextMenuItems = getCreateSectionsList(getOnClickFn);

  const itemStyle =
    "flex cursor-pointer flex-row items-center gap-2 rounded-md px-2 py-[0.15rem] font-sans text-xs font-semibold text-setta-700 outline-none hover:bg-setta-100 hover:ring-0 focus-visible:ring-1 dark:text-setta-100 dark:hover:bg-setta-700 data-[disabled]:pointer-events-none group-data-[disabled]:text-setta-300 group-data-[disabled]:dark:text-setta-700";

  const contentStyle =
    "absolute z-10 flex max-h-[80vh] w-[clamp(5rem,_20vw,_10rem)] min-w-32 cursor-pointer flex-col overflow-y-auto rounded-md border border-solid border-setta-500/50 bg-white px-2 py-2 shadow-xl dark:bg-setta-900";

  return (
    <ContextMenuCore
      x={x}
      y={y}
      closeContextMenu={closeAllContextMenus}
      isOpen={isOpen}
    >
      {contextMenuItems.map((x) => (
        <DropdownGroup key={x.group} name={x.group} items={x.items} />
      ))}
    </ContextMenuCore>
  );
}

function DropdownGroup({ name, items = [], children }) {
  return (
    <DropdownMenu.Group>
      <DropdownMenu.Label className="mx-2 mb-1 mt-1.5 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
        {name}
      </DropdownMenu.Label>
      {items.map((e) => (
        <Item key={e.name} onClick={e.fn}>
          {e.name}
        </Item>
      ))}
    </DropdownMenu.Group>
  );
}
