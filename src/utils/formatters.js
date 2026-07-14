export function formatNumber(value, language = "ru") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat(language === "en" ? "en-US" : "ru-RU", {
    notation: number >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
}

export function formatDate(value, language, options) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(language === "en" ? "en-US" : "ru-RU", options);
}

export function animateNumber(element, targetValue, language, duration = 600) {
  const target = Number(targetValue);
  if (!element || !Number.isFinite(target)) {
    if (element) element.textContent = "—";
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = formatNumber(target, language);
    return;
  }
  const startedAt = performance.now();
  const step = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    element.textContent = formatNumber(Math.floor(target * progress), language);
    if (progress < 1 && element.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
