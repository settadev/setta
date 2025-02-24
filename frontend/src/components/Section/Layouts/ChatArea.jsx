import _ from "lodash";
import { useState } from "react";
import { sendToInteractiveTasks } from "state/actions/interactive";
import { useAllSectionArtifacts } from "state/hooks/artifacts";
import { useIsScrollable } from "state/hooks/sectionSizes";
import useDeepCompareEffect from "use-deep-compare-effect";
import { NO_PAN_CLASS_NAME, NO_WHEEL_CLASS_NAME } from "utils/constants";

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
    e.preventDefault();
    if (newMessage.trim() === "") return;
    sendToInteractiveTasks([sectionId, "chatMessage"], newMessage);
    setPendingUserMessages((x) => [...x, { sender: "user", text: newMessage }]);
    setNewMessage("");
  };

  useDeepCompareEffect(() => {
    setPendingUserMessages([]);
  }, [messages]);

  return (
    <div
      className={`${NO_PAN_CLASS_NAME} section-full flex flex-col rounded-lg bg-white shadow-lg`}
    >
      <div
        className={`${isScrollable ? NO_WHEEL_CLASS_NAME : ""} flex-1 overflow-y-auto p-4`}
        ref={ref}
      >
        {[...messages, ...pendingUserMessages].map((message, idx) => (
          <div
            key={idx}
            className={`mb-4 flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
