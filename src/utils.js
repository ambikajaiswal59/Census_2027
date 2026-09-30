// Indian digit grouping: 677523 -> 6,77,523
export const fmt = (n) => (n == null ? "0" : Number(n).toLocaleString("en-IN"));
