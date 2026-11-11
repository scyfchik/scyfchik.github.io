const numberFormats = new Map();

export function formatNumber(value, language = "ru") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const locale = language === "en" ? "en-US" : "ru-RU";
  const notation = number >= 10_000 ? "compact" : "standard";
  const key = `${locale}:${notation}`;
  if (!numberFormats.has(key)) numberFormats.set(key, new Intl.NumberFormat(locale, {
    notation,
    maximumFractionDigits: 1,
  }));
  return numberFormats.get(key).format(number);
}

export function formatDate(value, language, options) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(language === "en" ? "en-US" : "ru-RU", options);
}

// Keep statistics stable while cards reveal; counting every value adds avoidable DOM writes.
export function animateNumber(element, targetValue, language) {
  if (!element) return;
  const text = formatNumber(targetValue, language);
  if (element.textContent !== text) element.textContent = text;
}
