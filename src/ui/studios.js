import { clearElement, createElement, localize } from "../utils/dom.js";

const FEATURED_GAME_LIMIT = 3;
let currentStudios = null;

function labels(language) {
  return language === "en"
    ? {
        gamesTitle: "Studio games",
        showMore: (count) => `Show ${count} more`,
        unavailable: "Studio catalogue temporarily unavailable",
        group: "Open group",
        openGame: "Open game",
      }
    : {
        gamesTitle: "Игры студии",
        showMore: (count) => `Показать ещё ${count}`,
        unavailable: "Каталог студии временно недоступен",
        group: "Открыть группу",
        openGame: "Открыть игру",
      };
}

function gameThumbnail(game) {
  const fallback = createElement("div", { className: "studio-game-thumb studio-game-thumb-fallback", text: game.name.slice(0, 1).toUpperCase(), attrs: { "aria-hidden": "true" } });
  if (!game.image) return fallback;
  const image = createElement("img", { className: "studio-game-thumb", attrs: { src: game.image, alt: "", loading: "lazy" } });
  image.addEventListener("error", () => image.replaceWith(fallback), { once: true });
  return image;
}

function gameItem(game, language, text) {
  const content = createElement("div", { className: "studio-game-info" }, [
    createElement("strong", { text: game.name }),
    createElement("span", { text: text.openGame }),
  ]);
  const attrs = game.url
    ? { href: game.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `${text.openGame}: ${game.name}` }
    : { "aria-disabled": "true" };
  return createElement(game.url ? "a" : "div", { className: "studio-game-item", attrs }, [gameThumbnail(game), content]);
}

function gamesSection(studio, language, text) {
  const section = createElement("div", { className: "studio-games" }, [createElement("h4", { text: text.gamesTitle })]);
  if (!studio.games.length) {
    section.append(createElement("p", { className: "stats-updated stats-unavailable", text: text.unavailable }));
    return section;
  }

  section.append(createElement("div", { className: "studio-games-list" }, studio.games.slice(0, FEATURED_GAME_LIMIT).map((game) => gameItem(game, language, text))));
  const remaining = studio.games.slice(FEATURED_GAME_LIMIT);
  if (remaining.length) {
    const summary = createElement("summary", { text: text.showMore(remaining.length) });
    const details = createElement("details", { className: "studio-games-more" }, [
      summary,
      createElement("div", { className: "studio-games-list" }, remaining.map((game) => gameItem(game, language, text))),
    ]);
    summary.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      details.open = !details.open;
    });
    section.append(details);
  }
  return section;
}

function renderStudioCard(studio, language, text) {
  const card = createElement("article", { className: "card studios-card", dataset: { type: "studio", studio: studio.id } });
  const heading = createElement("div", { className: "studio-heading" }, [
    createElement("h3", { text: studio.name }),
    studio.groupUrl ? createElement("a", { className: "studio-group-link", text: text.group, attrs: { href: studio.groupUrl, target: "_blank", rel: "noopener noreferrer" } }) : null,
  ]);
  const role = createElement("p", { className: "studio-role", text: localize(studio.roles, language).join(", ") || "—" });
  const contribution = createElement("p", { className: "studio-contribution", text: localize(studio.contribution, language) });
  const context = createElement("p", { className: "stats-updated", text: language === "en" ? "Studio catalogue — not a claim of work on every listed game." : "Каталог студии — не список личного участия в каждой игре." });
  card.append(heading, role, contribution, context, gamesSection(studio, language, text));
  card.classList.toggle("loaded", studio.status !== "unavailable");
  return card;
}

export function renderStudios(studios, _robloxStats, language) {
  currentStudios = studios;
  const root = document.getElementById("studiosGrid");
  if (!root) return;

  clearElement(root);
  const text = labels(language);
  for (const studio of Object.values(studios || {})) root.append(renderStudioCard(studio, language, text));
  if (!root.children.length) root.append(createElement("p", { className: "stats-updated stats-unavailable", text: text.unavailable }));
}

export function updateStudioStats(_stats, language) {
  renderStudios(currentStudios, null, language);
}

export function updateStudiosLanguage(language) {
  renderStudios(currentStudios, null, language);
}

export function showStudiosUnavailable(language) {
  const text = labels(language);
  document.querySelectorAll(".studios-card").forEach((card) => {

    const statuses = card.querySelectorAll(".studio-games .stats-unavailable");
    const last = statuses[statuses.length - 1];
    if (last) last.textContent = text.unavailable;
  });
}
