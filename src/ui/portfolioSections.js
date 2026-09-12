import { profile } from "../data/profile.js";
import { skillGroups } from "../data/skills.js";
import { qaProjects } from "../data/qaProjects.js";
import { contributionProjects } from "../data/contributionProjects.js";
import { communityProjects } from "../data/communityProjects.js";
import { experienceItems } from "../data/experience.js";
import { clearElement, createElement, localize } from "../utils/dom.js";
import { animateNumber, formatDate } from "../utils/formatters.js";

function getProjectVisits(project, stats) {
  const game = stats?.games?.[project.placeId];
  if (!game) return 0;
  return Number(game.visits) || 0;
}

export function getSortedQAProjects(stats = null) {
  return qaProjects
    .map((project, index) => ({ project, index }))
    .sort((left, right) => (
      getProjectVisits(right.project, stats) - getProjectVisits(left.project, stats)
      || left.index - right.index
    ))
    .map(({ project }) => project);
}

function sortQACards(stats) {
  const root = document.getElementById("qaGrid");
  if (!root) return;
  const cards = new Map([...root.querySelectorAll(".qa-card[data-place-id]")].map((card) => [card.dataset.placeId, card]));
  const sortedCards = getSortedQAProjects(stats).map((project) => cards.get(String(project.placeId))).filter(Boolean);
  const currentCards = [...root.querySelectorAll(".qa-card[data-place-id]")];
  if (sortedCards.length === currentCards.length && sortedCards.every((card, index) => card === currentCards[index])) return;
  root.append(...sortedCards);
}

function renderAbout(language) {
  const root = document.getElementById("aboutBlocks");
  if (!root) return;
  clearElement(root);
  for (const item of profile.about) {
    root.append(createElement("article", {}, [
      createElement("h3", { text: localize(item.title, language) }),
      createElement("p", { text: localize(item.text, language) }),
    ]));
  }
}

function renderSkills() {
  const root = document.getElementById("skillsGroups");
  if (!root) return;
  clearElement(root);
  for (const group of skillGroups) {
    const tags = createElement("div", { className: "tags" }, group.tags.map((tag) => createElement("span", { text: tag })));
    root.append(createElement("article", { className: "skill-group" }, [createElement("h3", { text: group.title }), tags]));
  }
}

function createProjectPlaceholder(project) {
  return createElement("div", { className: "project-placeholder", attrs: { "aria-hidden": "true" } }, [
    createElement("strong", { text: project.mark }),
    createElement("small", { text: project.kind }),
  ]);
}

function createStats(language) {
  const stats = createElement("div", { className: "roblox-stats", attrs: { "aria-label": "Roblox statistics" } });
  const entries = [{ key: "playing", ru: "Онлайн", en: "Active" }, { key: "visits", ru: "Визиты", en: "Visits" }];
  for (const item of entries) {
    stats.append(createElement("div", { className: "stat-pill" }, [
      createElement("span", { className: "stat-value", text: "—", dataset: { stat: item.key } }),
      createElement("span", { className: "stat-label", text: item[language] }),
    ]));
  }
  return stats;
}

