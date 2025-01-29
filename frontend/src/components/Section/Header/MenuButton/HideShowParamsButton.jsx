import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import _ from "lodash";
import { getSectionHasParams } from "state/actions/sections/sectionContents";
import { useSectionInfos } from "state/definitions";

export function HideShowParamsButton({ sectionId }) {
  const { hasParams, hideSearch, hideParams } = useSectionInfos((x) => {
    return {
      hasParams: getSectionHasParams(sectionId, x),
      hideSearch: x.x[sectionId].hideSearch,
      hideParams: x.x[sectionId].hideParams,
    };
  }, _.isEqual);

  function onClick() {
    useSectionInfos.setState((state) => {
      state.x[sectionId].hideParams = !hideParams;
    });
  }

  // only show this option if there are no parameters
  // and the search bar isn't hidden (we don't want to hide both params and search)
  return (
    !hasParams &&
    !hideSearch && (
      <MenuItem onClick={onClick}>
        {hideParams ? "Show Params" : "Hide Params"}
      </MenuItem>
    )
  );
}
