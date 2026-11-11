export function initializeNavigation() {
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
    if (open && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigation?.animate(
        [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }],
        { duration: 240, easing: "ease-out" },
      );
    }
  };

  menuButton?.addEventListener("click", toggleMenu);
  navigation?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuButton.focus();
    }
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 800) closeMenu(); });

  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (!visible) return;
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active-nav", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-35% 0px -55%", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}
