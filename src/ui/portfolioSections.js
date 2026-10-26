import { profile } from "../data/profile.js";
import { skillGroups } from "../data/skills.js";
import { qaProjects } from "../data/qaProjects.js";
import { contributionProjects } from "../data/contributionProjects.js";
import { communityProjects } from "../data/communityProjects.js";
import { experienceItems } from "../data/experience.js";
import { clearElement, createElement, localize } from "../utils/dom.js";
import { animateNumber, formatDate } from "../utils/formatters.js";

// Projects at or above this get a full card; the rest go into the compact list below them.
const FEATURED_MIN_VISITS = 100_000_000;

const statLabels = { playing: { ru: "Онлайн", en: "Active" }, visits: { ru: "Визиты", en: "Visits" } };

function getProjectVisits(project, stats) {
  return stats?.games?.[project.placeId]?.visits ?? 0;
}

function getSortedQAProjects(stats) {
  return qaProjects
    .map((project, index) => ({ project, index }))
    .sort((left, right) => (
      getProjectVisits(right.project, stats) - getProjectVisits(left.project, stats)
      || left.index - right.index
    ))
    .map(({ project }) => project);
}

function isLeadRole(role) {
  return /lead|manager/i.test(role);
}

// Cards start with a text placeholder; the Roblox icon replaces it once stats arrive,
// and the placeholder comes back if the CDN image fails to load.
function showThumbnail(card, src, alt) {
  let image = card.querySelector("img");
  if (!image) {
    const placeholder = card.querySelector(".project-placeholder");
    image = createElement("img", { attrs: { alt, loading: "lazy" } });
    image.addEventListener("error", () => {
      image.remove();
      if (placeholder && !placeholder.isConnected) card.prepend(placeholder);
    }, { once: true });
    placeholder?.remove();
    card.prepend(image);
  }
  if (image.src !== src) image.src = src;
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

function createTestingTypes(text) {
  return createElement("div", { className: "testing-types" }, text.split("·").map((item) => createElement("span", { text: item.trim() })));
}

function createRole(role) {
  return createElement("p", { className: isLeadRole(role) ? "project-role is-lead" : "project-role", text: role });
}

function createStats(language) {
  return createElement("div", { className: "roblox-stats", attrs: { "aria-label": "Roblox statistics" } }, ["playing", "visits"].map((key) => (
    createElement("div", { className: "stat-pill" }, [
      createElement("span", { className: "stat-value", text: "—", dataset: { stat: key } }),
      createElement("span", { className: "stat-label", text: localize(statLabels[key], language) }),
    ])
  )));
}

function unavailableText(language) {
  return language === "en" ? "Stats currently unavailable" : "Статистика пока недоступна";
}

function updatedText(game, language) {
  if (game.status === "unavailable") return language === "en" ? "Update unavailable; last successful data" : "Обновление недоступно; последние успешные данные";
  const time = formatDate(game.activeUpdatedAt, language, { hour: "2-digit", minute: "2-digit" });
  return `${language === "en" ? "Updated" : "Обновлено"}: ${time}`;
}

function createFeaturedCard(project, game, language) {
  const card = createElement("a", {
    className: "card project-card qa-card",
    attrs: { href: project.url, target: "_blank", rel: "noopener noreferrer" },
    dataset: { placeId: project.placeId },
  });
  card.append(
    createProjectPlaceholder(project),
    createElement("div", { className: "project-heading" }, [createElement("h3", { text: project.title }), createElement("span", { text: "↗", attrs: { "aria-hidden": "true" } })]),
    createRole(project.role),
    createElement("p", { className: "project-description", text: localize(project.description, language) }),
    createTestingTypes(project.testingTypes),
    createStats(language),
    createElement("div", { className: "stats-updated", text: updatedText(game, language) }),
  );
  if (game.image) showThumbnail(card, game.image, project.alt || project.title);
  animateNumber(card.querySelector('[data-stat="playing"]'), game.playing, language);
  animateNumber(card.querySelector('[data-stat="visits"]'), game.visits, language);
  card.classList.add("loaded");
  return card;
}

function createCompactCard(project, game, language) {
  const thumb = game?.image
    ? createElement("img", { className: "qa-compact-thumb", attrs: { src: game.image, alt: "", loading: "lazy" } })
    : createElement("div", { className: "qa-compact-thumb", text: project.mark, attrs: { "aria-hidden": "true" } });
  if (game?.image) thumb.addEventListener("error", () => thumb.replaceWith(createElement("div", { className: "qa-compact-thumb", text: project.mark, attrs: { "aria-hidden": "true" } })), { once: true });

  const meta = game
    ? createElement("p", { className: "qa-compact-meta" }, [
      ...["visits", "playing"].map((key) => createElement("span", {}, [
        createElement("strong", { text: "—", dataset: { stat: key } }),
        ` ${localize(statLabels[key], language).toLowerCase()}`,
      ])),
      game.status === "unavailable" ? createElement("span", { className: "stats-unavailable", text: updatedText(game, language) }) : null,
    ])
    : createElement("p", { className: "qa-compact-meta stats-unavailable", text: unavailableText(language) });

  const card = createElement("a", {
    className: "card qa-card qa-compact-card",
    attrs: { href: project.url, target: "_blank", rel: "noopener noreferrer" },
    dataset: { placeId: project.placeId },
  }, [
    thumb,
    createElement("div", { className: "qa-compact-body" }, [
      createElement("div", { className: "project-heading" }, [createElement("h3", { text: project.title }), createElement("span", { text: "↗", attrs: { "aria-hidden": "true" } })]),
      createRole(project.role),
      createElement("p", { className: "project-description", text: localize(project.description, language) }),
      createTestingTypes(project.testingTypes),
      meta,
    ]),
  ]);
  if (meta.querySelector("[data-stat]")) {
    animateNumber(meta.querySelector('[data-stat="visits"]'), game.visits, language);
    animateNumber(meta.querySelector('[data-stat="playing"]'), game.playing, language);
  }
  return card;
}

function renderQA(language, stats) {
  const root = document.getElementById("qaGrid");
  if (!root) return;
  const projects = getSortedQAProjects(stats);
  const isFeatured = (project) => getProjectVisits(project, stats) >= FEATURED_MIN_VISITS;
  const featured = projects.filter(isFeatured);
  const rest = projects.filter((project) => !isFeatured(project));

  clearElement(root);
  if (featured.length) {
    const cards = featured.map((project) => createFeaturedCard(project, stats.games[project.placeId], language));
    // Rows of three; an incomplete last row is stretched so the grid has no gaps (5 cards → 3 + 2).
    const remainder = cards.length % 3;
    if (remainder) cards.slice(-remainder).forEach((card) => card.classList.add(remainder === 1 ? "qa-span-full" : "qa-span-half"));
    root.append(createElement("div", { className: "cards qa-featured" }, cards));
  }
  if (rest.length) {
    if (featured.length) root.append(createElement("h3", { className: "qa-subheading", text: language === "en" ? "More projects" : "Другие проекты" }));
    root.append(createElement("div", { className: "qa-compact" }, rest.map((project) => createCompactCard(project, stats?.games?.[project.placeId], language))));
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
      createTestingTypes(localize(project.category || project.testingTypes, language)),
    );
    if (isContribution) {
      card.append(
        createElement("p", { className: "stats-updated", text: `${project.platform} · ${project.experienceCategory}` }),
        createStats(language),
        createElement("div", { className: "stats-updated contribution-source", text: language === "en" ? "Roblox API snapshot unavailable" : "Снимок Roblox API недоступен" }),
        createElement("a", { className: "studio-group-link", text: localize(project.status, language), attrs: { href: project.url, target: "_blank", rel: "noopener noreferrer" } }),
      );
    } else if (project.placeId) {
      card.append(createStats(language), createElement("div", { className: "stats-updated", text: language === "en" ? "Loading stats..." : "Статистика загружается..." }));
    } else {
      card.append(createElement("div", { className: "stats-updated stats-unavailable", text: unavailableText(language) }));
    }
    root.append(card);
  }
}

