export function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = String(options.text);
  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      if (value !== undefined && value !== null) element.setAttribute(name, String(value));
    }
  }
  if (options.dataset) Object.assign(element.dataset, options.dataset);
  for (const child of children.flat()) {
    if (child !== null && child !== undefined) element.append(child);
  }
  return element;
}

export function clearElement(element) {
  element?.replaceChildren();
}

export function localize(value, language) {
  return value && typeof value === "object" ? value[language] ?? value.ru ?? value.en ?? "" : value ?? "";
}

export function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(text);
}
