import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Item({ children, onClick, onMouseOver, disabled = false }) {
  return (
    <DropdownMenu.Item
      className="flex cursor-pointer flex-row items-center gap-2 rounded-md px-2 py-[0.15rem] font-sans text-xs font-semibold text-setta-700 outline-none hover:bg-setta-100 hover:ring-0 focus-visible:ring-1 data-[disabled]:pointer-events-none group-data-[disabled]:text-setta-300 dark:text-setta-100 dark:hover:bg-setta-700 group-data-[disabled]:dark:text-setta-700"
      onClick={onClick}
      onMouseOver={onMouseOver}
      disabled={disabled}
    >
      {children}
    </DropdownMenu.Item>
  );
}
