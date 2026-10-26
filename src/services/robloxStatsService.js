import { CONFIG } from "../config.js";

function normalizeGame(game, key) {
  return {
    ...game,
    placeId: String(game?.placeId ?? key),
    playing: Number(game?.playing) || 0,
    visits: Number(game?.visits) || 0,
    image: typeof game?.image === "string" ? game.image : null,
    status: ["ok", "partial", "unavailable"].includes(game?.status) ? game.status : "ok",
  };
}

// "no-cache" revalidates with the server (304 when unchanged) instead of re-downloading the file every refresh.
export async function fetchRobloxStats() {
  const response = await fetch(CONFIG.paths.robloxStats, { cache: "no-cache" });
  if (!response.ok) throw new Error(`roblox-stats.json: HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload?.games) throw new Error("roblox-stats.json: missing games");
  return {
    updatedAt: payload.updatedAt ?? null,
    games: Object.fromEntries(Object.entries(payload.games).map(([key, game]) => [key, normalizeGame(game, key)])),
  };
}
