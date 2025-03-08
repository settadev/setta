import { IoAlertCircleSharp } from "react-icons/io5";
import { VscSave } from "react-icons/vsc";
import { useNotification } from "state/definitions";

export function Notification() {
  const message = useNotification((x) => x.message);

  return (
    message && (
      <div className="flex items-center gap-0.5 transition-all">
        {message === "Saved!" ? (
          <VscSave className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
        ) : (
          <IoAlertCircleSharp className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
        )}
        <p className="ml-2 hidden self-center text-xs text-setta-500 dark:text-setta-100 md:inline-block">
          {message}
        </p>
      </div>
    )
  );
}
