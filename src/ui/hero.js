import { profile } from "../data/profile.js";
import { CONFIG } from "../config.js";
import { clearElement, createElement, localize } from "../utils/dom.js";

export function renderHero(language) {
  const content = document.getElementById("heroContent");
  if (!content) return;

  const statusDot = createElement("span", { attrs: { "aria-hidden": "true" } });
  const availability = createElement("p", { className: "availability-status" }, [statusDot, createElement("span", { text: localize(profile.availability, language) })]);
  const label = createElement("p", { className: "label", text: profile.label });
  const heading = createElement("h1", {}, [document.createTextNode(`${localize(profile.greeting, language)} `), createElement("span", { text: profile.name }), document.createTextNode(".")]);
  const title = createElement("h2", { text: profile.title });
  const description = createElement("p", { className: "description", text: localize(profile.description, language) });
  const buttons = createElement("div", { className: "buttons" }, profile.actions.map((action) => createElement("a", { className: action.className, text: localize(action.label, language), attrs: { href: action.href } })));
  const discord = createElement("button", { className: "social-link copy-discord", attrs: { type: "button" } }, [createBrandIcon("discord"), createElement("span", { text: `Discord: ${CONFIG.discordUsername}` })]);
  const github = createElement("a", { attrs: { href: "https://github.com/scyfchik", target: "_blank", rel: "noopener noreferrer" } }, [createBrandIcon("github"), createElement("span", { text: "GitHub: scyfchik" })]);
  const socials = createElement("div", { className: "socials" }, [discord, github]);
  clearElement(content);
  content.append(availability, label, heading, title, description, buttons, socials);
}

function createBrandIcon(brand) {
  const paths = {
    discord: "M19.54 5.34A16.8 16.8 0 0 0 15.44 4l-.5 1.02a15.4 15.4 0 0 0-5.88 0L8.56 4a16.8 16.8 0 0 0-4.1 1.34C1.86 9.2 1.16 12.96 1.5 16.66A16.5 16.5 0 0 0 6.53 19.2l1.22-1.66a10.7 10.7 0 0 1-1.92-.92l.47-.36c3.7 1.72 7.72 1.72 11.4 0l.48.36c-.62.36-1.26.67-1.93.92l1.22 1.66a16.5 16.5 0 0 0 5.03-2.54c.4-4.29-.68-8.02-2.96-11.32ZM8.62 14.55c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.3 2.04-2.3 1.15 0 2.06 1.04 2.04 2.3 0 1.27-.9 2.3-2.04 2.3Zm6.76 0c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.3 2.04-2.3 1.15 0 2.06 1.04 2.04 2.3 0 1.27-.89 2.3-2.04 2.3Z",
    github: "M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.36-3.9-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.26c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "social-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", paths[brand]);
  svg.append(path);
  return svg;
}
