export const GridContainer = ({ children, overflow = "overflow-hidden" }) => {
  return (
    <section
      className={`grid h-full w-screen grid-cols-[1fr] grid-rows-[min-content] ${overflow}`}
    >
      {children}
    </section>
  );
};
