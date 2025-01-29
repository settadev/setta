import * as Menubar from "@radix-ui/react-menubar";

export function MenuItem({ children, shortcut, onClick, disabled }) {
  //
  return (
    <Menubar.Item
      disabled={disabled}
      onClick={onClick}
      className="group relative flex h-[25px] cursor-pointer select-none items-center rounded px-[10px] text-xs leading-none outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-setta-500 data-[state=open]:bg-setta-100 data-[disabled]:text-setta-400 data-[highlighted]:text-setta-500 data-[state=open]:text-setta-800 dark:data-[highlighted]:bg-setta-900 dark:data-[state=open]:bg-setta-700 dark:data-[state=open]:text-setta-100"
    >
      <div className="flex items-center gap-2 text-setta-800 group-data-[highlighted]:text-white dark:text-setta-200 dark:group-data-[highlighted]:text-white">
        {children}
      </div>
      <div className="ml-auto pl-5 tracking-tight text-setta-400 group-data-[disabled]:text-setta-300 group-data-[highlighted]:text-white dark:group-data-[disabled]:text-setta-500 dark:group-data-[highlighted]:text-setta-100">
        {shortcut}
      </div>
    </Menubar.Item>
  );
}
