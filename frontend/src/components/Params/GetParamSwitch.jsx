import _ from "lodash";
import { matchSorter } from "match-sorter";
import { useSectionInfos } from "state/definitions";
import { ParamSwitch } from "./ParamSwitch";

export function GetParamSwitch({
  sectionId,
  paramIds,
  requiredParamIdsToPaths,
  onResizeStart,
  isTopLevel = false,
}) {
  // TODO: make this more efficient
  const filteredIds = useSectionInfos((x) => {
    let matches = paramIds;

    if (x.x[sectionId].paramFilter) {
      const requiredParamIdsWithNames = Object.keys(
        requiredParamIdsToPaths,
      ).map((id) => ({
        id,
        name: x.codeInfo[id].name,
      }));

      matches = matchSorter(
        requiredParamIdsWithNames,
        x.x[sectionId].paramFilter,
        {
          keys: ["name"],
        },
      );
    }

    const filteredRequired = new Set();
    for (const m of matches) {
      const path = requiredParamIdsToPaths[m.hasOwnProperty("id") ? m.id : m];
      if (!path) {
        continue;
      }
      for (const p of path) {
        filteredRequired.add(p);
      }
    }

    return paramIds.filter((p) => filteredRequired.has(p));
  }, _.isEqual);

  return filteredIds.map((e, idx) => (
    <ParamSwitch
      key={e}
      sectionId={sectionId}
      paramInfoId={e}
      requiredParamIdsToPaths={requiredParamIdsToPaths}
      onResizeStart={onResizeStart}
      isTopLevelWithPad={isTopLevel && idx > 0}
    />
  ));
}
