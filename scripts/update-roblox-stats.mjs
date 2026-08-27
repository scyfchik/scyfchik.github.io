import fs from "fs/promises";
import { qaProjects } from "../src/data/qaProjects.js";
import { communityProjects } from "../src/data/communityProjects.js";

const PATHS = Object.freeze({
  qaStats: "data/roblox-stats.json",
  studios: "data/studios.json",
  studioStats: "data/studio-stats.json",
});
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 4;
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 150;
const HISTORY_LIMIT = 60;
const USER_AGENT = "lunyxzz-portfolio-stats/2.0 (+GitHub Actions)";

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readJson(path, fallback) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw new Error(`Cannot read ${path}: ${error.message}`, { cause: error });
  }
}

async function writeJson(path, value) {
  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchJson(url, label = url) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(`${label}: ${error.name === "AbortError" ? "request timeout" : error.message}`, { cause: error });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < MAX_ATTEMPTS) {
        await sleep(400 * (2 ** (attempt - 1)));
        continue;
      }
      throw new Error(`${label}: HTTP ${response.status}`);
    }

    const raw = await response.text();
    if (!raw.trim()) throw new Error(`${label}: empty response`);
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`${label}: invalid JSON`, { cause: error });
    }
  }
  throw new Error(`${label}: retry limit reached`);
}

function chunks(values, size = BATCH_SIZE) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function getUniverseId(placeId) {
  const payload = await fetchJson(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, `Universe for place ${placeId}`);
  const universeId = Number(payload?.universeId);
  if (!Number.isSafeInteger(universeId) || universeId <= 0) throw new Error(`Universe for place ${placeId}: invalid universeId`);
  return universeId;
}

async function getGameDetails(universeIds) {
  const details = new Map();
  const failed = new Set();
  for (const batch of chunks(universeIds)) {
    try {
      const payload = await fetchJson(`https://games.roblox.com/v1/games?universeIds=${batch.join(",")}`, "Game details");
      if (!Array.isArray(payload?.data)) throw new Error("Game details: unexpected schema");
      for (const game of payload.data) {
        const id = Number(game?.id);
        if (Number.isSafeInteger(id) && id > 0) details.set(id, game);
      }
      for (const id of batch) if (!details.has(id)) failed.add(id);
    } catch (error) {
      console.error(`Game details batch failed: ${error.message}`);
      batch.forEach((id) => failed.add(id));
    }
    await sleep(BATCH_DELAY_MS);
  }
  return { details, failed };
}

async function getThumbnails(universeIds) {
  const thumbnails = new Map();
  const failed = new Set();
  for (const batch of chunks(universeIds)) {
    const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${batch.join(",")}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;
    try {
      const payload = await fetchJson(url, "Game thumbnails");
      if (!Array.isArray(payload?.data)) throw new Error("Game thumbnails: unexpected schema");
      for (const thumbnail of payload.data) {
        const id = Number(thumbnail?.targetId);
        if (!Number.isSafeInteger(id) || id <= 0) continue;
        const completed = thumbnail.state === "Completed" && typeof thumbnail.imageUrl === "string";
        thumbnails.set(id, completed ? thumbnail.imageUrl : null);
        if (!completed) failed.add(id);
      }
      for (const id of batch) if (!thumbnails.has(id)) failed.add(id);
    } catch (error) {
      console.error(`Thumbnail batch failed: ${error.message}`);
      batch.forEach((id) => failed.add(id));
    }
    await sleep(BATCH_DELAY_MS);
  }
  return { thumbnails, failed };
}

async function updateQaStats(now) {
  const previous = await readJson(PATHS.qaStats, { updatedAt: null, games: {} });
  const projects = [...new Map(
    [...qaProjects, ...communityProjects]
      .filter((project) => /^\d+$/.test(String(project.placeId || "")))
      .map((project) => [String(project.placeId), project]),
  ).values()];
  const resolved = new Map();
  const resolutionFailures = new Set();

  for (const project of projects) {
    const placeId = String(project.placeId);
    try {
      resolved.set(placeId, await getUniverseId(placeId));
    } catch (error) {
      resolutionFailures.add(placeId);
      const previousUniverseId = Number(previous.games?.[placeId]?.universeId);
      if (Number.isSafeInteger(previousUniverseId) && previousUniverseId > 0) resolved.set(placeId, previousUniverseId);
      console.error(`QA ${project.title}: ${error.message}; preserving last successful data when available.`);
    }
  }

  const universeIds = [...new Set(resolved.values())];
  const [{ details, failed: detailFailures }, { thumbnails, failed: thumbnailFailures }] = await Promise.all([getGameDetails(universeIds), getThumbnails(universeIds)]);
  const games = { ...(previous.games || {}) };
  let updatedCount = 0;

  for (const project of projects) {
    const placeId = String(project.placeId);
    const universeId = resolved.get(placeId);
    const game = details.get(universeId);
    if (!game || resolutionFailures.has(placeId)) {
      if (games[placeId]) games[placeId] = { ...games[placeId], status: "unavailable" };
      continue;
    }
    const rootPlaceId = Number(game.rootPlaceId) || Number(placeId);
    games[placeId] = {
      name: game.name ?? project.title,
      placeId: Number(placeId),
      universeId,
      rootPlaceId,
      url: project.url || `https://www.roblox.com/games/${rootPlaceId}`,
      playing: Number(game.playing) || 0,
      visits: Number(game.visits) || 0,
      image: thumbnailFailures.has(universeId) ? (games[placeId]?.image ?? null) : (thumbnails.get(universeId) ?? null),
      status: detailFailures.has(universeId) ? "unavailable" : (thumbnailFailures.has(universeId) ? "partial" : "ok"),
      activeUpdatedAt: now,
      visitsUpdatedAt: now,
      source: "Roblox Games API",
    };
    updatedCount += 1;
  }

  const result = { updatedAt: updatedCount > 0 ? now : previous.updatedAt, games };
  await writeJson(PATHS.qaStats, result);
  return { total: projects.length, updated: updatedCount, result };
}

