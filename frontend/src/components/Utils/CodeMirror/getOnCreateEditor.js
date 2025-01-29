import { useReactFlow } from "forks/xyflow/core/store";
import { setTextFieldWaitingForLSP } from "state/actions/lsp";
import { goToSection } from "state/actions/sections/sectionPositions";
import { useEVRefRegex } from "state/definitions";
import { roundUpIdx } from "./utils";

function getContentDomEventListener(evRefs, editor) {
  return (event) => {
    if (!variableClick(event)) {
      return;
    }

    event.stopPropagation(); //prevent SectionContainerCore onClick from triggering

    // Convert click coordinates to a position in the editor
    const pos = editor.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      return;
    }

    let keywordInfo = null;

    for (const k of evRefs) {
      if (pos >= k.startPos && pos < k.startPos + k.keyword.length) {
        keywordInfo = k;
        break;
      }
    }

    if (keywordInfo) {
      const { startPos, keyword } = keywordInfo;
      const endIdx = roundUpIdx(
        useEVRefRegex.getState().fullNameToInfo[keyword].componentIndices,
        pos - startPos,
      );
      goToSectionOnNameClick({
        editor,
        event,
        variable: keyword.slice(0, endIdx),
      });
    }
  };
}

function fixPlaceholderCursor(divId, value, defaultVal) {
  // The cursor appears the wrong size when there's a placeholder text and when you're zoomed in.
  // This is a hacky solution to that problem.
  if (!value && defaultVal) {
    const divs = document.querySelectorAll(`#${divId} .cm-cursor`);
    divs.forEach((div) => {
      div.style.height = `${14 * useReactFlow.getState().transform[2]}px`;
    });
  }
}

export function getOnCreateEditor({
  evRefs,
  initialEvent,
  setRealIsInitialized,
  divId,
  value,
  defaultVal,
}) {
  return (view) => {
    // view.contentDOM.addEventListener(
    //   "click",
    //   getContentDomEventListener(evRefs, view),
    // );
    view.focus();
    if (initialEvent !== "tab") {
      const { clientX, clientY } = initialEvent;
      const pos = view.posAtCoords({ x: clientX, y: clientY });
      view.dispatch({ selection: { anchor: pos, head: pos } });
    }

    fixPlaceholderCursor(divId, value, defaultVal);
    setRealIsInitialized(true);
  };
}

function getFromTo(options, before, context) {
  for (const opt of options) {
    if (opt.from) {
      return { from: opt.from, to: opt.to };
    }
  }
  return { from: before ? before.from : context.pos };
}

export function getCompletionsFn(
  sectionId,
  paramInfoId,
  dbCompletionFn,
  language,
) {
  if (language === "python") {
    return async (context) => {
      const fullText = context.state.doc.toString();
      if (!fullText.trim()) return null;
      const before = context.matchBefore(/([^.=\\(+-\/ ]*)$/);
      const setToNotWaiting = setTextFieldWaitingForLSP({
        sectionId,
        paramInfoId,
      });
      const res = await dbCompletionFn({
        sectionId,
        paramInfoId,
        fullText,
        position: context.pos,
        codeLanguage: language,
      });
      setToNotWaiting();
      if (res.data) {
        return {
          filter: true,
          ...getFromTo(res.data, before, context),
          options: res.data,
          // validFor: /([^.=\\(]*)$/,
        };
      }
      return null;
    };
  }

  return () => null;
}

export function goToSectionOnNameClick({ editor, event, variable }) {
  const { sectionId } = useEVRefRegex.getState().fullNameToInfo[variable];
  if (sectionId) {
    event.stopPropagation(); //prevent SectionContainerCore onClick from triggering
    if (editor) {
      editor.contentDOM.blur(); //blur the input field we just clicked on
    }
    goToSection(sectionId);
  }
}
