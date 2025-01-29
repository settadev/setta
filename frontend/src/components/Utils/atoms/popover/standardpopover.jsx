import * as Popover from "@radix-ui/react-popover";

export function StandardPopover({
  trigger,
  contentClasses,
  children,
  open,
  close = false,
  closeClasses,
  onOpenChange,
  arrowClasses,
}) {
  // TODO: show a close button if closeButton is true

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={contentClasses}>
          {close && (
            <Popover.Close className={closeClasses}>{close}</Popover.Close>
          )}
          <Popover.Arrow
            className={
              arrowClasses
                ? arrowClasses
                : "[fill:rgb(229,_231,_235)] dark:[fill:rgb(51,_65,_85)]"
            }
          />
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
