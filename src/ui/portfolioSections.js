import { profile } from "../data/profile.js";
import { skillGroups } from "../data/skills.js";
import { qaProjects } from "../data/qaProjects.js";
import { communityProjects } from "../data/communityProjects.js";
import { experienceItems } from "../data/experience.js";
import { clearElement, createElement, localize } from "../utils/dom.js";
import { animateNumber, formatDate } from "../utils/formatters.js";

const rolePriority = Object.freeze({
  "qa lead": 1,
  "qa tester": 2,
  "game tester": 2,
});

function getRolePriority(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (rolePriority[normalizedRole]) return rolePriority[normalizedRole];
  if (normalizedRole.includes("qa") || normalizedRole.includes("quality assurance") || normalizedRole.includes("tester")) return 2;
  return 3;
}

function getProjectCCU(project, stats) {
  const game = stats?.games?.[project.placeId];
  if (!game) return 0;
  return Number(game.playing) || 0;
}

export function getSortedQAProjects(stats = null) {
  return qaProjects
    .map((project, index) => ({ project, index }))
    .sort((left, right) => (
      getRolePriority(left.project.role) - getRolePriority(right.project.role)
      || getProjectCCU(right.project, stats) - getProjectCCU(left.project, stats)
      || left.index - right.index
    ))
    .map(({ project }) => project);
}

function sortQACards(stats) {
  const root = document.getElementById("qaGrid");
  if (!root) return;
  const cards = new Map([...root.querySelectorAll(".qa-card[data-place-id]")].map((card) => [card.dataset.placeId, card]));
  for (const project of getSortedQAProjects(stats)) {
    const card = cards.get(String(project.placeId));
    if (card) root.append(card);
  }
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

function getTrackedProjects() {
  return [...qaProjects, ...communityProjects];
}

function renderCommunity(language) {
  const root = document.getElementById("communityGrid");
  if (!root) return;
  clearElement(root);

  for (const project of communityProjects) {
    const tag = project.url ? "a" : "article";
    const attrs = project.url ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {};
    const card = createElement(tag, {
      className: "card project-card qa-card community-card",
      attrs,
      dataset: project.placeId ? { placeId: project.placeId } : {},
    });
    if (project.image) card.append(createElement("img", { attrs: { src: project.image, alt: project.alt || project.title, loading: "lazy" } }));
    else if (project.mark && project.kind) card.append(createProjectPlaceholder(project));

    card.append(
      createElement("div", { className: "project-heading" }, [
        createElement("h3", { text: project.title }),
        createElement("span", { text: project.subtitle || (project.url ? "в†—" : ""), attrs: project.url ? { "aria-hidden": "true" } : {} }),
      ]),
      createElement("p", { className: "project-role", text: localize(project.role, language) }),
      createElement("p", { className: "project-description", text: localize(project.description, language) }),
      createElement("div", { className: "testing-types", text: localize(project.category || project.testingTypes, language) }),
    );
    if (project.placeId) {
      card.append(createStats(language), createElement("div", { className: "stats-updated", text: language === "en" ? "Loading stats..." : "Статистика загружается..." }));
    } else {
      card.append(createElement("div", { className: "stats-updated stats-unavailable", text: language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна" }));
    }
    card.append(createElement("span", { text: localize(project.status, language) }));
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
  renderExperience(language);
}

export function updateQAStats(stats, language, unavailable = false) {
  for (const project of getTrackedProjects().filter((item) => item.placeId)) {
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

  sortQACards(unavailable ? null : stats);

  for (const card of document.querySelectorAll(".community-card[data-place-id]")) {
    const placeId = card.dataset.placeId;
    const game = stats?.games?.[placeId];
    const status = card.querySelector(".stats-updated");
    if (unavailable || !game) {
      card.querySelectorAll(".stat-value").forEach((element) => { element.textContent = "—"; });
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
