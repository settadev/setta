import C from "constants/constants.json";
import _ from "lodash";
import { useSectionInfos } from "state/definitions";

export function useCreateSectionsList(getOnClickFn) {
  const singletonSections = useSectionInfos(
    (x) => x.singletonSections,
    _.isEqual,
  );
  return [
    {
      group: "Section",
      items: [
        { name: "Section", fn: getOnClickFn({ type: C.SECTION }) },
        { name: "List", fn: getOnClickFn({ type: C.LIST_ROOT }) },
        { name: "Dict", fn: getOnClickFn({ type: C.DICT_ROOT }) },
        { name: "Group", fn: getOnClickFn({ type: C.GROUP }) },
        { name: "Text", fn: getOnClickFn({ type: C.TEXT_BLOCK }) },
        {
          name: "Global Variables",
          fn: getOnClickFn({ type: C.GLOBAL_VARIABLES }),
          doRender: !singletonSections[C.GLOBAL_VARIABLES],
        },
        {
          name: "Global Param Sweep",
          fn: getOnClickFn({ type: C.GLOBAL_PARAM_SWEEP }),
          doRender: !singletonSections[C.GLOBAL_PARAM_SWEEP],
        },
      ],
    },
    {
      group: "Code",
      items: [
        {
          name: "Python Code",
          fn: getOnClickFn({
            type: C.CODE,
            sectionProps: { codeLanguage: "python" },
          }),
        },
        {
          name: "Bash Script",
          fn: getOnClickFn({
            type: C.CODE,
            sectionProps: { codeLanguage: "bash" },
          }),
        },
        { name: "Terminal", fn: getOnClickFn({ type: C.TERMINAL }) },
      ],
    },
    {
      group: "Artifacts",
      items: [
        { name: "Drawing Area", fn: getOnClickFn({ type: C.DRAW }) },
        { name: "Image", fn: getOnClickFn({ type: C.IMAGE }) },
        { name: "Chart", fn: getOnClickFn({ type: C.CHART }) },
        { name: "Chat", fn: getOnClickFn({ type: C.CHAT }) },
      ],
    },
    {
      group: "Embed",
      items: [
        { name: "Social", fn: getOnClickFn({ type: C.SOCIAL }) },
        { name: "IFrame", fn: getOnClickFn({ type: C.IFRAME }) },
      ],
    },
  ];
}