function renderExperience(language) {
  const root = document.getElementById("experienceGrid");
  if (!root) return;
  clearElement(root);
  for (const experience of experienceItems) {
    const details = experience.projects
      ? experience.projects.map((project) => createElement("div", { className: "experience-project" }, [
        createElement("h4", { text: project.title }),
        createElement("p", { text: localize(project.description, language) }),
        createElement("span", { className: "experience-stack", text: project.stack }),
      ]))
      : createElement("ul", {}, experience.items.map((item) => createElement("li", { text: localize(item, language) })));
    root.append(createElement("div", { className: "experience-card" }, [
      createElement("h3", { text: localize(experience.title, language) }),
      createElement("p", { text: localize(experience.description, language) }),
      details,
    ]));
  }
}

// QA is left out on purpose: its layout depends on visit counts, so it is rendered from
// updateQAStats once stats are known. Until then the static copy in index.html is shown.
export function renderPortfolioSections(language) {
  renderAbout(language);
  renderSkills();
  renderCommunity(language);
  renderCommunity(language, contributionProjects, "contributionGrid");
  renderExperience(language);
}

export function updateQAStats(stats, language, unavailable = false) {
  renderQA(language, unavailable ? null : stats);

  for (const card of document.querySelectorAll(".community-card[data-place-id]")) {
    const placeId = card.dataset.placeId;
    const game = stats?.games?.[placeId];
    const statsBlock = card.querySelector(".roblox-stats");
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
      statsBlock.hidden = dates.length === 0;
      const image = card.querySelector("img");
      if (image && game?.image && image.src !== game.image) image.src = game.image;
      if (status) status.textContent = dates.length
        ? `${language === "en" ? "Roblox API snapshot" : "Снимок Roblox API"}: ${[...new Set(dates)].join(" / ")}${unavailable || game.status === "unavailable" ? (language === "en" ? " · Update unavailable; last successful data" : " · Обновление недоступно; последние успешные данные") : ""}`
        : (language === "en" ? "Roblox API data unavailable" : "Данные Roblox API недоступны");
    }
    if (unavailable || !game) {
      if (card.classList.contains("contribution-card")) continue;
      statsBlock.hidden = true;
      if (status) status.textContent = unavailableText(language);
      continue;
    }
    if (!card.querySelector("img") && game.image) showThumbnail(card, game.image, game.name || "Roblox project");
    if (card.classList.contains("contribution-card")) {
      card.classList.toggle("loaded", game.status !== "unavailable");
      continue;
    }
    statsBlock.hidden = false;
    animateNumber(card.querySelector('[data-stat="playing"]'), game.playing, language);
    animateNumber(card.querySelector('[data-stat="visits"]'), game.visits, language);
    if (game.status === "unavailable") {
      if (status) status.textContent = unavailableText(language);
      continue;
    }
    if (status) status.textContent = updatedText(game, language);
    card.classList.add("loaded");
  }
}
