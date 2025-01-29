import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "components/Utils/atoms/buttons/Button";
import { FileList } from "./FileListing";

export function FileExplorer({
  files,
  selected,
  onSelectedChange,
  title,
  onFileDoubleClick,
}) {
  return (
    <>
      <Dialog.Title className=" mb-4 font-bold uppercase tracking-widest text-setta-400">
        {title}
      </Dialog.Title>

      <div className="mb-2 flex justify-between border-b border-solid border-setta-200 pb-2">
        <Button twClasses="text-xs text-setta-400 hover:text-setta-900 dark:hover:text-setta-200 rounded-md ring-0">
          Name
        </Button>
        {/* <Button twClasses="text-xs text-setta-400 dark:hover:text-setta-200 hover:text-setta-900 rounded-md ring-0">
          Last Modified
        </Button> */}
      </div>
      <div className="overflow-scroll">
        <RadioGroup.Root
          value={selected}
          onValueChange={onSelectedChange}
          asChild
        >
          <FileList
            files={files}
            onClick={onSelectedChange}
            onFileDoubleClick={onFileDoubleClick}
          />
        </RadioGroup.Root>
      </div>
    </>
  );
}
