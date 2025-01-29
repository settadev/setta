import React from "react";

export const StandardSearch = React.forwardRef(
  (
    {
      placeholder = "Search",
      twClasses = "",
      outerClasses = "",
      noLeftElement = false,
      leftElement = false,
      leftElementStyles,
      rightElement = false,
      inputStyles = false,
      onChange,
      onFormSubmit,
      ...props
    },
    ref,
  ) => {
    const classes = ` flex-grow outline-0 cursor-auto min-w-0 placeholder-setta-300 dark:placeholder-setta-700 ${twClasses}`;

    return (
      <MaybeForm onFormSubmit={onFormSubmit} outerClasses={outerClasses}>
        {!noLeftElement && (
          <div
            className={`absolute left-0 grid select-none place-items-center ${leftElementStyles}`}
          >
            {leftElement || (
              <i className="gg-sort-az ml-[.4rem] !scale-75 text-setta-300 dark:text-setta-600" />
            )}
          </div>
        )}
        <input
          className={inputStyles || classes}
          placeholder={placeholder}
          {...props}
          ref={ref}
          tabIndex="0"
          onChange={onChange}
        />
        <div
          className={`absolute right-0 grid select-none place-items-center ${leftElementStyles}`}
        >
          {rightElement}
        </div>
      </MaybeForm>
    );
  },
);

function MaybeForm({ onFormSubmit, children, outerClasses }) {
  const styles = `flex min-w-0 mx-[2px] items-center relative nodrag dark:text-setta-200 ${outerClasses}`;
  return onFormSubmit ? (
    <form className={styles} onSubmit={onFormSubmit}>
      {children}
    </form>
  ) : (
    <search className={styles}>{children}</search>
  );
}
