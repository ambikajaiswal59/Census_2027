import { apiGet } from "./client.js";

// GET /api/stats/latest  ->  { states_uts, districts, sub_districts, development_blocks, villages, created_at }
export const getLatestStats = (signal) => apiGet("/api/stats/latest", {}, signal);

// Frontend level name -> backend list endpoint
const LEVEL_ENDPOINT = {
  State: "/api/directory/states",
  District: "/api/directory/districts",
  "Sub-District": "/api/directory/sub-districts",
  "Development Block": "/api/directory/blocks",
  Village: "/api/directory/villages",
};
console.log("LEVEL_ENDPOINT", LEVEL_ENDPOINT);
// These levels are big, so the backend paginates them (limit/offset)
export const PAGED_LEVELS = new Set(["District", "Sub-District", "Development Block", "Village"]);
export const PAGE_SIZE = 100;

// params: { limit, offset, q, code }
export const fetchDirectory = (level, params, signal) =>
  apiGet(LEVEL_ENDPOINT[level], params, signal);
