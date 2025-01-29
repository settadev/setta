import { useEffect, useRef, useState } from "react";

export function useEditableOnSubmit(initialValue, onSetTitle, condition) {
  const [inputValue, setInputValue] = useState(initialValue);
  const blurTriggeredByEscapeKey = useRef(false);

  function onChange(event) {
    setInputValue(event.target.value);
  }

  async function onBlur(event) {
    if (blurTriggeredByEscapeKey.current) {
      blurTriggeredByEscapeKey.current = false;
      return;
    }
    blurTriggeredByEscapeKey.current = false;
    const v = event.target.value;
    if (v != "" && v != initialValue && (await condition(v))) {
      onSetTitle(v);
    } else {
      setInputValue(initialValue);
    }
  }

  function onKeyDown(event) {
    if (event.code === "Escape") {
      blurTriggeredByEscapeKey.current = true;
      event.target.blur();
      setInputValue(initialValue);
    } else if (event.code === "Enter") {
      event.target.blur();
    }
  }

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  return [inputValue, onChange, onBlur, onKeyDown, blurTriggeredByEscapeKey];
}
