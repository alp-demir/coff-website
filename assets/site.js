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

// ── Page chrome: header, footer edge, mobile browser color ────
const header = document.querySelector(".site-header");
const footer = document.querySelector(".site-footer");
const themeColor = document.querySelector('meta[name="theme-color"]');

if (header || footer || themeColor) {
  const topThemeColor = themeColor?.dataset.themeTop || "#fffaf3";
  const footerThemeColor = themeColor?.dataset.themeFooter || "#1f2c31";
  let chromeFrame = 0;
  let headerScrolled = false;

  document.documentElement.classList.toggle("has-site-footer", Boolean(footer));

  const syncPageChrome = () => {
    chromeFrame = 0;

    const scrollTop = Math.max(0, window.scrollY);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const remainingScroll = Math.max(0, maxScroll - scrollTop);
    const footerRect = footer?.getBoundingClientRect();
    const footerVisible = Boolean(footerRect && footerRect.top < window.innerHeight && footerRect.bottom > 0);
    const footerThemeActive = Boolean(
      footerVisible
      && footer
      && scrollTop > 2
      && remainingScroll <= Math.max(96, footer.offsetHeight * 0.65)
    );

    if (!headerScrolled && scrollTop > 16) headerScrolled = true;
    if (headerScrolled && scrollTop < 4) headerScrolled = false;

    header?.classList.toggle("scrolled", headerScrolled);
    document.documentElement.classList.toggle("footer-in-view", footerVisible);
    document.documentElement.classList.toggle("footer-theme-active", footerThemeActive);

    const nextThemeColor = footerThemeActive ? footerThemeColor : topThemeColor;
    if (themeColor && themeColor.content !== nextThemeColor) {
      themeColor.content = nextThemeColor;
    }
  };

  const requestPageChromeSync = () => {
    if (chromeFrame) return;
    chromeFrame = window.requestAnimationFrame(syncPageChrome);
  };

  syncPageChrome();
  window.addEventListener("scroll", requestPageChromeSync, { passive: true });
  window.addEventListener("resize", requestPageChromeSync);
  window.addEventListener("pageshow", requestPageChromeSync);
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

// ── FAQ: interruptible expand/collapse motion ─────────────────
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((details) => {
  const summary = details.querySelector("summary");
  const content = details.querySelector("p");
  if (!summary || !content) return;

  let targetOpen = details.open;
  let finishTimer = 0;

  const finish = (open) => {
    if (targetOpen !== open) return;
    window.clearTimeout(finishTimer);
    details.open = open;
    details.classList.remove("is-animating", "is-preparing", "is-expanding", "is-closing");
    details.style.height = "";
    details.style.overflow = "";
    details.style.removeProperty("--faq-duration");
    details.style.removeProperty("--faq-easing");
  };

  const animate = (open) => {
    targetOpen = open;
    window.clearTimeout(finishTimer);

    const startHeight = details.getBoundingClientRect().height;
    const duration = open ? 320 : 220;
    const easing = open ? "cubic-bezier(0.16, 1, 0.3, 1)" : "cubic-bezier(0.4, 0, 1, 1)";

    details.classList.remove("is-preparing", "is-expanding", "is-closing");
    details.classList.add("is-animating");
    details.style.overflow = "hidden";
    details.style.height = `${startHeight}px`;

    if (open) {
      details.open = true;
      details.classList.add("is-preparing");
    }

    details.style.height = "auto";
    const borderHeight = details.offsetHeight - details.clientHeight;
    const endHeight = open
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + borderHeight;
    details.style.height = `${startHeight}px`;
    details.style.setProperty("--faq-duration", `${duration}ms`);
    details.style.setProperty("--faq-easing", easing);

    void details.offsetHeight;
    details.classList.remove("is-preparing");
    details.classList.add(open ? "is-expanding" : "is-closing");
    details.style.height = `${endHeight}px`;
    finishTimer = window.setTimeout(() => finish(open), duration + 60);
  };

  summary.addEventListener("click", (event) => {
    if (motionPreference.matches) return;
    event.preventDefault();
    animate(!targetOpen);
  });

  details.addEventListener("toggle", () => {
    if (!details.classList.contains("is-animating")) targetOpen = details.open;
  });

  details.addEventListener("transitionend", (event) => {
    if (event.target === details && event.propertyName === "height") finish(targetOpen);
  });
});

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
