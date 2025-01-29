import CodeMirror from "@uiw/react-codemirror";
import {
  codeAreaTabOnEnterKeyHandlers,
  useCodeAreaHeight,
} from "components/Section/Layouts/CodeArea";
import { getExtensions } from "components/Utils/CodeMirror/getExtensions";
import { useCodeMirrorStyle } from "components/Utils/CodeMirror/useCodeMirrorStyle";
import _ from "lodash";
import { yamlToGUI } from "state/actions/guiToYaml";
import {
  getDisplayedSectionVariantId,
  getSectionVariant,
} from "state/actions/sectionInfos";
import { useSectionInfos, useYamlValue } from "state/definitions";
import { SETTA_PREVENT_SECTION_ACTIVE_CSS } from "utils/constants";

export function SectionYamlView({ sectionId }) {
  const isDisabled = useSectionInfos(
    (x) => getSectionVariant(sectionId, x).isFrozen,
  );

  function onChange() {
    debouncedYamlToGUI(sectionId);
  }

  return (
    <YamlView
      sectionId={sectionId}
      isDisabled={isDisabled}
      onChange={onChange}
    />
  );
}

export function YamlView({ sectionId, isDisabled, onChange }) {
  const [yamlValue, setYamlValue] = useGetAndSetYamlValue(sectionId);

  const { wrapperRef, handleCreateEditor, maxHeight, overflow, nowheel } =
    useCodeAreaHeight({ sectionId });

  const { onArticleDivEnterKeyFocusOnCodeMirror, onEscapeFocusOnArticleDiv } =
    codeAreaTabOnEnterKeyHandlers(wrapperRef);

  const theme = useCodeMirrorStyle();
  const extensions = getExtensions({
    sectionId,
    language: "yaml",
    indentWithTab: true,
    onEscape: onEscapeFocusOnArticleDiv,
    isDisabled,
  });

  function localOnChange(v) {
    setYamlValue(v);
    onChange?.();
  }

  // We need this class to avoid double scrollbars in GlobalParamSweepArea.
  // But we don't apply it when we're resizing because doing so causes
  // the scrollTop logic in useCodeAreaHeight to break.
  // (It ends up always scrolling to the top after resizing.)
  const cmEditorClass = overflow === "" ? "[&_.cm-editor]:h-full" : "";

  return (
    <article
      ref={wrapperRef}
      className={`${SETTA_PREVENT_SECTION_ACTIVE_CSS} nodrag section-full-no-title min-h-0 cursor-auto [&_*]:!outline-0 [&_.cm-theme]:h-full ${cmEditorClass} ${overflow} ${nowheel}`}
      onKeyDown={onArticleDivEnterKeyFocusOnCodeMirror}
      tabIndex="0"
    >
      <CodeMirror
        maxHeight={maxHeight}
        value={yamlValue}
        onChange={localOnChange}
        theme={theme}
        extensions={extensions}
        onCreateEditor={handleCreateEditor}
        indentWithTab={false}
        basicSetup={{ tabSize: 4 }}
      />
    </article>
  );
}

function useGetAndSetYamlValue(sectionId) {
  const { variantId, displayedVariantId } = useSectionInfos((state) => {
    return {
      variantId: state.x[sectionId].variantId,
      displayedVariantId: getDisplayedSectionVariantId(sectionId, state),
    };
  }, _.isEqual);

  const yamlValue = useYamlValue((x) => x[displayedVariantId] ?? "");

  function setYamlValue(v) {
    useYamlValue.setState({ [variantId]: v });
  }

  return [yamlValue, setYamlValue];
}

const debouncedYamlToGUI = _.debounce(yamlToGUI, 500);
