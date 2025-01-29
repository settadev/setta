import { useEffect, useState } from "react";
import { guiToYaml, yamlToGUI } from "state/actions/guiToYaml";
import { getSectionInfo } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { SECTION_DISPLAY_MODES } from "utils/constants";

export function useShowYaml(sectionId) {
  const showYaml = useSectionInfos(
    (x) => x.x[sectionId].displayMode === SECTION_DISPLAY_MODES.YAML,
  );
  const [toYamlWasCalled, setToYamlWasCalled] = useState(false);

  useEffect(() => {
    if (showYaml) {
      const { variantId, displayMode } = getSectionInfo(sectionId);
      guiToYaml(sectionId, variantId, displayMode);
      setToYamlWasCalled(true);
    } else {
      if (toYamlWasCalled) {
        yamlToGUI(sectionId);
      }
    }
  }, [showYaml]);

  return showYaml;
}
