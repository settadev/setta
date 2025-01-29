import { SwitchInput } from "components/Params/ParamUIs/SwitchInput";
import { dbDocstringToMarkdown } from "requests/codeInfo";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useInfoAreaDescriptionAndEditability } from "state/hooks/sectionVariants";

export function InfoAreaSettings({ sectionId }) {
  const { renderMarkdown, description, variantIsFrozen } =
    useInfoAreaDescriptionAndEditability(sectionId);

  async function onChange(v) {
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

  return (
    <div className="flex w-full items-center justify-between gap-4 ">
      <p className="text-xs font-bold text-setta-700 dark:text-setta-300">
        Render Markdown
      </p>
      <SwitchInput
        isDisabled={variantIsFrozen}
        value={renderMarkdown}
        onChange={onChange}
        outerDivClassName="flex items-center"
      />
    </div>
  );
}
