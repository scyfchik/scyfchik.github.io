export function initializeAnimations() {
  const revealElements = document.querySelectorAll(".reveal");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    revealElements.forEach((element) => element.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const hero = document.querySelector(".hero");
  const isMobile = window.matchMedia("(max-width: 800px)").matches;
  if (hero && !isMobile && !reducedMotion) {
    let parallaxFrame;
    const updateParallax = () => {
      parallaxFrame = undefined;
      const heroShift = Math.max(-18, Math.min(18, window.scrollY * 0.025));
      hero.style.setProperty("--hero-parallax-y", `${heroShift.toFixed(2)}px`);
    };
    window.addEventListener("scroll", () => {
      if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
    }, { passive: true });
    updateParallax();
  }

  if (!hero || isMobile || reducedMotion) return;
  for (let index = 0; index < 3; index += 1) document.body.append(createParticle("div", "shooting-star"));
  for (let index = 0; index < 18; index += 1) {
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
