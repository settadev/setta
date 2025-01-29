import _ from "lodash";
import { useAvailableUITypesForParam } from "state/hooks/presetUITypes";
import { IdNameCombobox } from "./IdNameCombobox";

function UITypeCombobox({ onDropdownSelect, selectedId, availableUITypes }) {
  const grouped = _.groupBy(availableUITypes, "displayType");
  const groupedAsList = Object.keys(grouped).map((k) => ({
    group: k,
    items: grouped[k],
  }));

  return (
    <IdNameCombobox
      allItems={groupedAsList}
      value={selectedId}
      onSelectedItemChange={onDropdownSelect}
    />
  );
}

export function ParamConfigUITypeCombobox({
  sectionId,
  paramInfoId,
  selectedId,
  ...props
}) {
  const availableUITypes = useAvailableUITypesForParam(
    sectionId,
    paramInfoId,
    selectedId,
  );
  return (
    <UITypeCombobox
      availableUITypes={availableUITypes}
      selectedId={selectedId}
      {...props}
    />
  );
}
