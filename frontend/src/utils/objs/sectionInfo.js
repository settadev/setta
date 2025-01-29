import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";
import { useSectionInfos, useSettings } from "state/definitions";
import { BASE_UI_TYPE_IDS } from "utils/constants";
import { createVarName, maybeNewId } from "../idNameCreation";

export function newSectionInfo({
  id,
  variantId,
  uiTypeId = BASE_UI_TYPE_IDS.SECTION,
  uiTypeColId,
  variantIds = [],
  ...props
}) {
  const uiTypeName = useSectionInfos.getState().uiTypes[uiTypeId].type;

  const output = _.merge(
    _.cloneDeep(DEFAULT_VALUES.section),
    _.cloneDeep(useSettings.getState().sections[uiTypeName]),
  );

  if (!output.name) {
    output.name = createVarName(
      _.map(useSectionInfos.getState().x, (s) => s.name),
    );
  }

  const _variantId = maybeNewId(variantId);
  const _variantIds = [...variantIds, _variantId];

  return _.merge(
    output,
    {
      id: maybeNewId(id),
      variantId: _variantId,
      defaultVariantId: _variantId,
      uiTypeId,
      variantIds: _variantIds,
    },
    props,
  );
}
