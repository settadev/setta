import { canvasToBase64 } from "components/Section/Layouts/DrawArea/base64Conversion";
import _ from "lodash";
import { sendMessage } from "requests/websocket";
import { useTemporaryMiscState } from "state/definitions";
import { createNewId } from "utils/idNameCreation";

function deleteTemporaryMiscState(id) {
  useTemporaryMiscState.setState((state) => _.omit(state, [id]), true);
}

export function setTemporaryMiscState(id, message) {
  useTemporaryMiscState.setState({ [id]: message });
}

function callFnAndWait({ id, condition, fn }) {
  return new Promise((resolve) => {
    const actualId = id ? id : createNewId();
    const unsub = useTemporaryMiscState.subscribe(
      (x) => x[actualId],
      (x) => {
        if (!condition || condition(x)) {
          unsub();
          resolve(x);
          deleteTemporaryMiscState(actualId);
        }
      },
    );

    fn?.(actualId);
  });
}

export async function sendMessageAndWait({
  id,
  messageType,
  content,
  condition,
}) {
  const fn = (actualId) =>
    sendMessage({
      id: actualId,
      messageType,
      content,
    });
  return await callFnAndWait({ id, condition, fn });
}

export async function requestBase64FromCanvas(sectionId) {
  const fn = (actualId) => setTemporaryMiscState(actualId, true);
  const id = base64RequestId(sectionId);
  const condition = () => true;
  return await callFnAndWait({ id, condition, fn });
}

function base64RequestId(sectionId) {
  return `${sectionId}-base64-request`;
}

export function listenForCanvasToBase64Requests(sectionId, canvasRef) {
  const id = base64RequestId(sectionId);
  const unsub = useTemporaryMiscState.subscribe(
    (x) => x[id],
    (x) => {
      if (x === true) {
        setTemporaryMiscState(id, canvasToBase64(canvasRef.current));
      }
    },
  );
  return unsub;
}

export async function waitForFileDeletion(filepath) {
  let wasDeleted = false;

  await callFnAndWait({
    id: fileDeletionRequestId(filepath),
    condition: (x) => {
      wasDeleted = x;
      return true;
    },
  });

  return wasDeleted;
}

export function fileDeletionRequestId(filepath) {
  return `${filepath}-delete-request`;
}
