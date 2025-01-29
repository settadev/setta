import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { useSectionInfos } from "state/definitions";

export function HideShowUnpinnedParamsButton({ sectionId }) {
  const hideUnpinnedParams = useSectionInfos(
    (x) => x.x[sectionId].hideUnpinnedParams,
  );

  function onClick() {
    useSectionInfos.setState((state) => {
      state.x[sectionId].hideUnpinnedParams = !hideUnpinnedParams;
    });
  }

  // only show this option if there are no parameters
  // and the search bar isn't hidden (we don't want to hide both params and search)
  return (
    <MenuItem onClick={onClick}>
      {hideUnpinnedParams ? "Show Unpinned Params" : "Hide Unpinned Params"}
    </MenuItem>
  );
}
