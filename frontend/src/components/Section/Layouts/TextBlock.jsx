import { MarkdownEditorInSection } from "components/Panes/UiEditor/MarkdownEditor/MarkdownEditor";
import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import _ from "lodash";
import React from "react";
import { HiCheck, HiOutlineDuplicate } from "react-icons/hi"; // Heroicons
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useSectionInfos } from "state/definitions";
import { useIsScrollable } from "state/hooks/sectionSizes";
import { getTextBlockDescription } from "state/hooks/sectionVariants";
import {
  SECTION_DISPLAY_MODES,
  SETTA_PREVENT_SECTION_ACTIVE_CSS,
} from "utils/constants";

function _TextBlock({ sectionId }) {
  const displayMode = useSectionInfos((x) => x.x[sectionId].displayMode);

  return displayMode === SECTION_DISPLAY_MODES.RENDER ? (
    <Markdown sectionId={sectionId} />
  ) : (
    <MarkdownEditorInSection sectionId={sectionId} />
  );
}

function _Markdown({ sectionId }) {
  const { renderMarkdown, description } = useSectionInfos(
    (x) => getTextBlockDescription(sectionId, x),
    _.isEqual,
  );

  const { ref, isScrollable } = useIsScrollable();

  const wrapperClassName = `${SETTA_PREVENT_SECTION_ACTIVE_CSS} section-main -mt-1  nodrag ${isScrollable ? "nowheel" : ""} -mr-[13px] pr-4 mb-3 ml-1 cursor-auto select-text overflow-y-scroll [&_.prose]:p-0`;

  // the classes "prose-code:before:hidden prose-code:after:hidden" are needed to prevent backticks from appearing
  // https://github.com/tailwindlabs/tailwindcss-typography/issues/18#issuecomment-1280797041
  return renderMarkdown ? (
    <div ref={ref} className={wrapperClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        className="prose-headings: prose prose-sm min-w-[100%] [flex:1_1_auto] dark:prose-invert   prose-headings:tracking-tighter prose-headings:text-setta-400  prose-h1:text-2xl prose-h1:leading-none prose-p:text-sm prose-code:before:hidden prose-code:after:hidden [&_*]:[word-wrap:break-word]"
        components={{
          code: CodeBlock,
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  ) : (
    <pre
      ref={ref}
      className={`${wrapperClassName} overflow-x-clip text-wrap break-words text-xs text-setta-700 dark:text-setta-300`}
    >
      {description}
    </pre>
  );
}

export const TextBlock = React.memo(_TextBlock);
const Markdown = React.memo(_Markdown);

export const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = React.useState(false);
  const codeRef = React.useRef(null);

  // Check if this is a block-level code element (triple backticks)
  const isBlockCode =
    node?.tagName === "code" && node?.position?.start?.column === 1;

  // Don't render copy button for inline code
  if (!isBlockCode) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return (
    <span className="group relative block">
      <button
        onClick={handleCopy}
        className="absolute right-0 top-0.5 cursor-pointer rounded bg-transparent text-setta-300 opacity-0 transition-opacity 
                   duration-200 hover:text-setta-600 focus:outline-none
                   focus:ring-2 focus-visible:ring-blue-500 group-hover:opacity-100 dark:hover:text-white"
        aria-label="Copy code"
      >
        {copied ? (
          <HiCheck className="h-4 w-4 text-green-500" />
        ) : (
          <HiOutlineDuplicate className="h-4 w-4" />
        )}
      </button>
      <code ref={codeRef} className={`${className}`} {...props}>
        {children}
      </code>
    </span>
  );
};