function renderQA(language) {
  const root = document.getElementById("qaGrid");
  if (!root) return;
  clearElement(root);
  for (const project of getSortedQAProjects()) {
    const card = createElement("a", {
      className: "card project-card qa-card",
      attrs: { href: project.url, target: "_blank", rel: "noopener noreferrer" },
      dataset: project.placeId ? { placeId: project.placeId } : {},
    });
    if (project.image) card.append(createElement("img", { attrs: { src: project.image, alt: project.alt, loading: "lazy" } }));
    else card.append(createProjectPlaceholder(project));
    card.append(
      createElement("div", { className: "project-heading" }, [createElement("h3", { text: project.title }), createElement("span", { text: "↗", attrs: { "aria-hidden": "true" } })]),
      createElement("p", { className: "project-role", text: project.role }),
      createElement("p", { className: "project-description", text: localize(project.description, language) }),
      createElement("div", { className: "testing-types", text: project.testingTypes }),
    );
    if (project.placeId) {
      card.append(createStats(language), createElement("div", { className: "stats-updated", text: language === "en" ? "Loading stats..." : "Статистика загружается..." }));
    } else {
      card.append(createElement("div", { className: "stats-updated stats-unavailable", text: language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна" }));
    }
    card.append(createElement("span", { text: language === "en" ? "Roblox project" : "Roblox-проект" }));
    root.append(card);
  }
}

function renderCommunity(language, projects = communityProjects, rootId = "communityGrid") {
  const root = document.getElementById(rootId);
  if (!root) return;
  clearElement(root);

  for (const project of projects) {
    const isContribution = rootId === "contributionGrid";
    const tag = project.url && !isContribution ? "a" : "article";
    const attrs = tag === "a" ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {};
    const card = createElement(tag, {
      className: `card project-card qa-card community-card${isContribution ? " studios-card contribution-card" : ""}`,
      attrs,
      dataset: project.placeId ? { placeId: project.placeId } : {},
    });
    if (project.image) card.append(createElement("img", { attrs: { src: project.image, alt: project.alt || project.title, loading: "lazy" } }));
    else if (project.mark && project.kind) card.append(createProjectPlaceholder(project));

    card.append(
      createElement("div", { className: "project-heading" }, [
        createElement("h3", { text: project.title }),
        createElement("span", { text: project.subtitle || (project.url && !isContribution ? "↗" : ""), attrs: project.url ? { "aria-hidden": "true" } : {} }),
      ]),
      createElement("p", { className: "project-role", text: localize(project.role, language) }),
      createElement("p", { className: "project-description", text: localize(project.description, language) }),
      createElement("div", { className: "testing-types", text: localize(project.category || project.testingTypes, language) }),
    );
    if (isContribution) {
      card.append(
        createElement("p", { className: "stats-updated", text: `${project.platform} · ${project.experienceCategory}` }),
        createStats(language),
        createElement("div", { className: "stats-updated contribution-source", text: language === "en" ? "Roblox API snapshot unavailable" : "Снимок Roblox API недоступен" }),
      );
    } else if (project.placeId) {
      card.append(createStats(language), createElement("div", { className: "stats-updated", text: language === "en" ? "Loading stats..." : "Статистика загружается..." }));
    } else {
      card.append(createElement("div", { className: "stats-updated stats-unavailable", text: language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна" }));
    }
    card.append(createElement(isContribution ? "a" : "span", {
      className: isContribution ? "studio-group-link" : "",
      text: localize(project.status, language),
      attrs: isContribution ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {},
    }));
    root.append(card);
  }
}

function renderExperience(language) {
  const root = document.getElementById("experienceGrid");
  if (!root) return;
  clearElement(root);
  for (const experience of experienceItems) {
    const list = createElement("ul", {}, experience.items.map((item) => createElement("li", { text: localize(item, language) })));
    root.append(createElement("div", { className: "experience-card" }, [
      createElement("h3", { text: localize(experience.title, language) }),
      createElement("p", { text: localize(experience.description, language) }),
      list,
    ]));
  }
}

export function renderPortfolioSections(language) {
  renderAbout(language);
  renderSkills();
  renderQA(language);
  renderCommunity(language);
  renderCommunity(language, contributionProjects, "contributionGrid");
  renderExperience(language);
}

export function updateQAStats(stats, language, unavailable = false) {
  for (const project of qaProjects) {
    if (!project.placeId) continue;
    const card = document.querySelector(`.qa-card[data-place-id="${project.placeId}"]`);
    if (!card) continue;
    const game = stats?.games?.[project.placeId];
    const status = card.querySelector(".stats-updated");
    if (unavailable || !game) {
      card.querySelectorAll(".stat-value").forEach((element) => { element.textContent = "—"; });
      if (status) status.textContent = language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
      continue;
    }
    if (game.image) {
      const placeholder = card.querySelector(".project-placeholder");
      let image = card.querySelector("img");
      if (!image) {
        image = createElement("img", { attrs: { alt: project.alt || project.title, loading: "lazy" } });
        image.addEventListener("error", () => {
          image.remove();
          if (placeholder && !placeholder.isConnected) card.prepend(placeholder);
        });
        placeholder?.remove();
        card.prepend(image);
      }
      if (image.src !== game.image) image.src = game.image;
    }
    animateNumber(card.querySelector('[data-stat="playing"]'), game.playing, language);
    animateNumber(card.querySelector('[data-stat="visits"]'), game.visits, language);
    if (game.status === "unavailable") {
      if (status) status.textContent = language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
      continue;
    }
    const time = formatDate(game.activeUpdatedAt, language, { hour: "2-digit", minute: "2-digit" });
    if (status) status.textContent = `${language === "en" ? "Updated" : "Обновлено"}: ${time}`;
    card.classList.add("loaded");
  }

  sortQACards(stats);

  for (const card of document.querySelectorAll(".community-card[data-place-id]")) {
    const placeId = card.dataset.placeId;
    const game = stats?.games?.[placeId];
    const status = card.querySelector(".contribution-source") || card.querySelector(".stats-updated");
    if (card.classList.contains("contribution-card")) {
      const dates = [];
      for (const [key, dateKey] of [["playing", "activeUpdatedAt"], ["visits", "visitsUpdatedAt"]]) {
        const element = card.querySelector(`[data-stat="${key}"]`);
        const value = game?.[key];
        const valid = typeof value === "number" && Number.isFinite(value) && value >= 0;
        if (valid) {
          animateNumber(element, value, language);
          element.title = new Intl.NumberFormat(language === "en" ? "en-US" : "ru-RU").format(value);
          dates.push(formatDate(game[dateKey], language, { dateStyle: "short", timeStyle: "short" }));
        } else {
          element.textContent = "—";
          element.removeAttribute("title");
        }
      }
      const image = card.querySelector("img");
      if (image && game?.image && image.src !== game.image) image.src = game.image;
      if (status) status.textContent = dates.length
        ? `${language === "en" ? "Roblox API snapshot" : "Снимок Roblox API"}: ${[...new Set(dates)].join(" / ")}${unavailable || game.status === "unavailable" ? (language === "en" ? " · Update unavailable; last successful data" : " · Обновление недоступно; последние успешные данные") : ""}`
        : (language === "en" ? "Roblox API data unavailable" : "Данные Roblox API недоступны");
      // Shared thumbnail handling below; numeric values and provenance are handled above.
    }
    if (unavailable || !game) {
      if (card.classList.contains("contribution-card")) continue;
      card.querySelectorAll(".stat-value[data-stat]").forEach((element) => { element.textContent = "—"; });
      if (status) status.textContent = language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
      continue;
    }
    if (!card.querySelector("img") && game.image) {
      const placeholder = card.querySelector(".project-placeholder");
      const image = createElement("img", { attrs: { src: game.image, alt: game.name || "Roblox project", loading: "lazy" } });
      image.addEventListener("error", () => {
        image.remove();
        if (placeholder && !placeholder.isConnected) card.prepend(placeholder);
      }, { once: true });
      placeholder?.remove();
      card.prepend(image);
    }
    if (card.classList.contains("contribution-card")) {
      card.classList.toggle("loaded", game.status !== "unavailable");
      continue;
    }
    animateNumber(card.querySelector('[data-stat="playing"]'), game.playing, language);
    animateNumber(card.querySelector('[data-stat="visits"]'), game.visits, language);
    if (game.status === "unavailable") {
      if (status) status.textContent = language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
      continue;
    }
    const time = formatDate(game.activeUpdatedAt, language, { hour: "2-digit", minute: "2-digit" });
    if (status) status.textContent = `${language === "en" ? "Updated" : "Обновлено"}: ${time}`;
    card.classList.add("loaded");
  }
}
