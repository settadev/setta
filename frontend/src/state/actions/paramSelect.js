import { useMisc } from "../definitions";

export function activateParamSelect() {
  useMisc.setState({ isSelectingParams: true });
}

export function deactivateParamSelect() {
  useMisc.setState({ isSelectingParams: false });
}
