import { Button } from "components/Utils/atoms/buttons/Button";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { RiPlayMiniFill } from "react-icons/ri";
import { runOrImportAllCode } from "state/actions/runOrImportCode";

export function RunButton() {
  const classes =
    "transition-colors text-xs font-semibold text-setta-700 dark:text-setta-100 py-1 px-2 rounded-md gap-1 select-none self-center flex items-center hover:bg-setta-100 dark:hover:bg-setta-800 bg-transparent active:!bg-blue-100 active:dark:!bg-blue-950";

  return (
    <Button
      onClick={runOrImportAllCode}
      twClasses={classes}
      {...getFloatingBoxHandlers({ content: "Run your code." })}
    >
      <RiPlayMiniFill />
      Run
    </Button>
  );
}
