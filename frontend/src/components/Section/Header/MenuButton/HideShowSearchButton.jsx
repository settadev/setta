import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import _ from "lodash";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";

export function HideShowSearchButton({ sectionId }) {
  const { selectedItem, hideSearch, hideParams } = useSectionInfos((x) => {
    return {
      selectedItem: getSectionVariant(sectionId, x).selectedItem,
      hideSearch: x.x[sectionId].hideSearch,
      hideParams: x.x[sectionId].hideParams,
    };
  }, _.isEqual);

  function onClick() {
    useSectionInfos.setState((state) => {
      state.x[sectionId].hideSearch = !hideSearch;
    });
  }

  return (
    !selectedItem &&
    !hideParams && (
      <MenuItem onClick={onClick}>
        {hideSearch ? "Show Search" : "Hide Search"}
      </MenuItem>
    )
  );
}
