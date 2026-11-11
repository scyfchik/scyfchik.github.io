let observeContent = () => {};

export function refreshAnimations() {
  observeContent();
}

export function initializeAnimations() {
  const revealElements = document.querySelectorAll(".reveal, #featuredProject");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = motion.matches;
  const running = new Set();
  const appear = (element, delay = 0) => {
    if (motion.matches || !element.animate) return;
    const animation = element.animate(
      [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: 520, delay, fill: "backwards", easing: "cubic-bezier(.22,1,.36,1)" },
    );
    running.add(animation);
    animation.onfinish = animation.oncancel = () => running.delete(animation);
  };
  motion.addEventListener("change", () => {
    if (motion.matches) {
      running.forEach(animation => animation.cancel());
      document.querySelector(".hero")?.style.setProperty("--hero-parallax-y", "0px");
    }
  });
  const heroContent = document.getElementById("heroContent");
  if (heroContent) [...heroContent.children].forEach(element => {
    const delay = element.matches("h1") ? 60 : element.matches("h2,.description") ? 140 : 220;
    appear(element, delay);
  });
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
  } else {
    const seen = new Set();
    const keys = new WeakMap();
    const revealObserver = new IntersectionObserver((entries) => {
      let order = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          const key = keys.get(entry.target);
          if (!seen.has(key)) {
            seen.add(key);
            appear(entry.target, Math.min(order++ * 55, 165));
          }
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    observeContent = () => {
      // Renders replace cards after language and statistics updates. Stable keys keep reveals one-shot.
      revealObserver.disconnect();
      document.querySelectorAll("main .section").forEach(section => {
        const items = section.querySelectorAll(":scope > h2, .card, .skill-group, .experience-card, .contact-card, .development-project, .about-text, .qa-process");
        items.forEach((item, index) => {
          const key = `${section.id}:${item.dataset.placeId || index}`;
          keys.set(item, key);
          if (!seen.has(key)) revealObserver.observe(item);
        });
      });
    };
    observeContent();
  }

  initializeAtmosphere(motion);

  const hero = document.querySelector(".hero");
  const isMobile = window.matchMedia("(max-width: 800px)").matches;

  if (!hero || isMobile || reducedMotion) return;
  for (let index = 0; index < 8; index += 1) {
    const particle = createParticle("span", "hero-particle");
    particle.style.left = `${28 + Math.random() * 22}%`;
    particle.style.top = `${18 + Math.random() * 30}%`;
    particle.style.animationDelay = `${Math.random() * 7}s`;
    particle.style.animationDuration = `${5 + Math.random() * 5}s`;
    hero.append(particle);
  }
  let heroVisible = true;
  const pauseDecor = () => hero.classList.toggle("decor-paused", !heroVisible || document.hidden);
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    pauseDecor();
  }).observe(hero);
  document.addEventListener("visibilitychange", pauseDecor);

}

function initializeAtmosphere(motion) {
  const ambient = createParticle("div", "ambient-light");
  const progress = createParticle("div", "reading-progress");
  ambient.setAttribute("aria-hidden", "true");
  progress.setAttribute("aria-hidden", "true");
  document.body.append(ambient, progress);
  let progressFrame;
  const updateProgress = () => {
    progressFrame = undefined;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
  };
  const scheduleProgress = () => {
    if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
  };
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress);
  new ResizeObserver(scheduleProgress).observe(document.body);
  updateProgress();

  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const cursor = createParticle("div", "cursor-dot");
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);
  const glow = createParticle("div", "cursor-glow");
  glow.setAttribute("aria-hidden", "true");
  document.body.append(glow);
  let frame;
  let x = 0;
  let y = 0;
  let control = false;
  const hideCursor = () => {
    cancelAnimationFrame(frame);
    frame = undefined;
    document.documentElement.classList.remove("dot-cursor");
  };
  document.addEventListener("pointermove", event => {
    if (!pointer.matches || event.pointerType !== "mouse" || event.target.closest("input, textarea, [contenteditable], dialog")) {
      hideCursor();
      return;
    }
    x = event.clientX;
    y = event.clientY;
    control = Boolean(event.target.closest("a, button, summary"));
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      const position = `translate3d(${x}px, ${y}px, 0)`;
      cursor.style.transform = position;
      glow.style.transform = position;
      cursor.classList.toggle("over-control", control);
      document.documentElement.classList.add("dot-cursor");
    });
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", hideCursor);
  window.addEventListener("blur", hideCursor);
  pointer.addEventListener("change", hideCursor);
  document.addEventListener("visibilitychange", hideCursor);
  document.addEventListener("keydown", event => { if (event.key === "Tab") hideCursor(); });
}

function createParticle(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}
