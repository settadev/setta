import { SwitchInput } from "components/Params/ParamUIs/SwitchInput";
import { dbDocstringToMarkdown } from "requests/codeInfo";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useTextBlockDescriptionAndEditability } from "state/hooks/sectionVariants";

export function TextBlockSettings({ sectionId }) {
  const { renderMarkdown, description, variantIsFrozen, headingAsSectionName } =
    useTextBlockDescriptionAndEditability(sectionId);

  async function onChangeRenderMarkdown(v) {
    let newDescription;
    if (v) {
      const res = await dbDocstringToMarkdown(description);
      newDescription = res.status === 200 ? res.data : description;
    } else {
      newDescription = description;
    }
    useSectionInfos.setState((state) => {
      getSectionVariant(sectionId, state).description = newDescription;
      state.x[sectionId].renderMarkdown = v;
    });
  }

  async function onChangeHeadingAsSectionName(v) {
    useSectionInfos.setState((state) => {
      state.x[sectionId].headingAsSectionName = v;
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-xs font-bold text-setta-700 dark:text-setta-300">
          Render Markdown
        </p>
        <SwitchInput
          isDisabled={variantIsFrozen}
          value={renderMarkdown}
          onChange={onChangeRenderMarkdown}
          outerDivClassName="flex items-center"
        />
      </div>
      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-xs font-bold text-setta-700 dark:text-setta-300">
          Heading As Section Name
        </p>
        <SwitchInput
          isDisabled={variantIsFrozen}
          value={headingAsSectionName} // Add your state value
          onChange={onChangeHeadingAsSectionName} // Add your onChange handler
          outerDivClassName="flex items-center"
        />
      </div>
    </div>
  );
}
