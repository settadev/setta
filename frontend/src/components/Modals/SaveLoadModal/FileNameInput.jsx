export function FileNameInput({ value, placeholder, onChange }) {
  return (
    <input
      className="w-full flex-grow cursor-auto border-b border-solid border-setta-300 bg-transparent py-1 text-setta-500 placeholder-setta-200 outline-0 [border-width:0_0_1px_0] focus-visible:border-blue-300 dark:border-setta-600 dark:text-setta-200 dark:placeholder-setta-600"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
