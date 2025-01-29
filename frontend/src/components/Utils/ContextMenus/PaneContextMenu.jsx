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

  return (
    <ContextMenuCore
      x={x}
      y={y}
      closeContextMenu={closeAllContextMenus}
      isOpen={isOpen}
    >
      <p className="mx-2 mb-2 min-w-[100px] border-b border-setta-100 py-1 text-xs font-bold uppercase text-setta-300 dark:border-setta-700 dark:text-setta-500">
        Create New
      </p>

      <Item onClick={getOnClickFn({ type: C.SECTION })}>Section</Item>
      <Item onClick={getOnClickFn({ type: C.LIST_ROOT })}>List</Item>
      <Item onClick={getOnClickFn({ type: C.DICT_ROOT })}>Dict</Item>
      <Item onClick={getOnClickFn({ type: C.GROUP })}>Group</Item>
      <Item onClick={getOnClickFn({ type: C.INFO })}>Info</Item>
      {!singletonSections[C.GLOBAL_VARIABLES] && (
        <Item onClick={getOnClickFn({ type: C.GLOBAL_VARIABLES })}>
          Global Variables
        </Item>
      )}
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
      {!singletonSections[C.GLOBAL_PARAM_SWEEP] && (
        <Item onClick={getOnClickFn({ type: C.GLOBAL_PARAM_SWEEP })}>
          Global Param Sweep
        </Item>
      )}
      <Item onClick={getOnClickFn({ type: C.DRAW })}>Drawing Area</Item>
      <Item onClick={getOnClickFn({ type: C.IMAGE })}>Image</Item>
      <Item onClick={getOnClickFn({ type: C.CHART })}>Chart</Item>
      <Item onClick={getOnClickFn({ type: C.SOCIAL })}>Social</Item>
      <Item onClick={getOnClickFn({ type: C.IFRAME })}>IFrame</Item>
    </ContextMenuCore>
  );
}
