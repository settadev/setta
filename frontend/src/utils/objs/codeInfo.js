import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";
import { maybeNewId } from "../idNameCreation";

export function newCodeInfo({ id, ...props }) {
  return _.merge(
    _.cloneDeep(DEFAULT_VALUES.codeInfo),
    { id: maybeNewId(id) },
    props,
  );
}
