import { CONFIG } from "./config.js";
import { getState, setResourceState, setState } from "./state/appState.js";
import { fetchRobloxStats } from "./services/robloxStatsService.js";
import { fetchStudios } from "./services/studiosService.js";
import { renderHero } from "./ui/hero.js";
import { renderPortfolioSections, updateQAStats } from "./ui/portfolioSections.js";
import { initializeLanguage } from "./ui/language.js";
import { initializeNavigation } from "./ui/navigation.js";
import { renderStudios, updateStudiosLanguage, showStudiosUnavailable } from "./ui/studios.js";
import { initializeDashboard, renderDashboardSlides, updateDashboardLanguage, updateDashboardSummary, cleanupDashboard } from "./ui/dashboard.js";
import { renderContacts, initializeContact, cleanupContact } from "./ui/contact.js";
import { initializeAnimations, cleanupAnimations } from "./ui/animations.js";
import { destroyAllCharts } from "./ui/charts.js";

let refreshTimer;

function renderStaticContent(language) {
  renderHero(language);
  renderPortfolioSections(language);
  renderContacts(language);
}

function rerenderLocalizedContent(language) {
  const state = getState();
  renderStaticContent(language);
  updateQAStats(state.robloxStats, language, Boolean(state.errors.robloxStats));
  updateStudiosLanguage(language);
  updateDashboardLanguage(language);
}

async function loadData() {
  const state = getState();
  const [statsResult, studiosResult] = await Promise.allSettled([fetchRobloxStats(), fetchStudios()]);

  if (statsResult.status === "fulfilled") setResourceState("robloxStats", { data: statsResult.value });
  else setResourceState("robloxStats", { error: statsResult.reason });
  if (studiosResult.status === "fulfilled") setResourceState("studios", { data: studiosResult.value });
  else setResourceState("studios", { error: studiosResult.reason });

  const language = state.currentLanguage;
  updateQAStats(state.robloxStats, language, Boolean(state.errors.robloxStats));
  updateDashboardSummary(state.robloxStats, language, Boolean(state.errors.robloxStats));
  renderStudios(state.studios, state.robloxStats, language);
  if (state.errors.studios) showStudiosUnavailable(language);
  renderDashboardSlides(state.studios, language);
}

function startRefreshTimer() {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    loadData().catch(() => {
      const state = getState();
      updateQAStats(state.robloxStats, state.currentLanguage, !state.robloxStats);
    });
  }, CONFIG.refreshInterval);
}

function cleanup() {
  window.clearInterval(refreshTimer);
  refreshTimer = undefined;
  cleanupDashboard();
  cleanupContact();
  cleanupAnimations();
  destroyAllCharts();
}

async function bootstrap() {
  const language = initializeLanguage(rerenderLocalizedContent);
  initializeNavigation();
  renderStaticContent(language);
  initializeDashboard();
  initializeContact();
  initializeAnimations();
  await loadData();
  startRefreshTimer();
  setState({ initialized: true });
  window.addEventListener("beforeunload", cleanup, { once: true });
}

bootstrap().catch((error) => {
  const language = getState().currentLanguage;
  updateDashboardSummary(null, language, true);
  updateQAStats(null, language, true);
  showStudiosUnavailable(language);
  console.error("Portfolio initialization failed:", error);
});
