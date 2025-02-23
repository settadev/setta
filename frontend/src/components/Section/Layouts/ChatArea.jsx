import { useState } from "react";
import { useIsScrollable } from "state/hooks/sectionSizes";
import { NO_PAN_CLASS_NAME, NO_WHEEL_CLASS_NAME } from "utils/constants";

export function ChatArea() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello!", sender: "bot" },
    { id: 2, text: "Hi there!", sender: "user" },
    { id: 1, text: "Hello!", sender: "bot" },
    { id: 2, text: "Hi there!", sender: "user" },
    { id: 1, text: "Hello!", sender: "bot" },
    { id: 2, text: "Hi there!", sender: "user" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const { ref, isScrollable } = useIsScrollable();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        text: newMessage,
        sender: "user",
      },
    ]);
    setNewMessage("");
  };

  return (
    <div
      className={`${NO_PAN_CLASS_NAME} section-full flex flex-col rounded-lg bg-white shadow-lg`}
    >
      <div
        className={`${isScrollable ? NO_WHEEL_CLASS_NAME : ""} flex-1 overflow-y-auto p-4`}
        ref={ref}
      >
        {messages.map((message) => (
          <div
            key={message.id}
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
