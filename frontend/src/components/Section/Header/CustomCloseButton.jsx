import { IconButton } from "components/Utils/atoms/buttons/IconButton";

// absolute top-1 right-1
export function CustomCloseButton({ onClick, ...props }) {
  // const twClasses =
  return (
    <IconButton
      {...props}
      icon={<i className="gg-close" />}
      color="text-setta-600 hover:text-white"
      bg="bg-transparent hover:bg-red-500"
      size="min-w-4 h-4"
      padding="p-0"
      // twClasses={twClasses}
      onClick={onClick}
    />
  );
  // return <button onClick={onClick} className="gg-close" />;
}
