// Lets CSS hide .reveal blocks only when this script runs to show them again.
document.documentElement.classList.add("js");

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

// ── Page chrome: header line once the page scrolls ────────────
const header = document.querySelector(".site-header");

if (header) {
  let headerFrame = 0;
  let headerScrolled = false;
  // Two thresholds so iOS rubber-band settling near the top does not flicker the line.
  const syncHeader = () => {
    headerFrame = 0;
    const y = Math.max(0, window.scrollY);
    if (!headerScrolled && y > 16) headerScrolled = true;
    if (headerScrolled && y < 4) headerScrolled = false;
    header.classList.toggle("scrolled", headerScrolled);
  };
  const requestHeaderSync = () => {
    if (!headerFrame) headerFrame = window.requestAnimationFrame(syncHeader);
  };
  syncHeader();
  window.addEventListener("scroll", requestHeaderSync, { passive: true });
  window.addEventListener("pageshow", requestHeaderSync);
}

// ── Mobile nav ─────────────────────────────────────────────────
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#navLinks");

if (navToggle && navLinks) {
  // The open label comes from the markup (tools/website/sync-chrome.mjs).
  const openLabel = navToggle.getAttribute("aria-label");
  const closeLabel = document.documentElement.lang === "en" ? "Close menu" : "Menüyü kapat";

  const closeMenu = () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", openLabel);
  };

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? closeLabel : openLabel);
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
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
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
