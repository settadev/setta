import { useEffect, useState } from "react";

// Creates a no-op hook for production
const createNoopHook = () => () => false;

// Creates the actual development hook
const createDevHook = () => {
  return () => {
    const [isHotReload, setIsHotReload] = useState(false);

    useEffect(() => {
      if (import.meta.hot) {
        import.meta.hot.on("vite:beforeUpdate", () => {
          setIsHotReload(true);
          setTimeout(() => setIsHotReload(false), 1000);
        });
      }

      return () => {
        setIsHotReload(false);
      };
    }, []);

    return isHotReload;
  };
};

// Use build-time environment check to determine which hook to use
export const useHotReload = import.meta.env.DEV
  ? createDevHook()
  : createNoopHook();
