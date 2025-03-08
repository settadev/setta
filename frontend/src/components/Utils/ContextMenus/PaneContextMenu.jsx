import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Item } from "components/Utils/atoms/dropdown/item";
import C from "constants/constants.json";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import _ from "lodash";
import { closeAllContextMenus } from "state/actions/contextMenus";
import { addSectionAtPosition } from "state/actions/sections/createSections";
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
      <DropdownMenu.Group>
        <DropdownMenu.Label className="mx-2 mb-1 min-w-[100px] border-b border-setta-100 pb-1 pt-0.5 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
          Section
        </DropdownMenu.Label>
        <Item onClick={getOnClickFn({ type: C.SECTION })}>Section</Item>
        <Item onClick={getOnClickFn({ type: C.LIST_ROOT })}>List</Item>
        <Item onClick={getOnClickFn({ type: C.DICT_ROOT })}>Dict</Item>
        <Item onClick={getOnClickFn({ type: C.GROUP })}>Group</Item>
        <Item onClick={getOnClickFn({ type: C.TEXT_BLOCK })}>Text</Item>
        {!singletonSections[C.GLOBAL_VARIABLES] && (
          <Item onClick={getOnClickFn({ type: C.GLOBAL_VARIABLES })}>
            Global Variables
          </Item>
        )}
        {!singletonSections[C.GLOBAL_PARAM_SWEEP] && (
          <Item onClick={getOnClickFn({ type: C.GLOBAL_PARAM_SWEEP })}>
            Global Param Sweep
          </Item>
        )}

        {/* <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger className={itemStyle}>
            Global
            <FiChevronRight className="ml-auto" size={10} />
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent className={contentStyle}>
              {!singletonSections[C.GLOBAL_VARIABLES] && (
                <Item
                  disabled={singletonSections[C.GLOBAL_VARIABLES] && true}
                  onClick={getOnClickFn({ type: C.GLOBAL_VARIABLES })}
                >
                  Global Variables
                </Item>
              )}
              {!singletonSections[C.GLOBAL_PARAM_SWEEP] && (
                <Item
                  disabled={singletonSections[C.GLOBAL_PARAM_SWEEP] && true}
                  onClick={getOnClickFn({ type: C.GLOBAL_PARAM_SWEEP })}
                >
                  Global Param Sweep
                </Item>
              )}
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub> */}
      </DropdownMenu.Group>
      <DropdownMenu.Group>
        <DropdownMenu.Label className="mx-2 mb-1 mt-1.5 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
          Code
        </DropdownMenu.Label>
        <Item
          onClick={getOnClickFn({
            type: C.CODE,
            sectionProps: { codeLanguage: "python" },
          })}
        >
          Python Code
        </Item>
        <Item
          onClick={getOnClickFn({
            type: C.CODE,
            sectionProps: { codeLanguage: "bash" },
          })}
        >
          Bash Script
        </Item>
        <Item onClick={getOnClickFn({ type: C.TERMINAL })}>Terminal</Item>
      </DropdownMenu.Group>
      <DropdownMenu.Group>
        <DropdownMenu.Label className="mx-2 mb-1 mt-1.5 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
          Artifacts
        </DropdownMenu.Label>

        <Item onClick={getOnClickFn({ type: C.DRAW })}>Drawing Area</Item>
        <Item onClick={getOnClickFn({ type: C.IMAGE })}>Image</Item>
        <Item onClick={getOnClickFn({ type: C.CHART })}>Chart</Item>
        <Item onClick={getOnClickFn({ type: C.CHAT })}>Chat</Item>
      </DropdownMenu.Group>
      {/* <DropdownMenu.Separator className="mx-2 my-1 h-px bg-setta-100 dark:bg-setta-700" /> */}

      <DropdownMenu.Group>
        <DropdownMenu.Label className="mx-2 mb-1 mt-1.5 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
          Embed
        </DropdownMenu.Label>
        <Item onClick={getOnClickFn({ type: C.SOCIAL })}>Social</Item>
        <Item onClick={getOnClickFn({ type: C.IFRAME })}>IFrame</Item>
      </DropdownMenu.Group>

      {/* <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger className={itemStyle}>
          Embed
          <FiChevronRight className="ml-auto" size={10} />
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent className={contentStyle}>
            <Item onClick={getOnClickFn({ type: C.SOCIAL })}>Social</Item>
            <Item onClick={getOnClickFn({ type: C.IFRAME })}>IFrame</Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub> */}
    </ContextMenuCore>
  );
}