async function getAllGroupGames(groupId) {
  const games = new Map();
  let cursor = null;
  let page = 0;
  do {
    const query = new URLSearchParams({ accessFilter: "2", limit: "100", sortOrder: "Asc" });
    if (cursor) query.set("cursor", cursor);
    const payload = await fetchJson(`https://games.roblox.com/v2/groups/${groupId}/games?${query}`, `Group ${groupId} games page ${page + 1}`);
    if (!Array.isArray(payload?.data)) throw new Error(`Group ${groupId}: unexpected games schema`);
    for (const game of payload.data) {
      const universeId = Number(game?.id);
      if (!Number.isSafeInteger(universeId) || universeId <= 0) continue;
      if (game?.creator?.type !== "Group" || Number(game.creator.id) !== Number(groupId)) continue;
      games.set(universeId, game);
    }
    cursor = typeof payload.nextPageCursor === "string" && payload.nextPageCursor ? payload.nextPageCursor : null;
    page += 1;
  } while (cursor);
  if (games.size === 0) throw new Error(`Group ${groupId}: no public experiences returned`);
  return { games, pages: page };
}

function normalizeStudioGame(universeId, summary, details, image) {
  const rootPlaceId = Number(details?.rootPlaceId ?? summary?.rootPlace?.id) || null;
  return {
    universeId,
    rootPlaceId,
    name: details?.name ?? summary?.name ?? null,
    description: details?.description ?? summary?.description ?? null,
    url: rootPlaceId ? `https://www.roblox.com/games/${rootPlaceId}` : null,
    playing: Number.isFinite(Number(details?.playing)) ? Number(details.playing) : null,
    visits: Number.isFinite(Number(details?.visits ?? summary?.placeVisits)) ? Number(details?.visits ?? summary.placeVisits) : null,
    maxPlayers: Number.isFinite(Number(details?.maxPlayers)) ? Number(details.maxPlayers) : null,
    created: details?.created ?? summary?.created ?? null,
    updated: details?.updated ?? summary?.updated ?? null,
    image: image ?? null,
    isPublic: true,
  };
}

function updateHistory(previousHistory, snapshot) {
  const history = Array.isArray(previousHistory)
    ? previousHistory.filter((point) => point && typeof point.timestamp === "string").map((point) => ({ timestamp: point.timestamp, playing: Number(point.playing) || 0, visits: Number(point.visits) || 0 }))
    : [];
  const last = history.at(-1);
  if (!last || last.playing !== snapshot.playing || last.visits !== snapshot.visits) history.push(snapshot);
  return history.sort((left, right) => left.timestamp.localeCompare(right.timestamp)).slice(-HISTORY_LIMIT);
}

async function updateStudio(config, previous, now) {
  try {
    const { games: summaries, pages } = await getAllGroupGames(config.groupId);
    const universeIds = [...summaries.keys()];
    const [{ details, failed: detailFailures }, { thumbnails, failed: thumbnailFailures }] = await Promise.all([
      getGameDetails(universeIds),
      getThumbnails(universeIds),
    ]);
    const games = universeIds.map((universeId) => normalizeStudioGame(universeId, summaries.get(universeId), details.get(universeId), thumbnails.get(universeId)));
    const totalPlaying = games.reduce((sum, game) => sum + (Number(game.playing) || 0), 0);
    const totalVisits = games.reduce((sum, game) => sum + (Number(game.visits) || 0), 0);
    const status = detailFailures.size || thumbnailFailures.size ? "partial" : "ok";
    const history = updateHistory(previous?.history, { timestamp: now, playing: totalPlaying, visits: totalVisits });
    return {
      groupId: Number(config.groupId),
      status,
      gameCount: games.length,
      totalPlaying,
      totalVisits,
      updatedAt: now,
      pagesFetched: pages,
      games,
      history,
    };
  } catch (error) {
    console.error(`${config.name}: ${error.message}; preserving last successful studio data.`);
    return {
      ...(previous || { gameCount: 0, totalPlaying: 0, totalVisits: 0, updatedAt: null, games: [], history: [] }),
      groupId: Number(config.groupId),
      status: "unavailable",
      error: error.message,
    };
  }
}

async function updateStudios(now) {
  const config = await readJson(PATHS.studios, null);
  if (!config || !Array.isArray(config.studios)) throw new Error("studios.json: expected a studios array");
  const previous = await readJson(PATHS.studioStats, { updatedAt: null, studios: {} });
  const studios = {};
  for (const studio of config.studios) {
    if (!studio?.id || !Number.isSafeInteger(Number(studio.groupId))) {
      console.error("Skipping invalid studio config entry.");
      continue;
    }
    studios[studio.id] = await updateStudio(studio, previous.studios?.[studio.id], now);
  }
  const result = { updatedAt: now, studios };
  await writeJson(PATHS.studioStats, result);
  return result;
}

async function main() {
  const now = new Date().toISOString();
  const qa = await updateQaStats(now);
  const studioStats = await updateStudios(now);
  const summaries = Object.entries(studioStats.studios).map(([id, studio]) => `${id}: ${studio.status}, ${studio.gameCount} games`).join("; ");
  console.log(`Roblox sync complete. QA: ${qa.updated}/${qa.total} updated. Studios: ${summaries}.`);
}

main().catch((error) => {
  console.error(`Roblox sync failed: ${error.message}`);
  process.exitCode = 1;
});
