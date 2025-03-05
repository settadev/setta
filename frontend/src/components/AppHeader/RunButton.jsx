import { Button } from "components/Utils/atoms/buttons/Button";
import { StandardPopover } from "components/Utils/atoms/popover/standardpopover";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { useState } from "react";
import { RiArrowDownSLine, RiPlayMiniFill } from "react-icons/ri";
import {
  runOrImportAllCode,
  sendProjectToAllInteractiveCode,
} from "state/actions/runOrImportCode";

export function RunButton() {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses =
    "transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 h-full rounded-md gap-1 select-none flex items-center hover:bg-setta-100 dark:hover:bg-setta-800 bg-transparent active:!bg-blue-100 active:dark:!bg-blue-950";

  // Menu item styling with proper hover effect that's contained within the button
  const menuItemClasses =
    "flex items-center gap-1.5 px-3 py-1.5 text-xs text-setta-700 dark:text-setta-100 w-full text-left hover:bg-setta-100 dark:hover:bg-setta-850 active:bg-blue-100 active:dark:bg-blue-950 cursor-pointer";

  // Different run actions
  const runActions = [
    {
      label: "Run Interactive Fns",
      icon: <RiPlayMiniFill />,
      action: () => {
        sendProjectToAllInteractiveCode();
        setIsOpen(false);
      },
    },
    {
      label: "Run Interactive Functions",
      icon: <RiPlayMiniFill />,
      action: () => {
        sendProjectToAllInteractiveCode();
        setIsOpen(false);
      },
    },
    {
      label: "Run Interactive Functions Functions Functions Functions",
      icon: <RiPlayMiniFill />,
      action: () => {
        sendProjectToAllInteractiveCode();
        setIsOpen(false);
      },
    },
    {
      label: "Run",
      icon: <RiPlayMiniFill />,
      action: () => {
        sendProjectToAllInteractiveCode();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="flex justify-stretch">
      <Button
        onClick={runOrImportAllCode}
        twClasses={`${baseClasses} rounded-r-none px-2`}
        {...getFloatingBoxHandlers({ content: "Run your code." })}
      >
        <RiPlayMiniFill />
        Run
      </Button>

      <StandardPopover
        trigger={
          <Button twClasses={`${baseClasses} px-1 rounded-l-none`}>
            <RiArrowDownSLine />
          </Button>
        }
        contentClasses="bg-white dark:bg-setta-900 py-1 rounded-md shadow-lg z-50 min-w-36 w-48 border border-setta-200 dark:border-setta-800 overflow-hidden"
        open={isOpen}
        onOpenChange={setIsOpen}
        arrowClasses="hidden"
      >
        {runActions.map((action, index) => (
          <button
            key={index}
            className={menuItemClasses}
            onClick={action.action}
          >
            <i className="w-2">{action.icon}</i>

            <span className="ml-0.5">{action.label}</span>
          </button>
        ))}
      </StandardPopover>
    </div>
  );
}
