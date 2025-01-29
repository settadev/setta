import * as Switch from "@radix-ui/react-switch";

export function Toggle(props) {
  const {
    twRootClasses = "",
    twThumbClasses = "",
    icon,
    disableBg = false,
    height,
    width,
    children,
    ...theRest
  } = props;

  const rootClasses = `items-center p-[0.2rem] w-7 min-w-7 ${height ? height : "h-2.5"} bg-setta-400 dark:bg-setta-600 rounded-full relative inline-flex cursor-pointer [-webkit-tap-highlight-color:rgba(0,_0,_0,_0)] focus-visible:shadow-black data-[state='checked']:bg-blue-500 dark:data-[state='checked']:bg-blue-700 focus-visible:ring-2 ${twRootClasses} disabled:pointer-events-none`;

  const thumbClasses = `block ${width ? width : "w-2.5"}  ${height ? height : "h-2.5"} ${
    !disableBg && "bg-white dark:bg-setta-800"
  } rounded-full transition-all will-change-transform data-[state='checked']:translate-x-4 ${twThumbClasses}`;

  return (
    <Switch.Root className={rootClasses} {...theRest}>
      <Switch.Thumb className={thumbClasses}>{icon}</Switch.Thumb>
    </Switch.Root>
  );
}
