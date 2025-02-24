import { useState } from "react";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";

export function IframeSettings({ sectionId }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const validateIframeCode = (code) => {
    if (!code.toLowerCase().includes("<iframe")) {
      return "Input must contain an iframe tag";
    }
    return "";
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);

    const validationError = validateIframeCode(newCode);
    setError(validationError);

    // Only pass valid code to parent
    if (!validationError) {
      useSectionInfos.setState((x) => {
        const sectionVariant = getSectionVariant(sectionId, x);
        sectionVariant.code = newCode;
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="py-4">
        <h2 className="text-sm font-bold text-setta-700 dark:text-setta-300">
          Iframe Code
        </h2>
        <p className="text-xs text-setta-600 dark:text-setta-500">
          Paste your iframe HTML below
        </p>
      </header>

      {/* Main content area with scroll */}
      <section className="flex-1 overflow-y-auto">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="h-48 w-full resize-y rounded-md border border-solid border-setta-200 bg-white/80 p-3 font-mono text-sm text-setta-800 placeholder-setta-300 focus:!border-blue-500 focus:outline-0 focus:ring-0 dark:border-setta-700 dark:bg-setta-900 dark:text-setta-300 dark:placeholder-setta-600"
          placeholder="<iframe src='...'></iframe>"
          spellCheck="false"
        />

        {error && (
          <div className="dark:red-500 my-2 rounded border border-red-600 bg-red-500 px-4 py-3 font-bold text-white">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
