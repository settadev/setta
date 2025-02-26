import _ from "lodash";
import { matchSorter } from "match-sorter";
import { useCallback, useEffect, useState } from "react";
import { dbCheckIfFileExists } from "requests/artifacts";
import { asyncDebounce } from "utils/utils";

export function useMatchSorterFilter(completeList, keys, delay) {
  const [filter, setFilter] = useState("");

  const setFilterWithDelay = useCallback(
    _.debounce((x) => setFilter(x), delay),
    [delay],
  );

  const filteredList = filter
    ? matchSorter(completeList, filter, { keys })
    : completeList;

  if (delay) {
    return [filteredList, setFilterWithDelay];
  }
  return [filteredList, setFilter];
}

export function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    winWidth: undefined,
    winHeight: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

export function useFileExists(delay) {
  const [fileExists, setFileExists] = useState(false);

  const debouncedCheckIfFileExists = useCallback(
    asyncDebounce(async (f) => {
      const res = await dbCheckIfFileExists(f);
      setFileExists(res.data);
    }, delay),
    [setFileExists],
  );

  return { fileExists, debouncedCheckIfFileExists };
}
