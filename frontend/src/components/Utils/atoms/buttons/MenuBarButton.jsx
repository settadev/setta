import { forwardRef } from "react";
import { Button } from "./Button";

const twClasses =
  "bg-white dark:bg-transparent hover:bg-setta-100 dark:hover:bg-setta-800 text-xs font-semibold text-setta-700 dark:text-setta-100 py-1 px-2 rounded-md gap-1 select-none self-center";

export const MenuBarButton = forwardRef(
  ({ onClick, children, type, ...theRest }, ref) => {
    return (
      <Button
        twClasses={twClasses}
        {...theRest}
        ref={ref}
        type={type}
        onClick={onClick}
      >
        {children}
      </Button>
    );
  },
);
