import * as RadioGroup from "@radix-ui/react-radio-group";
import React, { useRef } from "react";
import { HiCheckCircle } from "react-icons/hi";

export const FileList = React.forwardRef(
  ({ files, onClick, onFileDoubleClick }, ref) => {
    return (
      <div className="flex flex-grow flex-col" ref={ref}>
        {files.map((x) => (
          <File
            id={x.id}
            name={x.name}
            onClick={onClick}
            key={x.id}
            onFileDoubleClick={onFileDoubleClick}
          />
        ))}
      </div>
    );
  },
);

function File({ id, name, onClick, onFileDoubleClick }) {
  const itemRef = useRef(null);

  function _onClick(e) {
    // single click
    if (e.detail === 1) {
      const isChecked =
        itemRef.current?.attributes["data-state"]?.value === "checked";
      if (isChecked) {
        onClick(null);
      }
    }
    // double click
    else if (e.detail === 2) {
      onFileDoubleClick(id);
    }
  }

  return (
    <RadioGroup.Item
      value={id}
      ref={itemRef}
      onClick={_onClick}
      className={`flex flex-grow cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-setta-100 focus-visible:ring-1 dark:text-setta-100 dark:hover:bg-setta-900 dark:hover:text-white`}
      tabIndex="0"
    >
      <span className="w-4">
        <RadioGroup.Indicator>
          <HiCheckCircle className="checkicon cursor-pointer text-green-500" />
        </RadioGroup.Indicator>
      </span>
      <div className="flex flex-grow justify-between">
        <label className="cursor-pointer">{name}</label>
      </div>
    </RadioGroup.Item>
  );
}
