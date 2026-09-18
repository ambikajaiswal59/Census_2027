// Formats a number in Indian digit grouping: 677523 -> "6,77,523"
export function formatIndianNumber(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('en-IN')
}
