let initialized = false;
let navObserver;

export function initializeNavigation() {
  if (initialized) return;
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("main-navigation");
  const menuLabel = (open) => document.documentElement.lang === "en"
    ? (open ? "Close menu" : "Open menu")
    : (open ? "Закрыть меню" : "Открыть меню");

  const closeMenu = () => {
    navigation?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", menuLabel(false));
  };
  const toggleMenu = () => {
    const open = menuButton?.getAttribute("aria-expanded") !== "true";
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", menuLabel(open));
    navigation?.classList.toggle("open", open);
  };
  const handleEscape = (event) => { if (event.key === "Escape") closeMenu(); };
  const handleResize = () => { if (window.innerWidth > 800) closeMenu(); };

  menuButton?.addEventListener("click", toggleMenu);
  navigation?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", handleEscape);
  window.addEventListener("resize", handleResize);

  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    navObserver = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      links.forEach((link) => link.classList.toggle("active-nav", link.getAttribute("href") === `#${visible.target.id}`));
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });
    sections.forEach((section) => navObserver.observe(section));
  }
  initialized = true;
}
