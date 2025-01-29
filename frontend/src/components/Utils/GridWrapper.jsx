export function GridWrapper({
  gridStyles = "",
  flexStyles = "",
  flexFormWrap = false,
  children,
  ...props
}) {
  return (
    <StandardGrid
      gridStyles={gridStyles}
      flexFormWrap={flexFormWrap}
      {...props}
    >
      {/* <FlexForm flexStyles={flexStyles}  {...props}> */}
      {children}
      {/* </FlexForm> */}
    </StandardGrid>
  );
}

function StandardGrid({
  gridStyles,
  flexFormWrap = false,
  flexStyles,
  children,
}) {
  return (
    <article
      className={`grid-col-[1fr] grid-row-[1fr] col-start-1 col-end-2 row-start-2 row-end-3 grid h-full min-h-0 min-w-0 flex-1 overflow-hidden  ${gridStyles} ${
        flexFormWrap && `flex-col items-center justify-center ${flexStyles}`
      }`}
    >
      {children}
    </article>
  );
}

// function FlexForm({ flexFormWrap = false, flexStyles, children }) {
//   if (flexFormWrap) {
//     return (
//       <div
//         className={`flex min-h-[200px] flex-col items-center justify-center ${flexStyles}`}
//       >
//         {children}
//       </div>
//     );
//   } else {
//     return <>{children}</>;
//   }
// }
