import { useWaitingForLSPResult } from "state/definitions";

function setWaitingForLSP({ category, id, delay = 200 }) {
  const timeoutId = setTimeout(() => {
    useWaitingForLSPResult.setState((x) => {
      x[category][id] = true;
    });
  }, delay); // Delay of 200 ms

  // returns function to set waiting to false
  return () => {
    clearTimeout(timeoutId);
    useWaitingForLSPResult.setState((x) => {
      x[category][id] = false;
    });
  };
}

export function setTextFieldWaitingForLSP({ sectionId, paramInfoId }) {
  const id = textFieldIdForLSPWaiting({ sectionId, paramInfoId });
  return setWaitingForLSP({ category: "textFields", id });
}

export function setParametersRequestWaitingForLSP(sectionId) {
  return setWaitingForLSP({
    category: "parametersRequest",
    id: sectionId,
    delay: 0,
  });
}

export function textFieldIdForLSPWaiting({ sectionId, paramInfoId }) {
  return `${sectionId}-${paramInfoId}`;
}
