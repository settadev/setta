import { Button } from "components/Utils/atoms/buttons/Button";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { useState } from "react";
import { RiPlayMiniFill } from "react-icons/ri";
import { runOrImportAllCode } from "state/actions/runOrImportCode";

export function RunButton() {
  const [isActive, setIsActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleClick = () => {
    setIsActive(true);
    setIsFadingOut(false);
    runOrImportAllCode();
    setTimeout(() => {
      setIsActive(false);
      setIsFadingOut(true);
      setTimeout(() => {
        setIsFadingOut(false);
      }, 1000);
    }, 50);
  };

  const baseClasses =
    "transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 py-1 px-2 rounded-md gap-1 select-none self-center flex items-center";
  const initialClickClasses =
    "duration-0 hover:bg-setta-100 dark:hover:bg-setta-800";
  const fadeOutClasses = "duration-[2000ms]";
  const activeClasses = "bg-green-200 dark:!bg-green-600";
  const inactiveClasses = "bg-white dark:bg-transparent";

  return (
    <Button
      onClick={handleClick}
      twClasses={`${baseClasses} ${isFadingOut ? fadeOutClasses : initialClickClasses} ${isActive ? activeClasses : inactiveClasses}`}
      {...getFloatingBoxHandlers({ content: "Run your code." })}
    >
      <RiPlayMiniFill />
      Run
    </Button>
  );
}
