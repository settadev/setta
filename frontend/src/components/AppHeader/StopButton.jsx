import { Button } from "components/Utils/atoms/buttons/Button";
import { RiStopFill } from "react-icons/ri";
import { dbKillInMemorySubprocesses } from "requests/interactive";

export function StopButton() {
  const baseClasses =
    "relative transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 h-full rounded-md gap-1 select-none flex items-center hover:bg-setta-100 dark:hover:bg-setta-800 bg-transparent active:!bg-blue-100 active:dark:!bg-blue-950";

  return (
    <div className="flex justify-stretch">
      <Button
        onClick={dbKillInMemorySubprocesses}
        twClasses={`${baseClasses} px-2`}
      >
        <RiStopFill />
        Stop
      </Button>
    </div>
  );
}
