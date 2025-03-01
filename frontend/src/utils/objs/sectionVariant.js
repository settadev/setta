import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";
import { createRandomName } from "utils/idNameCreation";

export function newSectionVariant({ name, ...props }) {
  console.log("newSectionVariant");
  return _.merge(
    _.cloneDeep(DEFAULT_VALUES.sectionVariant),
    { name: name ?? createRandomName() },
    props,
  );
}
