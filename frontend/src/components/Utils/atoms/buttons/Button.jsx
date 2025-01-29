import { forwardRef } from "react";

export const Button = forwardRef((props, ref) => {
  const {
    twClasses = "",
    grid = false,
    type,
    onClick,
    children,
    ...theRest
  } = props;
  const gridStatus = grid
    ? "grid place-items-center"
    : "inline-flex items-center";

  const classes = `focus-visible:ring-2 ${gridStatus} nodrag cursor-pointer ${twClasses} `;

  return (
    <button
      className={classes}
      {...theRest}
      ref={ref}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
});
