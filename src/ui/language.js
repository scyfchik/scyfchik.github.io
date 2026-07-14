import { CONFIG } from "../config.js";
import { getState } from "../state/appState.js";
import { readStorage, writeStorage } from "../utils/browser.js";

let changeHandler = () => {};
let initialized = false;

function normalizeLanguage(language) {
  return CONFIG.language.supported.includes(language) ? language : CONFIG.language.default;
}

export function applyStaticTranslations(language) {
  document.querySelectorAll("[data-ru][data-en]").forEach((element) => {
    const value = element.getAttribute(`data-${language}`);
    if (value !== null) element.textContent = value;
  });
  document.querySelectorAll("[data-aria-ru][data-aria-en]").forEach((element) => {
    const value = element.getAttribute(`data-aria-${language}`);
    if (value) element.setAttribute("aria-label", value);
  });
}

export function setLanguage(language, { persist = true, notify = true } = {}) {
  const nextLanguage = normalizeLanguage(language);
  getState().currentLanguage = nextLanguage;
  document.documentElement.lang = nextLanguage;
  document.getElementById("ruBtn")?.classList.toggle("active", nextLanguage === "ru");
  document.getElementById("enBtn")?.classList.toggle("active", nextLanguage === "en");
  applyStaticTranslations(nextLanguage);
  if (persist) writeStorage(CONFIG.language.storageKey, nextLanguage);
  if (notify) changeHandler(nextLanguage);
}

export function initializeLanguage(onChange) {
  changeHandler = onChange;
  if (!initialized) {
    document.getElementById("ruBtn")?.addEventListener("click", () => setLanguage("ru"));
    document.getElementById("enBtn")?.addEventListener("click", () => setLanguage("en"));
    initialized = true;
  }
  const saved = readStorage(CONFIG.language.storageKey, CONFIG.language.default);
  setLanguage(saved, { persist: false, notify: false });
  return getState().currentLanguage;
}
