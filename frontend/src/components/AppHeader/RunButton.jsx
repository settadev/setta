import { Button } from "components/Utils/atoms/buttons/Button";
import { NavbarMenuDropdown } from "components/Utils/atoms/menubar/menudropdown";
import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { useState } from "react";
import { RiArrowDownSLine, RiPlayMiniFill } from "react-icons/ri";
import {
  runOrImportAllCode,
  sendProjectToAllInteractiveCode,
} from "state/actions/runOrImportCode";
import { useSettings } from "state/definitions";
import { shortcutPrettified } from "utils/utils";

export function RunButton() {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses =
    "relative transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 h-full rounded-md gap-1 select-none flex items-center hover:bg-setta-100 dark:hover:bg-setta-800 bg-transparent active:!bg-blue-100 active:dark:!bg-blue-950";

  // Menu item styling with proper hover effect that's contained within the button
  const menuItemClasses =
    "flex items-center gap-2 px-1.5 py-1.5 text-xs text-setta-700 dark:text-setta-200  mx-1 rounded-md text-left hover:bg-setta-600 hover:text-white dark:hover:bg-setta-900 dark:hover:text-white active:bg-blue-100 active:dark:bg-blue-950 cursor-pointer";

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
  ];

  const sendProjectToAllInteractiveCodeShortcut = useSettings((x) =>
    shortcutPrettified(x.shortcuts.sendProjectToAllInteractiveCode),
  );

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
      <NavbarMenuDropdown
        triggerClassName="nodrag flex cursor-pointer select-none items-center justify-between gap-1 rounded-r-md py-1 px-1 text-xs font-semibold leading-none text-setta-700 outline-none transition-colors duration-150 hover:bg-setta-100 focus-visible:ring-2 dark:text-setta-200 dark:hover:bg-setta-800"
        trigger={<RiArrowDownSLine />}
      >
        {runActions.map((action, index) => (
          <MenuItem
            key={index}
            className={menuItemClasses}
            onClick={action.action}
            shortcut={sendProjectToAllInteractiveCodeShortcut}
          >
            <i className="w-2 opacity-50">{action.icon}</i>

            <span className="ml-0.5">{action.label}</span>
          </MenuItem>
        ))}
      </NavbarMenuDropdown>
    </div>
  );
}
