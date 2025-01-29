import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import { useHomePageSearch } from "state/definitions";

export function HomePageSearchBar() {
  const value = useHomePageSearch((x) => x.value);
  return (
    <StandardSearch
      outerClasses="self-center w-[clamp(10rem,_30vw,_15rem)]  ml-4"
      inputStyles="flex-grow cursor-auto overflow-hidden bg-setta-100 dark:bg-setta-950 border-setta-500 hover:bg-white outline-offset-2 focus:bg-white rounded-full text-xs text-setta-900 dark:text-setta-200 focus-visible:outline outline-blue-500 pl-7 py-1 placeholder-setta-300 dark:placeholder-setta-700"
      leftElementStyles="pl-1"
      placeholder="Filter Project Configs"
      value={value}
      onChange={(e) => useHomePageSearch.setState({ value: e.target.value })}
    />
  );
}
