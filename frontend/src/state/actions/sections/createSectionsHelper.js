import C from "constants/constants.json";
import _ from "lodash";
import { useSectionInfos } from "state/definitions";

export function useCreateSectionsList() {
  const singletonSections = useSectionInfos(
    (x) => x.singletonSections,
    _.isEqual,
  );
  const sectionGroupItems = [
    { name: "Section", specificProps: { type: C.SECTION } },
    { name: "List", specificProps: { type: C.LIST_ROOT } },
    { name: "Dict", specificProps: { type: C.DICT_ROOT } },
    { name: "Group", specificProps: { type: C.GROUP } },
    { name: "Text", specificProps: { type: C.TEXT_BLOCK } },
  ];

  if (!singletonSections[C.GLOBAL_VARIABLES]) {
    sectionGroupItems.push({
      name: "Global Variables",
      specificProps: { type: C.GLOBAL_VARIABLES },
    });
  }
  if (!singletonSections[C.GLOBAL_PARAM_SWEEP]) {
    sectionGroupItems.push({
      name: "Global Param Sweep",
      specificProps: { type: C.GLOBAL_PARAM_SWEEP },
    });
  }

  return [
    {
      group: "Section",
      items: sectionGroupItems,
    },
    {
      group: "Code",
      items: [
        {
          name: "Python Code",
          specificProps: {
            type: C.CODE,
            sectionProps: { codeLanguage: "python" },
          },
        },
        {
          name: "Bash Script",
          specificProps: {
            type: C.CODE,
            sectionProps: { codeLanguage: "bash" },
          },
        },
        { name: "Terminal", specificProps: { type: C.TERMINAL } },
      ],
    },
    {
      group: "Artifacts",
      items: [
        { name: "Drawing Area", specificProps: { type: C.DRAW } },
        { name: "Image", specificProps: { type: C.IMAGE } },
        { name: "Chart", specificProps: { type: C.CHART } },
        { name: "Chat", specificProps: { type: C.CHAT } },
      ],
    },
    {
      group: "Embed",
      items: [
        { name: "Social", specificProps: { type: C.SOCIAL } },
        { name: "IFrame", specificProps: { type: C.IFRAME } },
      ],
    },
  ];
}
