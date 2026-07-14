import { profile } from "../data/profile.js";
import { skillGroups } from "../data/skills.js";
import { developmentProjects } from "../data/developmentProjects.js";
import { qaProjects } from "../data/qaProjects.js";
import { experienceItems } from "../data/experience.js";
import { clearElement, createElement, localize } from "../utils/dom.js";
import { animateNumber, formatDate } from "../utils/formatters.js";

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

function renderDevelopment(language) {
  const root = document.getElementById("developmentGrid");
  if (!root) return;
  clearElement(root);
  for (const project of developmentProjects) {
    const tag = project.url ? "a" : "article";
    const attrs = project.url ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {};
    const card = createElement(tag, { className: "card project-card development-card", attrs });
    const heading = createElement("div", { className: "project-heading" }, [
      createElement("h3", { text: project.title }),
      createElement("span", { text: project.subtitle, attrs: project.url ? { "aria-hidden": "true" } : {} }),
    ]);
    card.append(
      createProjectPlaceholder(project),
      heading,
      createElement("p", { text: localize(project.description, language) }),
      createElement("div", { className: "project-tech", text: project.tech }),
      createElement("span", { text: localize(project.status, language) }),
    );
    root.append(card);
  }
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
  for (const project of qaProjects) {
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
  renderDevelopment(language);
  renderQA(language);
  renderExperience(language);
}

export function updateQAStats(stats, language, unavailable = false) {
  for (const project of qaProjects.filter((item) => item.placeId)) {
    const card = document.querySelector(`.qa-card[data-place-id="${project.placeId}"]`);
    if (!card) continue;
    const game = stats?.games?.[project.placeId];
    const status = card.querySelector(".stats-updated");
    if (unavailable || !game) {
      card.querySelectorAll(".stat-value").forEach((element) => { element.textContent = "—"; });
      if (status) status.textContent = language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
      continue;
    }
    if (!project.image && game.image && !card.querySelector("img")) {
      const placeholder = card.querySelector(".project-placeholder");
      const image = createElement("img", { attrs: { src: game.image, alt: project.alt || project.title, loading: "lazy" } });
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
