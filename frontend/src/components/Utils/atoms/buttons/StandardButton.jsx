import { forwardRef } from "react";
import { Button } from "./Button";

export const StandardButton = forwardRef((props, ref) => {
  const {
    children,
    stdBtnStyles,
    type,
    inactive = "bg-setta-50 dark:bg-setta-800",
    hover = "hover:bg-setta-200 dark:hover:bg-setta-900",
    text = "text-setta-700 dark:text-setta-100 font-bold",
    align = "self-center",
    ...theRest
  } = props;
  return (
    <Button
      twClasses={`grid place-items-center py-2 px-4 rounded-full gap-1 ${inactive} ${hover} ${text} ${stdBtnStyles} ${align}`}
      {...theRest}
      ref={ref}
    >
      {children}
    </Button>
  );
});
