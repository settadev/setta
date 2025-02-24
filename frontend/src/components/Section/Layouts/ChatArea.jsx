import _ from "lodash";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { sendToInteractiveTasks } from "state/actions/interactive";
import { useAllSectionArtifacts } from "state/hooks/artifacts";
import { useIsScrollable } from "state/hooks/sectionSizes";
import useDeepCompareEffect from "use-deep-compare-effect";
import { NO_PAN_CLASS_NAME, NO_WHEEL_CLASS_NAME } from "utils/constants";
import { CodeBlock } from "./TextBlock";

export function ChatArea({ sectionId }) {
  const loadedArtifacts = useAllSectionArtifacts(sectionId, (x) =>
    _.pick(x, ["value"]),
  );
  const artifact = Object.values(loadedArtifacts)[0];

  return (
    Boolean(artifact) && (
      <ChatAreaCore sectionId={sectionId} messages={artifact.value} />
    )
  );
}

function ChatAreaCore({ sectionId, messages }) {
  const [newMessage, setNewMessage] = useState("");
  const [pendingUserMessages, setPendingUserMessages] = useState([]);
  const { ref, isScrollable } = useIsScrollable();

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    if (newMessage.trim() === "") return;
    sendToInteractiveTasks([sectionId, "latestChatMessage"], newMessage);
    setPendingUserMessages((x) => [
      ...x,
      { role: "user", content: newMessage },
    ]);
    setNewMessage("");
  };

  // Add an onKeyDown handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSubmit();
    }
  };

  useDeepCompareEffect(() => {
    setPendingUserMessages([]);
  }, [messages]);

  return (
    <div className={`${NO_PAN_CLASS_NAME} section-main-full-w flex flex-col `}>
      <div
        className={`${
          isScrollable ? NO_WHEEL_CLASS_NAME : ""
        } flex flex-1 flex-col-reverse overflow-y-auto px-4`}
        ref={ref}
      >
        {/* The flex-col-reverse trick is to keep the scrollbar at the bottom: https://stackoverflow.com/a/44051405. Wrapped messages in a div to maintain correct visual order */}
        <div>
          {[...messages, ...pendingUserMessages].map((message, idx) => (
            <div
              key={idx}
              className={`my-2 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                className={`prose prose-sm max-w-[clamp(100px,_85%,_800px)] cursor-text px-4 py-2.5 ${
                  message.role === "user"
                    ? "rounded-t-lg rounded-bl-lg bg-blue-500 text-white prose-headings:text-blue-200 dark:bg-blue-700"
                    : "rounded-b-lg rounded-tr-lg bg-setta-100 text-setta-800 prose-headings:text-setta-600 dark:bg-setta-700/50 dark:text-setta-50 dark:prose-headings:text-setta-300"
                } [flex:1_1_auto] dark:prose-invert   prose-headings:tracking-tighter   prose-h1:text-2xl prose-h1:leading-none prose-p:text-sm prose-code:before:hidden prose-code:after:hidden [&_*]:break-words`}
                components={{
                  code: CodeBlock,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="px-4 pb-2 pt-2">
        <div className="flex space-x-2">
          <textarea
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={`${isScrollable ? NO_WHEEL_CLASS_NAME : ""} max-h-48 flex-1 resize-none overflow-y-auto rounded-lg border border-setta-100 bg-transparent px-4 py-2 text-setta-800 outline-none [field-sizing:content] hover:bg-setta-100/50  focus:outline-none focus:outline focus:outline-blue-500 dark:border-setta-700  dark:text-white dark:hover:bg-setta-800 dark:focus:bg-setta-800/50 dark:focus:outline-blue-700`}
          />
          <button
            type="submit"
            className="cursor-pointer self-end rounded-lg bg-blue-500 px-4 py-2.5 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
