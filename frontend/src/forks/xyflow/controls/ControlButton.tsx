import cc from "classcat";
import { type FC, type PropsWithChildren } from "react";

import type { ControlButtonProps } from "./types";

const ControlButton: FC<PropsWithChildren<ControlButtonProps>> = ({
  children,
  className,
  ...rest
}) => (
  <button
    type="button"
    className={cc(["react-flow__controls-button", className])}
    {...rest}
  >
    {children}
  </button>
);

ControlButton.displayName = "ControlButton";

export default ControlButton;
