// Kept so existing imports (`from "../api/census.js"`) keep working.
// The calls themselves now live in api.js.
export {
  getLatestStats,
  fetchDirectory,
  searchDirectory,
  PAGED_LEVELS,
  PAGE_SIZE,
} from "../api.js";
