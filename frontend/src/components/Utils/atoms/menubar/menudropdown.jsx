import * as Menubar from "@radix-ui/react-menubar";

export function MenuDropdown({
  trigger,
  triggerClassName,
  contentClassName,
  contentAlign,
  contentSideOffset,
  contentAlignOffset,
  tabIndex,
  children,
  triggerOnKeyDown,
}) {
  return (
    <Menubar.Menu>
      <Menubar.Trigger
        className={triggerClassName}
        tabIndex={tabIndex}
        onKeyDown={triggerOnKeyDown}
      >
        {trigger}
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          className={contentClassName}
          align={contentAlign}
          sideOffset={contentSideOffset}
          alignOffset={contentAlignOffset}
        >
          {children}
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  );
}

export function NavbarMenuDropdown({ children, trigger, tabIndex }) {
  return (
    <MenuDropdown
      triggerClassName="nodrag flex cursor-pointer select-none items-center justify-between gap-1 rounded-md py-1 px-2 text-xs font-semibold leading-none text-setta-700 outline-none transition-colors duration-150 hover:bg-setta-100 focus-visible:ring-2 dark:text-setta-200 dark:hover:bg-setta-800"
      contentClassName="z-20 min-w-[200px] rounded-md border border-solid border-setta-100 bg-white p-1 shadow-xl transition-all will-change-[transform,opacity] dark:border-setta-700/50  dark:bg-setta-850"
      contentAlign="start"
      contentSideOffset={5}
      contentAlignOffset={-3}
      trigger={trigger}
      tabIndex={tabIndex}
    >
      {children}
    </MenuDropdown>
  );
}
