import {
  screenToFlowPosition,
  setCenter,
} from "forks/xyflow/core/hooks/useViewportHelper";
import _ from "lodash";
import { matchSorter } from "match-sorter";
import { useState } from "react";
import { getDisplayedSectionIdToChildren } from "state/actions/sectionInfos";
import { getAllVisibleParamsInSection } from "state/actions/sections/sectionContents";
import {
  useProjectSearch,
  useSectionInfos,
  useSettings,
} from "state/definitions";

export function useUpdateProjectSearch() {
  const [value, setValue] = useState("");
  const [visibleParams, setVisibleParams] = useState([]);
  const [currIdx, setCurrIdx] = useState(-1);

  function onChange(e) {
    const v = e.target.value;
    setValue(v);
    doUpdateSearch(v, visibleParams);
    setCurrIdx(-1);
  }

  function onBlur() {
    useProjectSearch.getState().reset();
  }

  function onFocus() {
    const newVisibleParams = getAllVisibleParams();
    setVisibleParams(newVisibleParams);
    doUpdateSearch(value, newVisibleParams);
  }

  function onKeyDown(e) {
    if (e.code === "Enter") {
      const { codeInfo: searchResults } = useProjectSearch.getState();
      if (searchResults.length === 0) {
        return;
      }
      const newIdx = (currIdx + 1) % searchResults.length;
      const focusedSearchResult = searchResults[newIdx];
      useProjectSearch.setState({ focused: focusedSearchResult });
      goToSearchResult(focusedSearchResult);
      setCurrIdx(newIdx);
    } else if (e.code === "Escape") {
      e.target.blur();
    }
  }

  return { value, onChange, onBlur, onFocus, onKeyDown };
}

function getAllVisibleParams() {
  const state = useSectionInfos.getState();
  const output = [];
  const sectionIdToChildren = getDisplayedSectionIdToChildren(state, true);

  function dfs(sectionId) {
    if (sectionId) {
      getParamsAndAddToSearchResults(sectionId, state, output);
    }

    const children = sectionIdToChildren[sectionId] || [];
    for (const childId of children) {
      dfs(childId);
    }
  }

  dfs(null);

  return output;
}

function getParamsAndAddToSearchResults(sectionId, state, output) {
  const ids = getAllVisibleParamsInSection(sectionId, state);
  for (const p of ids) {
    output.push({
      sectionId,
      paramInfoId: p,
      name: state.codeInfo[p].name,
    });
  }
}

function goToSearchResult(searchResult) {
  const { sectionId, paramInfoId } = searchResult;
  const element = document.getElementById(
    `ParamContainer-${sectionId}-${paramInfoId}`,
  );
  const { x: _x, y: _y, width, height } = element.getBoundingClientRect();
  const { x, y } = screenToFlowPosition({
    x: _x + width / 2,
    y: _y + height / 2,
  });
  const zoom = useSettings.getState().gui.defaultZoomLevel;
  setCenter(x, y, { zoom });
}

function updateSearch(value, allVisibleParams) {
  if (!value) {
    useProjectSearch.getState().reset();
    return;
  }

  const codeInfo = matchSorter(allVisibleParams, value, {
    keys: ["name"],
    sorter: (rankedItems) => rankedItems, //don't sort
  });

  useProjectSearch.setState({
    codeInfo,
    lookup: new Set(
      codeInfo.map((x) =>
        createProjectSearchLookupKey(x.sectionId, x.paramInfoId),
      ),
    ),
  });
}

const doUpdateSearch = _.debounce(updateSearch, 100);

export function createProjectSearchLookupKey(sectionId, paramInfoId) {
  return `${sectionId}-${paramInfoId}`;
}
