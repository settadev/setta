import CodeMirror from "@uiw/react-codemirror";
import {
  codeAreaTabOnEnterKeyHandlers,
  useCodeAreaHeight,
} from "components/Section/Layouts/CodeArea";
import { getExtensions } from "components/Utils/CodeMirror/getExtensions";
import { useCodeMirrorStyle } from "components/Utils/CodeMirror/useCodeMirrorStyle";
import C from "constants/constants.json";
import _ from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSectionVariant } from "state/actions/sectionInfos";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos, useSettings } from "state/definitions";
import { useTextBlockDescriptionAndEditability } from "state/hooks/sectionVariants";
import { SETTA_PREVENT_SECTION_ACTIVE_CSS } from "utils/constants";

export function MarkdownEditorInPane({ sectionId }) {
  const wrapperRef = useRef(); // used by onTabOnEnterKeyHandlers

  return (
    <MarkdownEditorCore
      sectionId={sectionId}
      wrapperClassName="cursor-auto overflow-y-scroll [&_*]:!outline-0"
      ref={wrapperRef}
    />
  );
}

export function MarkdownEditorInSection({ sectionId }) {
  const { wrapperRef, handleCreateEditor, maxHeight, overflow, nowheel } =
    useCodeAreaHeight({ sectionId });

  return (
    <MarkdownEditorCore
      sectionId={sectionId}
      onCreateEditor={handleCreateEditor}
      maxHeight={maxHeight}
      ref={wrapperRef}
      wrapperClassName={`${SETTA_PREVENT_SECTION_ACTIVE_CSS} nodrag section-full-no-title cursor-auto [&_*]:!outline-0 ${overflow} ${nowheel}`}
    />
  );
}

const _MarkdownEditorCore = React.forwardRef(
  ({ sectionId, maxHeight, onCreateEditor, wrapperClassName }, ref) => {
    const { renderMarkdown, description, variantIsFrozen } =
      useTextBlockDescriptionAndEditability(sectionId);

    const [localDescription, setLocalDescription] = useState(description);

    useEffect(() => {
      if (description !== localDescription) {
        setLocalDescription(description);
      }
    }, [description]);

    const debouncedSetDescription = useCallback(
      _.debounce((sectionId, v, description) => {
        if (v !== description) {
          useSectionInfos.setState((state) => {
            getSectionVariant(sectionId, state).description = v;
            state.x[sectionId].name =
              getFirstHeadingOrText(v) ??
              useSettings.getState().sections[C.TEXT_BLOCK].name;
          });
          maybeIncrementProjectStateVersion(true);
        }
      }, 200),
      [],
    );

    function onChange(v) {
      setLocalDescription(v);
      debouncedSetDescription(sectionId, v, description);
    }

    const { onArticleDivEnterKeyFocusOnCodeMirror, onEscapeFocusOnArticleDiv } =
      codeAreaTabOnEnterKeyHandlers(ref);

    const theme = useCodeMirrorStyle();

    const extensions = getExtensions({
      sectionId,
      language: renderMarkdown ? "markdown" : null,
      tabToAutocomplete: true,
      indentWithTab: true,
      isDisabled: variantIsFrozen,
      onEscape: onEscapeFocusOnArticleDiv,
    });

    return (
      <article
        ref={ref}
        className={wrapperClassName}
        onKeyDown={onArticleDivEnterKeyFocusOnCodeMirror}
        tabIndex="0"
      >
        <CodeMirror
          maxHeight={maxHeight}
          value={description}
          theme={theme}
          extensions={extensions}
          onChange={onChange}
          onCreateEditor={onCreateEditor}
          indentWithTab={false} // I take care of this in getExtensions
          basicSetup={{ tabSize: 4 }}
        />
      </article>
    );
  },
);

const MarkdownEditorCore = React.memo(_MarkdownEditorCore);

function getFirstHeadingOrText(markdown) {
  // Adjusting the approach to capture the first 10 characters if no heading is found
  const regex = /^(?:\n)?(#+\s*)(.*?)(\n|$)/m;

  // Trim the markdown to remove leading whitespace
  const trimmedMarkdown = markdown.trimStart();

  // Apply the regex to the trimmed markdown
  const match = trimmedMarkdown.match(regex);

  let output = "";
  let returnHeading = false;

  // If a match is found and it's at the start of the string, return the heading text
  if (match && match.index === 0) {
    output = match[2].trim();
    returnHeading = true;
  } else {
    // If no heading is found at the start, find the first occurrence of a heading
    const headingMatch = trimmedMarkdown.match(/(#+\s*)(.*?)(\n|$)/);
    if (headingMatch) {
      // Return the first 10 characters before the first heading, or the entire text if it's shorter
      output = trimmedMarkdown
        .substring(0, Math.min(20, headingMatch.index))
        .trim();
    } else {
      // If no headings are found at all, return the first 10 characters of the markdown
      output = trimmedMarkdown.substring(0, 20).trim();
    }
  }

  if (output === "") {
    return null;
  } else if (!returnHeading) {
    return output + "...";
  }
  return output;
}
