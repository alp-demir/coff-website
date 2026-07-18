// ── Reveal on scroll (with sibling stagger) ────────────────────
const reveals = document.querySelectorAll(".reveal");

reveals.forEach((item, index) => {
  const siblings = item.parentElement
    ? Array.from(item.parentElement.children).filter((el) => el.classList.contains("reveal"))
    : [item];
  const position = Math.max(0, siblings.indexOf(item));
  item.style.setProperty("--reveal-delay", `${Math.min(position * 0.09, 0.36)}s`);
});

if ("IntersectionObserver" in window && reveals.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("visible"));
}

// ── Header scroll state ────────────────────────────────────────
const header = document.querySelector(".site-header");

if (header) {
  const syncHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

// ── Premium scroll continuity ─────────────────────────────────
const scrollHero = document.querySelector("[data-scroll-hero]");
const scrollScenes = Array.from(document.querySelectorAll("[data-scroll-scene]")).map((element) => ({
  element,
  name: element.dataset.scrollScene,
  steps: Array.from(element.querySelectorAll("[data-scroll-step]")),
}));
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let scrollFrame = 0;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const updateScrollContinuity = () => {
  scrollFrame = 0;

  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight - viewportHeight;
  const pageProgress = documentHeight > 0 ? clamp(window.scrollY / documentHeight) : 0;
  const headerHeight = header ? header.offsetHeight : 0;
  const heroRect = scrollHero ? scrollHero.getBoundingClientRect() : null;
  const sceneStates = scrollScenes.map((scene) => {
    const rect = scene.element.getBoundingClientRect();
    const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
    return { ...scene, progress };
  });

  document.documentElement.style.setProperty("--page-progress", pageProgress.toFixed(4));

  if (motionPreference.matches) {
    scrollHero?.style.removeProperty("--hero-phone-y");
    scrollHero?.style.removeProperty("--hero-phone-rotate");
    scrollHero?.style.removeProperty("--hero-map-y");
    scrollHero?.style.removeProperty("--hero-map-scale");
    scrollHero?.style.removeProperty("--hero-cue-opacity");
    scrollHero?.style.removeProperty("--hero-cue-y");
    sceneStates.forEach(({ element, steps }) => {
      element.style.removeProperty("--scene-shift");
      element.style.removeProperty("--today-glow-shift");
      element.style.removeProperty("--today-map-shift");
      element.style.removeProperty("--story-media-shift");
      element.style.removeProperty("--safety-orb-shift");
      steps.forEach((step) => step.classList.remove("is-active"));
    });
    return;
  }

  if (scrollHero && heroRect) {
    const heroDistance = Math.max(heroRect.height * 0.78, 1);
    const heroProgress = clamp((-heroRect.top + headerHeight) / heroDistance);
    const phoneTravel = window.innerWidth <= 720 ? -8 : window.innerWidth <= 980 ? -14 : -26;
    const phoneRotation = window.innerWidth <= 720 ? -0.18 : window.innerWidth <= 980 ? -0.34 : -0.7;
    scrollHero.style.setProperty("--hero-phone-y", `${(phoneTravel * heroProgress).toFixed(2)}px`);
    scrollHero.style.setProperty("--hero-phone-rotate", `${(phoneRotation * heroProgress).toFixed(3)}deg`);
    scrollHero.style.setProperty("--hero-map-y", `${(-12 * heroProgress).toFixed(2)}px`);
    scrollHero.style.setProperty("--hero-map-scale", (1 + (0.018 * heroProgress)).toFixed(4));
    scrollHero.style.setProperty("--hero-cue-opacity", clamp(1 - (heroProgress * 4)).toFixed(3));
    scrollHero.style.setProperty("--hero-cue-y", `${(-6 * heroProgress).toFixed(2)}px`);
  }

  sceneStates.forEach(({ element, name, progress, steps }) => {
    const shift = (0.5 - progress) * 28;
    element.style.setProperty("--scene-shift", `${shift.toFixed(2)}px`);

    if (name === "today") {
      element.style.setProperty("--today-glow-shift", `${(-0.35 * shift).toFixed(2)}px`);
      element.style.setProperty("--today-map-shift", `${(0.42 * shift).toFixed(2)}px`);
    }

    if (name === "story") {
      element.style.setProperty("--story-media-shift", `${(0.55 * shift).toFixed(2)}px`);
    }

    if (name === "safety") {
      element.style.setProperty("--safety-orb-shift", `${(0.75 * shift).toFixed(2)}px`);
    }

    if (name === "today" && steps.length > 0) {
      const stepProgress = clamp((progress - 0.12) / 0.62);
      const activeIndex = Math.min(steps.length - 1, Math.floor(stepProgress * steps.length));
      steps.forEach((step, index) => step.classList.toggle("is-active", index === activeIndex));
    }
  });
};

const requestScrollContinuity = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScrollContinuity);
};

if (scrollHero || scrollScenes.length > 0 || document.querySelector(".page-progress")) {
  updateScrollContinuity();
  window.addEventListener("scroll", requestScrollContinuity, { passive: true });
  window.addEventListener("resize", requestScrollContinuity);
  motionPreference.addEventListener?.("change", requestScrollContinuity);
}

// ── Mobile nav ─────────────────────────────────────────────────
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#navLinks");

if (navToggle && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Menüyü aç");
  };

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav")) closeMenu();
  });
}

// ── Scrollspy: highlight active section in nav ─────────────────
const sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

if ("IntersectionObserver" in window && sectionLinks.length > 0) {
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    sectionLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: "-32% 0px -56% 0px" });

  sections.forEach((section) => spy.observe(section));
}

// ── Footer year ────────────────────────────────────────────────
const footerYear = document.querySelector("#footerYear");
if (footerYear) footerYear.textContent = String(new Date().getFullYear());
