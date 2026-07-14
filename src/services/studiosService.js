import { CONFIG } from "../config.js";

async function fetchJson(path, label) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error(`${label}: invalid JSON structure`);
  return payload;
}

function normalizeRoles(roles) {
  const ru = Array.isArray(roles?.ru) ? roles.ru.map(String) : [];
  const en = Array.isArray(roles?.en) ? roles.en.map(String) : ru;
  return { ru, en };
}

function normalizeGame(game) {
  return {
    universeId: Number(game?.universeId) || null,
    rootPlaceId: Number(game?.rootPlaceId) || null,
    name: typeof game?.name === "string" ? game.name : "Roblox experience",
    description: typeof game?.description === "string" ? game.description : null,
    url: typeof game?.url === "string" ? game.url : null,
    playing: Number.isFinite(Number(game?.playing)) ? Number(game.playing) : null,
    visits: Number.isFinite(Number(game?.visits)) ? Number(game.visits) : null,
    maxPlayers: Number.isFinite(Number(game?.maxPlayers)) ? Number(game.maxPlayers) : null,
    created: game?.created ?? null,
    updated: game?.updated ?? null,
    image: typeof game?.image === "string" ? game.image : null,
    isPublic: game?.isPublic !== false,
  };
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((point) => point && typeof point.timestamp === "string")
    .map((point) => ({ timestamp: point.timestamp, playing: Number(point.playing) || 0, visits: Number(point.visits) || 0 }))
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function fetchStudios() {
  try {
    const config = await fetchJson(CONFIG.paths.studios, "studios.json");
    if (!Array.isArray(config.studios)) throw new Error("studios.json: expected studios array");

    let generated = { studios: {} };
    try {
      generated = await fetchJson(CONFIG.paths.studioStats, "studio-stats.json");
      if (!generated.studios || typeof generated.studios !== "object" || Array.isArray(generated.studios)) generated = { studios: {} };
    } catch (_) {
      generated = { studios: {} };
    }

    return Object.fromEntries(config.studios.map((studio) => {
      const id = String(studio.id);
      const stats = generated.studios[id] || {};
      const roles = normalizeRoles(studio.roles);
      const history = normalizeHistory(stats.history);
      const games = Array.isArray(stats.games) ? stats.games.map(normalizeGame).filter((game) => game.universeId) : [];
      return [id, {
        id,
        name: String(studio.name || id),
        groupId: Number(studio.groupId) || null,
        groupUrl: typeof studio.groupUrl === "string" ? studio.groupUrl : null,
        roles,
        status: ["ok", "partial", "unavailable"].includes(stats.status) ? stats.status : "unavailable",
        gameCount: Number(stats.gameCount) || games.length,
        totalPlaying: Number(stats.totalPlaying) || 0,
        totalVisits: Number(stats.totalVisits) || 0,
        updatedAt: stats.updatedAt ?? null,
        games,
        history,
        role: roles.ru.join(", "),
        discord: 0,
        group: 0,
        ccuHistory: history.map((point) => point.playing),
      }];
    }));
  } catch (error) {
    throw new Error(`Не удалось загрузить данные студий: ${error.message}`, { cause: error });
  }
}
