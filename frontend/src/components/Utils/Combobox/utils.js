export const flattenedItems = (items) =>
  items.reduce((prev, curr) => {
    return [...prev, ...curr.items];
  }, []);
