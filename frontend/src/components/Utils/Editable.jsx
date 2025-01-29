import { useEffect, useRef, useState } from "react";

export function Editable({
  value,
  onChange,
  onBlur,
  onKeyDown,
  titleProps,
  onMouseEnter,
  onMouseLeave,
  doubleClickToEdit = false,
  blurTriggeredByEscapeKey,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const paragraphRef = useRef(null);

  function localOnBlur(e) {
    // store value in separate variable,
    // because blurTriggeredByEscapeKey gets reset in onBlur
    const focusOnNonEdit = blurTriggeredByEscapeKey.current;
    setIsEditing(false);
    onBlur(e);
    if (focusOnNonEdit) {
      requestAnimationFrame(() => {
        paragraphRef.current.focus({ preventScroll: true });
      });
    }
  }

  function onClick(e) {
    if (
      e.code === "Space" ||
      (doubleClickToEdit && e.detail === 2) ||
      !doubleClickToEdit
    ) {
      setIsEditing(true);
    }
  }

  return isEditing ? (
    <InEditMode
      value={value}
      onChange={onChange}
      onBlur={localOnBlur}
      onKeyDown={onKeyDown}
      titleProps={titleProps["editing"]}
    />
  ) : (
    <InNonEditMode
      value={value}
      onClick={onClick}
      titleProps={titleProps["notEditing"]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      paragraphRef={paragraphRef}
    />
  );
}

function InEditMode({ value, onChange, onBlur, onKeyDown, titleProps }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus({ preventScroll: true });
    const s = value.length;
    inputRef.current.setSelectionRange(0, s);
  }, []);

  return (
    <input
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={titleProps}
      ref={inputRef}
      size="1"
    />
  );
}

function InNonEditMode({
  value,
  onClick,
  titleProps,
  onMouseEnter,
  onMouseLeave,
  paragraphRef,
}) {
  function onKeyDown(e) {
    if (e.code === "Space") {
      e.preventDefault(); // need this to prevent title from getting erased
      onClick(e);
    }
  }

  return (
    <p
      onClick={onClick}
      className={titleProps}
      tabIndex="0"
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={paragraphRef}
    >
      {value}
    </p>
  );
}
