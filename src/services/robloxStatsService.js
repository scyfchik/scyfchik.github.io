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

export async function fetchRobloxStats() {
  try {
    const response = await fetch(CONFIG.paths.robloxStats, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || !payload.games || typeof payload.games !== "object") {
      throw new Error("Некорректный формат roblox-stats.json");
    }
    return {
      updatedAt: payload.updatedAt ?? null,
      games: Object.fromEntries(Object.entries(payload.games).map(([key, game]) => [String(key), normalizeGame(game, key)])),
    };
  } catch (error) {
    throw new Error(`Не удалось загрузить статистику Roblox: ${error.message}`, { cause: error });
  }
}
