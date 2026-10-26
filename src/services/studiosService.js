import { CONFIG } from "../config.js";

async function fetchJson(path, label) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  return response.json();
}

function normalizeRoles(roles) {
  const ru = Array.isArray(roles?.ru) ? roles.ru.map(String) : [];
  const en = Array.isArray(roles?.en) ? roles.en.map(String) : ru;
  return { ru, en };
}

function normalizeGame(game) {
  return {
    universeId: Number(game?.universeId) || null,
    name: typeof game?.name === "string" ? game.name : "Roblox experience",
    url: typeof game?.url === "string" ? game.url : null,
    image: typeof game?.image === "string" ? game.image : null,
  };
}

export async function fetchStudios() {
  const config = await fetchJson(CONFIG.paths.studios, "studios.json");
  if (!Array.isArray(config.studios)) throw new Error("studios.json: expected studios array");

  // studios.json is hand-written and always present; studio-stats.json is generated and may lag
  // behind it, so studio cards still render (without games) when the generated file is missing.
  const generated = await fetchJson(CONFIG.paths.studioStats, "studio-stats.json").catch(() => null);
  const generatedStudios = generated?.studios ?? {};

  return Object.fromEntries(config.studios.map((studio) => {
    const id = String(studio.id);
    const stats = generatedStudios[id] || {};
    return [id, {
      id,
      name: String(studio.name || id),
      groupUrl: typeof studio.groupUrl === "string" ? studio.groupUrl : null,
      roles: normalizeRoles(studio.roles),
      contribution: studio.contribution ?? { ru: "", en: "" },
      status: ["ok", "partial", "unavailable"].includes(stats.status) ? stats.status : "unavailable",
      games: Array.isArray(stats.games) ? stats.games.map(normalizeGame).filter((game) => game.universeId) : [],
    }];
  }));
}
