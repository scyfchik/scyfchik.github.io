import { developmentProject as project } from "../data/developmentProject.js";
import { createElement as el, localize } from "../utils/dom.js";

export function createDevelopmentProject(language) {
  const t = (ru, en) => language === "en" ? en : ru;
  const card = el("article", { className: "development-project" });
  card.append(
    el("p", { className: "featured-eyebrow", text: t("ОСНОВНОЙ ИГРОВОЙ ПРОЕКТ", "FEATURED GAME PROJECT") }),
    el("h2", { text: project.title.toUpperCase() }),
    el("p", { className: "project-role", text: localize(project.genre, language) }),
    el("p", { className: "featured-status", text: `${localize(project.status, language)} · ${project.studio}` }),
    el("p", { className: "featured-intro", text: localize(project.description, language) }),
    el("div", { className: "testing-types" }, ["Roblox Studio", "Luau", t("Мультиплеер", "Multiplayer"), t("Хоррор", "Horror")].map(text => el("span", { text }))),
    el("h3", { text: t("Концепция игры", "Game Concept") }),
    el("div", { className: "game-concepts" }, project.concepts.map(item => el("p", {}, [el("strong", { text: localize(item.title, language) }), document.createTextNode(`: ${localize(item.text, language)}`)]))),
    el("h3", { text: t("Разработка", "Development Information") }),
    el("dl", { className: "development-facts" }, [
      [t("Студия", "Studio"), project.studio], [t("Платформа", "Platform"), "Roblox"],
      [t("Роль", "Role"), localize(project.role, language)], [t("Статус", "Status"), localize(project.status, language)],
    ].map(([label, value]) => el("div", {}, [el("dt", { text: label }), el("dd", { text: value })]))),
    el("h3", { text: t("Скриншоты", "Screenshot Gallery") }),
  );
  const hasImages = project.screenshots.some((slot) => slot.file);
  const gallery = el("div", { className: `project-gallery${hasImages ? "" : " is-empty"}`, attrs: { role: "region", "aria-label": t("Скриншоты The Last Shift", "The Last Shift screenshots"), tabindex: "0" } });
  const stage = el("button", { className: "gallery-stage", attrs: { type: "button" } });
  const caption = el("p", { className: "gallery-caption", attrs: { "aria-live": "polite", "aria-atomic": "true" } });
  const previous = el("button", { text: "←", attrs: { type: "button", "aria-label": t("Предыдущий скриншот", "Previous screenshot") } });
  const next = el("button", { text: "→", attrs: { type: "button", "aria-label": t("Следующий скриншот", "Next screenshot") } });
  const indicators = el("div", { className: "gallery-indicators" });
  const dialog = el("dialog", { className: "gallery-lightbox", attrs: { "aria-label": t("Просмотр скриншота", "Screenshot viewer") } });
  const close = el("button", { text: t("Закрыть", "Close"), attrs: { type: "button", autofocus: "" } });
  const large = el("img");
  dialog.append(close, large);
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  let index = 0;
  let revision = 0;
  let currentImage = null;
  const buttons = project.screenshots.map((slot, i) => {
    const label = localize(slot.title, language);
    const preview = slot.file
      ? el("img", { attrs: { src: `assets/projects/the-last-shift/${slot.file}`, alt: "", loading: "lazy" } })
      : el("span", { className: "gallery-preview-placeholder", text: String(i + 1), attrs: { "aria-hidden": "true" } });
    const button = el("button", { attrs: { type: "button", "aria-label": label } }, [preview, el("span", { text: label })]);
    button.addEventListener("click", () => show(i));
    indicators.append(button);
    return button;
  });
  function show(value) {
    const request = ++revision;
    index = (value + project.screenshots.length) % project.screenshots.length;
    const slot = project.screenshots[index];
    const title = localize(slot.title, language);
    currentImage = null;
    stage.disabled = true;
    stage.replaceChildren(el("strong", { text: title }), el("span", { text: t("Скриншот пока не добавлен", "Screenshot not added yet") }));
    stage.setAttribute("aria-label", t("Открыть: ", "Open: ") + title);
    caption.textContent = `${index + 1} / ${project.screenshots.length} · ${title}`;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    if (slot.file) {
      const image = el("img", { attrs: { src: `assets/projects/the-last-shift/${slot.file}`, alt: title } });
      const selected = index;
      image.addEventListener("load", () => {
        if (selected !== index || request !== revision) return;
        stage.replaceChildren(image);
        stage.disabled = false;
        currentImage = image;
        image.classList.add("gallery-enter");
      });
    }
    const selectedPreview = buttons[index].firstElementChild;
    selectedPreview.classList.remove("gallery-enter");
    requestAnimationFrame(() => {
      if (request === revision) selectedPreview.classList.add("gallery-enter");
    });
  }
  stage.addEventListener("click", () => {
    if (!currentImage) return;
    large.src = currentImage.src;
    large.alt = currentImage.alt;
    dialog.showModal();
  });
  previous.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  gallery.addEventListener("keydown", (event) => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in offsets) { event.preventDefault(); show(index + offsets[event.key]); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); show(event.key === "Home" ? 0 : project.screenshots.length - 1); }
  });
  let start;
  gallery.addEventListener("touchstart", (event) => { start = event.touches[0]; }, { passive: true });
  gallery.addEventListener("touchend", (event) => {
    if (!start) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - start.clientX;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(end.clientY - start.clientY)) show(index + (dx < 0 ? 1 : -1));
    start = null;
  }, { passive: true });
  if (hasImages) gallery.append(stage, el("div", { className: "gallery-controls" }, [previous, caption, next]));
  else gallery.append(el("p", { className: "gallery-empty-copy", text: t("Скриншоты будут добавлены позже.", "Screenshots will be added later.") }));
  gallery.append(indicators);
  card.append(gallery, dialog);
  show(0);
  return card;
}
