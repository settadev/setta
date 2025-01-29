import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";

export function newUITypeColEntry(props) {
  return _.merge(_.cloneDeep(DEFAULT_VALUES.uiTypeColEntry), props);
}
