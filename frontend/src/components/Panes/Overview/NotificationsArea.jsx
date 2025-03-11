import C from "constants/constants.json";
import { IoMdAlert } from "react-icons/io";
import { IoAlertCircleSharp, IoCheckmarkCircle, IoClose, IoInformationCircle, IoWarning } from "react-icons/io5";
import { VscSave } from "react-icons/vsc";

export function NotificationsArea() {
  return (
    <div className="flex w-full flex-col gap-4 overflow-y-auto">
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
    </div>
  );
}

function NotificationItem() {
  return (
    <section className="group/notifications overflow-clip  rounded-md px-3 py-2 transition-all hover:bg-white hover:shadow-md hover:dark:bg-setta-800 hover:dark:shadow-lg">
      <header className="mb-2 flex items-center justify-between gap-2">
        <i className="text-red-500">
          <IoMdAlert />
        </i>
        <h3 className="truncate font-semibold tracking-tight text-setta-600 group-hover/notifications:text-setta-900 dark:text-setta-300 group-hover/notifications:dark:text-setta-100">
          Alert! There's something going on here I think.
        </h3>
        <button className="cursor-pointer text-setta-500 hover:text-blue-600">
          <IoClose size={15} />
        </button>
      </header>

      <p className="text-xs text-setta-600 group-hover/notifications:text-setta-900 dark:text-setta-100 group-hover/notifications:dark:text-white">
        The program has blue screened and you must reset universe.exe or
        alternatively, re-orient 3 of the closest pulsars towards COORDINATES
        HERE. Thank you.
      </p>
    </section>
  );
}

export function getNotificationIcon(type) {
  switch (type) {
    case C.NOTIFICATION_TYPE_SUCCESS:
      return (
        <IoCheckmarkCircle className="ml-2 h-3 w-3 text-green-500 dark:text-green-400 md:ml-4" />
      );
    case C.NOTIFICATION_TYPE_ERROR:
      return (
        <IoAlertCircleSharp className="ml-2 h-3 w-3 text-red-500 dark:text-red-400 md:ml-4" />
      );
    case C.NOTIFICATION_TYPE_WARNING:
      return (
        <IoWarning className="ml-2 h-3 w-3 text-yellow-500 dark:text-yellow-400 md:ml-4" />
      );
    case C.NOTIFICATION_TYPE_INFO:
      return (
        <IoInformationCircle className="ml-2 h-3 w-3 text-blue-500 dark:text-blue-400 md:ml-4" />
      );
    case C.NOTIFICATION_TYPE_SAVE:
      return (
        <VscSave className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
      );
    default:
      return (
        <IoInformationCircle className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
      );
  }
}
