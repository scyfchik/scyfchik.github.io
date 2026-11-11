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
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          if (entry.target.id !== "heroContent") {
            const items = [...entry.target.children];
            items.forEach((item, index) => appear(item, Math.min(index * 45, 135)));
          }
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const hero = document.querySelector(".hero");
  const isMobile = window.matchMedia("(max-width: 800px)").matches;
  if (hero && !isMobile && !reducedMotion) {
    let parallaxFrame;
    const updateParallax = () => {
      parallaxFrame = undefined;
      const heroShift = motion.matches ? 0 : Math.max(-18, Math.min(18, window.scrollY * 0.025));
      hero.style.setProperty("--hero-parallax-y", `${heroShift.toFixed(2)}px`);
    };
    window.addEventListener("scroll", () => {
      if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
    }, { passive: true });
    updateParallax();
  }

  if (!hero || isMobile || reducedMotion) return;
  for (let index = 0; index < 8; index += 1) {
    const particle = createParticle("span", "hero-particle");
    particle.style.left = `${28 + Math.random() * 22}%`;
    particle.style.top = `${18 + Math.random() * 30}%`;
    particle.style.animationDelay = `${Math.random() * 7}s`;
    particle.style.animationDuration = `${5 + Math.random() * 5}s`;
    hero.append(particle);
  }
}

function createParticle(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}
