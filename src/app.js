import { CONFIG } from "./config.js";
import { getState, setResourceState } from "./state/appState.js";
import { fetchRobloxStats } from "./services/robloxStatsService.js";
import { fetchStudios } from "./services/studiosService.js";
import { renderHero, updateHeroReach } from "./ui/hero.js";
import { renderPortfolioSections, updateQAStats } from "./ui/portfolioSections.js";
import { initializeLanguage } from "./ui/language.js";
import { initializeNavigation } from "./ui/navigation.js";
import { renderStudios, updateStudiosLanguage, showStudiosUnavailable } from "./ui/studios.js";
import { renderContacts, initializeContact } from "./ui/contact.js";
import { initializeAnimations } from "./ui/animations.js";

function renderStaticContent(language) {
  renderHero(language);
  renderPortfolioSections(language);
  renderContacts(language);
}

function rerenderLocalizedContent(language) {
  const state = getState();
  renderStaticContent(language);
  updateHeroReach(state.robloxStats, language);
  updateQAStats(state.robloxStats, language, Boolean(state.errors.robloxStats));
  updateStudiosLanguage(language);
}

async function loadData() {
  const state = getState();
  const [statsResult, studiosResult] = await Promise.allSettled([fetchRobloxStats(), fetchStudios()]);

  if (statsResult.status === "fulfilled") setResourceState("robloxStats", { data: statsResult.value });
  else setResourceState("robloxStats", { error: statsResult.reason });
  if (studiosResult.status === "fulfilled") setResourceState("studios", { data: studiosResult.value });
  else setResourceState("studios", { error: studiosResult.reason });

  const language = state.currentLanguage;
  updateHeroReach(state.robloxStats, language);
  updateQAStats(state.robloxStats, language, Boolean(state.errors.robloxStats));
  renderStudios(state.studios, language);
  if (state.errors.studios) showStudiosUnavailable(language);
}

async function bootstrap() {
  const language = initializeLanguage(rerenderLocalizedContent);
  initializeNavigation();
  renderStaticContent(language);
  initializeContact();
  initializeAnimations();
  await loadData();
  window.setInterval(loadData, CONFIG.refreshInterval);
}

bootstrap().catch((error) => {
  const language = getState().currentLanguage;
  updateQAStats(null, language, true);
  showStudiosUnavailable(language);
  console.error("Portfolio initialization failed:", error);
});
