import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";

export function newCodeInfoCol() {
  return _.cloneDeep(DEFAULT_VALUES.codeInfoCol);
}
