export const CONFIG = Object.freeze({
  paths: Object.freeze({
    robloxStats: "./data/roblox-stats.json",
    studios: "./data/studios.json",
    studioStats: "./data/studio-stats.json",
  }),
  language: Object.freeze({
    storageKey: "lang",
    supported: Object.freeze(["ru", "en"]),
    default: "ru",
  }),
  refreshInterval: 5 * 60 * 1000,
  dashboard: Object.freeze({ numberAnimationDuration: 450 }),
  discordUsername: "scyfchik",
});
