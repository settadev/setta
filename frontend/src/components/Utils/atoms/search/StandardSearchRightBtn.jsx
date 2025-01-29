import React from "react";
import { IconButton } from "../buttons/IconButton";

export const StandardSearchRightBtn = React.forwardRef(
  ({ rounded, bg, size, icon, ...props }, ref) => {
    return (
      <IconButton
        rounded={rounded || "rounded-full"}
        bg={bg || "bg-transparent"}
        size={size || "w-10 h-10"}
        padding="p-0"
        grid={true}
        twClasses="absolute right-0 hover:bg-blue-500 dark:hover:bg-blue-700 hover:text-white dark:text-setta-500 dark:hover:text-setta-100"
        icon={icon}
        {...props}
        ref={ref}
      />
    );
  },
);
