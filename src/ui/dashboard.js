import { CONFIG } from "../config.js";
import { getState } from "../state/appState.js";
import { clearElement, createElement } from "../utils/dom.js";
import { animateNumber, formatDate, formatNumber } from "../utils/formatters.js";
import { createLineChart, destroyChartGroup } from "./charts.js";

let track;
let previousButton;
let nextButton;
let totalSlides = 0;
let initialized = false;

function labels(language) {
  return language === "en"
    ? { role: "Role", discord: "Discord", group: "Group", ccu: "CCU", unavailable: "Studio data is currently unavailable" }
    : { role: "Роль", discord: "Discord", group: "Группа", ccu: "CCU", unavailable: "Данные студий сейчас недоступны" };
}

function updateTrack() {
  if (!track) return;
  const dashboard = getState().dashboard;
  if (totalSlides === 0) dashboard.currentSlide = 0;
  else dashboard.currentSlide = Math.min(dashboard.currentSlide, totalSlides - 1);
  track.style.transform = `translateX(-${dashboard.currentSlide * 100}%)`;
}

function next() {
  if (!totalSlides) return;
  const dashboard = getState().dashboard;
  dashboard.currentSlide = (dashboard.currentSlide + 1) % totalSlides;
  updateTrack();
}

function previous() {
  if (!totalSlides) return;
  const dashboard = getState().dashboard;
  dashboard.currentSlide = (dashboard.currentSlide - 1 + totalSlides) % totalSlides;
  updateTrack();
}

export function initializeDashboard() {
  if (initialized) return;
  track = document.getElementById("dashTrack");
  previousButton = document.getElementById("dashPrev");
  nextButton = document.getElementById("dashNext");
  previousButton?.addEventListener("click", previous);
  nextButton?.addEventListener("click", next);
  initialized = true;
}

function statItem(label, value, key) {
  return createElement("div", { className: "stat-item" }, [
    createElement("span", { className: "stat-label", text: `${label}:`, dataset: { dashboardLabel: key } }),
    createElement("span", { className: "stat-value", text: value }),
  ]);
}

export function renderDashboardSlides(studios, language) {
  initializeDashboard();
  if (!track) return;
  const text = labels(language);
  destroyChartGroup("dashboard:");
  clearElement(track);
  totalSlides = 0;

  const entries = Object.entries(studios || {});
  if (entries.length === 0) {
    track.append(createElement("p", { className: "dash-empty", text: text.unavailable }));
    updateTrack();
    return;
  }

  for (const [studioId, studio] of entries) {
    const canvasId = `dash-chart-${studioId.replace(/\s+/g, "-").toLowerCase()}`;
    const canvas = createElement("canvas", { attrs: { id: canvasId } });
    const currentCcu = studio.ccuHistory.at(-1) || 0;
    const statsPanel = createElement("div", { className: "stats-panel" }, [
      statItem(text.role, studio.role || "—", "role"),
      statItem(text.discord, studio.discord ? formatNumber(studio.discord, language) : "—", "discord"),
      statItem(text.group, studio.group ? formatNumber(studio.group, language) : "—", "group"),
      statItem(text.ccu, formatNumber(currentCcu, language), "ccu"),
    ]);
    const grid = createElement("div", { className: "dashboard-grid" }, [createElement("div", { className: "chart-container" }, [canvas]), statsPanel]);
    track.append(createElement("div", { className: "dash-slide" }, [createElement("div", { className: "dash-title", text: studio.name }), grid]));
    if (studio.ccuHistory.length) createLineChart(`dashboard:${studioId}`, canvas, studio.ccuHistory, `${studio.name} - CCU History`);
    totalSlides += 1;
  }
  updateTrack();
}

export function updateDashboardSummary(stats, language, unavailable = false) {
  const games = Object.values(stats?.games || {});
  const totalVisits = games.reduce((sum, game) => sum + game.visits, 0);
  const activePlayers = games.reduce((sum, game) => sum + game.playing, 0);
  const values = [
    ["dashTotalGames", games.length],
    ["dashTotalVisits", totalVisits],
    ["dashActivePlayers", activePlayers],
  ];
  for (const [id, value] of values) {
    const element = document.getElementById(id);
    if (unavailable) {
      if (element) element.textContent = "—";
    } else {
      animateNumber(element, value, language, CONFIG.dashboard.numberAnimationDuration);
    }
  }

  const date = formatDate(stats?.updatedAt, language, { dateStyle: "medium" });
  const updated = document.getElementById("dashLastUpdate");
  if (updated) updated.textContent = unavailable ? "—" : date;
  const status = document.getElementById("dashboardStatus");
  if (!status) return;
  if (unavailable) status.textContent = language === "en" ? "Statistics currently unavailable" : "Статистика сейчас недоступна";
  else {
    const fullDate = formatDate(stats?.updatedAt, language, { dateStyle: "medium", timeStyle: "short" });
    status.textContent = fullDate === "—"
      ? (language === "en" ? "Data loaded; update time unavailable" : "Данные загружены, время обновления неизвестно")
      : `${language === "en" ? "Updated" : "Обновлено"}: ${fullDate}`;
  }
}

export function updateDashboardLanguage(language) {
  const text = labels(language);
  document.querySelectorAll("[data-dashboard-label]").forEach((element) => {
    const key = element.dataset.dashboardLabel;
    if (text[key]) element.textContent = `${text[key]}:`;
  });
  const { robloxStats, errors } = getState();
  updateDashboardSummary(robloxStats, language, Boolean(errors.robloxStats));
}

export function cleanupDashboard() {
  previousButton?.removeEventListener("click", previous);
  nextButton?.removeEventListener("click", next);
  destroyChartGroup("dashboard:");
  initialized = false;
}
