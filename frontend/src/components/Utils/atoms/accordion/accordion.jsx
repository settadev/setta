import * as Accordion from "@radix-ui/react-accordion";
import React from "react";
import { BiChevronDown } from "react-icons/bi";

export function StandardAccordion({
  rootStyles = "",
  itemStyles = "",
  triggerStyles = "",
  contentStyles = "",
  headerStyles = "",
  trigger,
  children,
  heading,
  value,
  defaultValue = value,
  type = "single",
  open = "",
  asChild = false,
  internalWrapper = true,
}) {
  return (
    <Accordion.Root
      className={rootStyles}
      type={type}
      defaultValue={defaultValue}
      collapsible
      data-state={open}
      asChild={asChild}
    >
      <AccordionItem itemStyles={itemStyles} value={value}>
        <AccordionTrigger
          triggerStyles={triggerStyles}
          trigger={trigger}
          headerStyles={headerStyles}
        >
          {heading}
        </AccordionTrigger>
        <AccordionContent
          contentStyles={contentStyles}
          internalWrapper={internalWrapper}
        >
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion.Root>
  );
}

const AccordionItem = React.forwardRef(
  ({ children, itemStyles, ...props }, forwardedRef) => (
    <Accordion.Item className={itemStyles} {...props} ref={forwardedRef}>
      {children}
    </Accordion.Item>
  ),
);

const AccordionTrigger = React.forwardRef(
  (
    { children, headerStyles, trigger, triggerStyles, ...props },
    forwardedRef,
  ) => (
    <Accordion.Header className={headerStyles}>
      <Accordion.Trigger
        className={`group ${triggerStyles}`}
        {...props}
        ref={forwardedRef}
      >
        {/* {trigger} */}
        {children}
        <BiChevronDown className="ease-[cubic-bezier(0.87, 0, 0.13, 1)] transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </Accordion.Trigger>
    </Accordion.Header>
  ),
);

const AccordionContent = React.forwardRef(
  ({ children, contentStyles, internalWrapper, ...props }, forwardedRef) =>
    internalWrapper ? (
      <Accordion.Content
        className={contentStyles}
        {...props}
        ref={forwardedRef}
      >
        <div className="overflow-y-auto px-5 py-4 ">{children}</div>
      </Accordion.Content>
    ) : (
      <Accordion.Content
        className={contentStyles}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </Accordion.Content>
    ),
);
