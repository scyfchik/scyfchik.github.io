import { contacts } from "../data/contacts.js";
import { CONFIG } from "../config.js";
import { copyText } from "../utils/browser.js";
import { clearElement, createElement, localize } from "../utils/dom.js";

let toastTimer;
let initialized = false;

function showToast(message) {
  const toast = document.getElementById("copyToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function handleCopy() {
  const language = document.documentElement.lang === "en" ? "en" : "ru";
  try {
    await copyText(CONFIG.discordUsername);
    showToast(language === "en" ? "Discord username copied" : "Discord username скопирован");
  } catch (_) {
    showToast(language === "en" ? "Could not copy username" : "Не удалось скопировать username");
  }
}

export function renderContacts(language) {
  const root = document.getElementById("contactsGrid");
  if (!root) return;
  clearElement(root);
  for (const contact of contacts) {
    const tag = contact.type === "copy" ? "button" : "a";
    const attrs = contact.type === "copy"
      ? { type: "button" }
      : { href: contact.url, target: "_blank", rel: "noopener noreferrer" };
    const className = contact.type === "copy" ? "contact-card copy-discord" : "contact-card";
    const value = contact.suffix ? `${contact.value} · ${localize(contact.suffix, language)}` : contact.value;
    root.append(createElement(tag, { className, attrs }, [createElement("h3", { text: contact.title }), createElement("p", { text: value })]));
  }
}

export function initializeContact() {
  if (initialized) return;
  document.addEventListener("click", (event) => {
    if (event.target.closest(".copy-discord")) handleCopy();
  });
  const year = document.getElementById("currentYear");
  if (year) year.textContent = String(new Date().getFullYear());
  initialized = true;
}

export function cleanupContact() {
  window.clearTimeout(toastTimer);
}
