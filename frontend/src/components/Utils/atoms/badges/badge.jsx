export function Badge(props) {
  const {
    twClasses,
    text = "text-xs font-bold",
    padding = "px-1 py-[0.1rem]",
    rounded = "rounded-md",
    children,
  } = props;

  const classes = `inline-block whitespace-nowrap align-middle ${twClasses} ${text} ${padding} ${rounded}`;

  return <span className={classes}>{children}</span>;
}
