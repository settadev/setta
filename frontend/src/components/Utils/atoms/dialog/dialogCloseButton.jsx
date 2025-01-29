import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../buttons/Button";

export function DialogCloseButton({ children, twClasses, onClick }) {
  return (
    <Dialog.Close asChild>
      <Button
        twClasses={`rounded-full text-sm px-3 py-1 font-bold ${twClasses}`}
        onClick={onClick}
      >
        {children}
      </Button>
    </Dialog.Close>
  );
}
