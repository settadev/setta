import { Button } from "components/Utils/atoms/buttons/Button";
import { StandardPopover } from "components/Utils/atoms/popover/standardpopover";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { useState } from "react";
import { RiArrowDownSLine, RiPlayMiniFill } from "react-icons/ri";
import { runOrImportAllCode } from "state/actions/runOrImportCode";

export function RunButton() {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses =
    "transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 py-1 px-2 rounded-md gap-1 select-none self-center flex items-center hover:bg-setta-100 dark:hover:bg-setta-800 bg-transparent active:!bg-blue-100 active:dark:!bg-blue-950";

  // Menu item styling with proper hover effect that's contained within the button
  const menuItemClasses =
    "flex items-center gap-1.5 px-3 py-1.5 text-xs text-setta-700 dark:text-setta-100 w-full text-left hover:bg-setta-100 dark:hover:bg-setta-800 active:bg-blue-100 active:dark:bg-blue-950";

  // Different run actions
  const runActions = [
    {
      label: "Run Interactive Fns",
      icon: <RiPlayMiniFill />,
      action: () => {
        runOrImportAllCode();
        setIsOpen(false);
      },
    },
  ];

  const dropdownTrigger = (
    <div className="flex items-center">
      <Button
        onClick={runOrImportAllCode}
        twClasses={`${baseClasses} rounded-r-none`}
        {...getFloatingBoxHandlers({ content: "Run your code." })}
      >
        <RiPlayMiniFill />
        Run
      </Button>

      <Button
        twClasses={`${baseClasses} pl-1 pr-1 rounded-l-none border-l border-setta-200 dark:border-setta-700`}
      >
        <RiArrowDownSLine />
      </Button>
    </div>
  );

  return (
    <div className="relative">
      <StandardPopover
        trigger={dropdownTrigger}
        contentClasses="bg-white dark:bg-setta-900 py-1 px-0 rounded-md shadow-lg z-50 min-w-36 w-48 border border-setta-200 dark:border-setta-700 overflow-hidden"
        open={isOpen}
        onOpenChange={setIsOpen}
        arrowClasses="hidden"
      >
        <div className="w-full">
          {runActions.map((action, index) => (
            <button
              key={index}
              className={menuItemClasses}
              onClick={action.action}
            >
              {action.icon}
              <span className="ml-0.5">{action.label}</span>
            </button>
          ))}
        </div>
      </StandardPopover>
    </div>
  );
}
