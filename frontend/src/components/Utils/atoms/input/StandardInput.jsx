export function StandardInput({ twClasses, ...theRest }) {
  const classes = `nodrag border-0 border-b cursor-auto border-setta-300 dark:border-setta-700 border-solid text-xs dark:text-setta-300 font-code focus-visible:border-blue-400 ${twClasses}`;

  return <input {...theRest} className={classes} />;
}
