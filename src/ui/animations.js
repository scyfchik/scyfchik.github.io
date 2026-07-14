let revealObserver;
let mouseHandler;
let parallaxHandler;
let parallaxFrame;

export function initializeAnimations() {
  const revealElements = document.querySelectorAll(".reveal");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reducedMotion) {
    revealElements.forEach((element) => element.classList.add("visible"));
  } else {
    revealObserver = new IntersectionObserver((entries) => {
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
  const about = document.getElementById("about");
  const isMobile = window.matchMedia("(max-width: 800px)").matches;
  if (hero && about && !isMobile && !reducedMotion) {
    const updateParallax = () => {
      parallaxFrame = undefined;
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const aboutTop = about.getBoundingClientRect().top;
      const heroShift = Math.max(-18, Math.min(18, scrollY * 0.025));
      const aboutShift = Math.max(-12, Math.min(12, (aboutTop - viewportHeight * 0.65) * -0.018));
      hero.style.setProperty("--hero-parallax-y", `${heroShift.toFixed(2)}px`);
      about.style.setProperty("--about-parallax-y", `${aboutShift.toFixed(2)}px`);
    };
    parallaxHandler = () => {
      if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
    };
    window.addEventListener("scroll", parallaxHandler, { passive: true });
    updateParallax();
  }

  if (!hero || isMobile || reducedMotion || hero.querySelector(".hero-particle")) return;
  mouseHandler = (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 12;
    hero.style.setProperty("--mouse-x", `${x}px`);
    hero.style.setProperty("--mouse-y", `${y}px`);
  };
  document.addEventListener("mousemove", mouseHandler);
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

export function cleanupAnimations() {
  revealObserver?.disconnect();
  if (mouseHandler) document.removeEventListener("mousemove", mouseHandler);
  if (parallaxHandler) window.removeEventListener("scroll", parallaxHandler);
  if (parallaxFrame) window.cancelAnimationFrame(parallaxFrame);
  document.querySelectorAll(".shooting-star, .hero-particle").forEach((element) => element.remove());
}
