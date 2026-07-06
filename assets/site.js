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
