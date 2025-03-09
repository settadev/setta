import { IoMdAlert } from "react-icons/io";
import { IoClose } from "react-icons/io5";

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
