// Home page only (index.html, en/index.html): the /indir hand-off, the
// scroll parallax of the story and safety panels, and the scroll tour.
// Loaded after site.js; everything sits in this block so its names do not
// clash with site.js's top-level ones.
{
const header = document.querySelector(".site-header");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// ── /indir: the link the apps share ─────────────────────────────
// coffcircle.com/indir (and /en/indir) redirect to the home page's launch
// card with ?indir. A phone that lands there goes straight on to its own
// store, so a friend who taps a shared link reaches an install button in one
// step. The store links come from the launch card itself, which
// sync-chrome.mjs fills from STORE_STATE: while the stores are "soon" it has
// no links, nothing happens, and the card says when the app comes out. On a
// desktop the card with both buttons is the right page anyway. iPads report a
// Mac user agent and the app is iPhone-only, so they stay on the card too.
// First in this file, so nothing below can stop it.
(() => {
  if (!new URLSearchParams(window.location.search).has("indir")) return;
  const ua = navigator.userAgent;
  const store = /iPhone|iPod/.test(ua) ? "apps.apple.com" : /Android/.test(ua) ? "play.google.com" : null;
  if (!store) return;
  const link = document.querySelector(`[data-sync="stores"] a[href*="${store}"]`);
  if (!link) return;
  const target = new URL(link.href);
  if (store === "apps.apple.com") {
    // The Turkish card links the /tr/ storefront; a shared link should open
    // the friend's own (the print QR links leave the country out as well).
    target.pathname = target.pathname.replace(/^\/[a-z]{2}\//, "/");
  } else {
    // Play passes the referrer to the install, so the console can tell
    // shares apart from print (utm_source=qr). The App Store needs a provider
    // token we do not have yet.
    target.searchParams.set("referrer", "utm_source=share&utm_medium=app");
  }
  window.location.replace(target.toString());
})();

// ── Premium scroll continuity ─────────────────────────────────
const scrollScenes = Array.from(document.querySelectorAll("[data-scroll-scene]")).map((element) => ({
  element,
  name: element.dataset.scrollScene,
}));
let scrollFrame = 0;

const updateScrollContinuity = () => {
  scrollFrame = 0;

  const viewportHeight = window.innerHeight;
  const sceneStates = scrollScenes.map((scene) => {
    const rect = scene.element.getBoundingClientRect();
    const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
    return { ...scene, progress };
  });

  if (motionPreference.matches) {
    sceneStates.forEach(({ element }) => {
      element.style.removeProperty("--scene-shift");
      element.style.removeProperty("--story-media-shift");
      element.style.removeProperty("--safety-orb-shift");
    });
    return;
  }

  sceneStates.forEach(({ element, name, progress }) => {
    const shift = (0.5 - progress) * 28;
    element.style.setProperty("--scene-shift", `${shift.toFixed(2)}px`);

    if (name === "story") {
      element.style.setProperty("--story-media-shift", `${(0.55 * shift).toFixed(2)}px`);
    }

    if (name === "safety") {
      element.style.setProperty("--safety-orb-shift", `${(0.75 * shift).toFixed(2)}px`);
    }
  });
};

const requestScrollContinuity = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScrollContinuity);
};

if (scrollScenes.length > 0) {
  updateScrollContinuity();
  window.addEventListener("scroll", requestScrollContinuity, { passive: true });
  window.addEventListener("resize", requestScrollContinuity);
  motionPreference.addEventListener?.("change", requestScrollContinuity);
}

// ── Home tour: scroll zooms into the phone, app cards fly out ──
// The section pins its stage (CSS .is-live) for INTRO + CHAPTER + OUTRO
// stage heights of scrolling. Positions are computed per frame from that
// scroll offset: the phone moves from the hero spot to the middle while the
// camera dives into its screen, then the coffee-log chapter flies its cards
// out to slots beside the phone (one at a time on a phone screen) and back. Phone-internal sizes are design pixels of a 390×844 phone,
// scaled as a whole by S. A window under 480px tall keeps the plain layout;
// the check runs again on every resize (a phone turned on its side).
(() => {
  const tour = document.querySelector("[data-tour]");
  if (!tour) return;

  const PHONE_W = 390;
  const PHONE_H = 844;
  const INTRO = 0.9;
  const CHAPTER = 1.6;
  const OUTRO = 0.35;
  const LENGTH = INTRO + CHAPTER + OUTRO;
  const MIN_HEIGHT = 480;

  const stage = tour.querySelector(".tour-stage");
  const hero = tour.querySelector("[data-tour-hero]");
  const device = tour.querySelector(".tour-device");
  const phone = tour.querySelector("[data-phone]");
  const chapterBox = tour.querySelector(".tour-chapters");
  const chapter = tour.querySelector(".tour-chapter");
  const cue = tour.querySelector(".scroll-cue");
  const flies = Array.from(tour.querySelectorAll("[data-fly]")).map((el) => ({
    el,
    // Story order (coffee, where, map), not DOM order: data-step.
    order: Number(el.dataset.step),
    slot: el.dataset.slot,
    // The map card sits in the screen's flow and is visible from the start;
    // the others wait hidden at an origin spot until they fly.
    inFlow: el.parentElement.classList.contains("ph-slot"),
    home: null,
  }));
  // Everything render() writes inline, so leaving live mode can clear it.
  const styled = [hero, device, cue, chapter, ...flies.map((fly) => fly.el), ...flies.map((fly) => fly.el.parentElement)].filter(Boolean);

  // The phone header shows today's date, as the app does.
  const dateSlot = tour.querySelector("[data-today-date]");
  if (dateSlot) {
    const lang = document.documentElement.lang === "en" ? "en-US" : "tr-TR";
    dateSlot.textContent = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const span = (u, from, to) => clamp((u - from) / (to - from));

  let layout = null;
  let frame = 0;
  let needsMeasure = true;
  let lastU = -1;

  // Bottom edge of an absolutely placed text block's visible content, in
  // stage px (its children are laid out inside it; transforms don't count).
  const contentBottom = (box) => {
    let bottom = 0;
    Array.from(box.children).forEach((child) => {
      if (child.offsetParent) bottom = Math.max(bottom, child.offsetTop + child.offsetHeight);
    });
    return box.offsetTop + bottom;
  };

  // Stage geometry for the current viewport: where the phone sits in the
  // hero, zoomed in and in the chapters, and where each card slot is.
  const measure = () => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const top = header ? header.offsetHeight : 0;
    // The CSS places the texts under the header with the same height.
    tour.style.setProperty("--header-h", `${top}px`);
    const mode = W >= 1100 ? "wide" : W >= 721 ? "mid" : "narrow";
    const usable = H - top;
    const gutter = Math.max(24, (W - 1220) / 2);
    const l = { W, H, mode };

    if (mode === "wide") {
      // Phone top just under the header, level with the hero text.
      l.heroS = Math.min((usable * 0.8) / PHONE_H, 1);
      l.heroX = W - gutter - (PHONE_W * l.heroS) / 2 - W * 0.03;
      l.heroY = top + usable * 0.04 + (PHONE_H * l.heroS) / 2;
      l.chS = Math.min((usable - 36) / PHONE_H, 1.08);
      l.chX = W * 0.5;
      l.chY = top + usable / 2;
      const half = (PHONE_W * l.chS) / 2;
      const room = W / 2 - half - gutter - 56;
      const w = Math.min(380, room - 24);
      const right = l.chX + half + 32 + w / 2;
      const left = l.chX - half - 32 - w / 2;
      l.slots = {
        r1: { x: right, y: top + usable * 0.29, w },
        r2: { x: right, y: top + usable * 0.72, w },
        l1: { x: left, y: top + usable * 0.79, w },
      };
    } else {
      // Texts on top: the phone fills the room under the chapter text, and
      // in the hero it waits under the hero text. A floor keeps it visible
      // (overlapping the text) when a short window leaves no room.
      const room = H - (chapterBox.offsetTop + chapter.offsetHeight) - 16 - 14;
      l.chS = Math.max(0.24, Math.min(room / PHONE_H, (W * (mode === "mid" ? 0.5 : 0.64)) / PHONE_W));
      l.chX = W / 2;
      l.chY = H - 14 - (PHONE_H * l.chS) / 2;
      l.heroS = mode === "mid" ? l.chS * 0.9 : l.chS;
      l.heroX = W / 2;
      const heroTop = Math.max(contentBottom(hero) + 20, H - PHONE_H * l.heroS * 0.55);
      l.heroY = heroTop + (PHONE_H * l.heroS) / 2;
      if (mode === "mid") {
        const w = Math.min(340, W * 0.4);
        const half = (PHONE_W * l.chS) / 2;
        const rx = Math.min(W - 16 - w / 2, l.chX + half + w / 2 - 40);
        const lx = Math.max(16 + w / 2, l.chX - half - w / 2 + 40);
        l.slots = {
          r1: { x: rx, y: l.chY - PHONE_H * l.chS * 0.18, w },
          r2: { x: rx, y: l.chY + PHONE_H * l.chS * 0.24, w },
          l1: { x: lx, y: l.chY + PHONE_H * l.chS * 0.05, w },
        };
      } else {
        const slot = { x: W / 2, y: l.chY + PHONE_H * l.chS * 0.12, w: Math.min(340, W - 32) };
        l.slots = { r1: slot, r2: slot, l1: slot };
      }
    }

    // The zoomed-in shot: centred on the top of the Today screen (design
    // y 250, the "Bugün kahve ekle" card), about 1.6× the chapter size.
    l.zoomS = l.chS * (mode === "narrow" ? 1.7 : 1.6);
    l.zoomX = W / 2;
    l.zoomY = H / 2 + (PHONE_H / 2 - 250) * l.zoomS;

    // Where each card sits inside the phone before it flies (design px,
    // relative to the phone's top-left). Transforms do not change offsets.
    flies.forEach((fly) => {
      let x = 0;
      let y = 0;
      let node = fly.el;
      while (node && node !== phone) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      fly.home = { x: x + fly.el.offsetWidth / 2, y: y + fly.el.offsetHeight / 2, w: fly.el.offsetWidth };
    });

    layout = l;
    needsMeasure = false;
    lastU = -1;
  };

  // How far out a card is (0 = home, 1 = at its slot) at chapter time t.
  const flyAmount = (fly, t) => {
    if (layout.mode === "narrow") {
      const seg = 0.86 / flies.length;
      const start = 0.06 + fly.order * seg;
      return ease(span(t, start, start + seg * 0.35)) * (1 - ease(span(t, start + seg * 0.75, start + seg)));
    }
    const start = 0.08 + fly.order * 0.07;
    return ease(span(t, start, start + 0.28)) * (1 - ease(span(t, 0.8, 0.97)));
  };

  const render = () => {
    frame = 0;
    if (!tour.classList.contains("is-live")) return;
    if (needsMeasure) measure();
    const rect = tour.getBoundingClientRect();
    // Nothing to draw while the section is off screen.
    if (rect.bottom < 0 || rect.top > layout.H) return;
    const u = clamp(-rect.top / layout.H, 0, LENGTH);
    if (u === lastU) return;
    lastU = u;
    const reduced = motionPreference.matches;

    // Hero text and the scroll cue leave first.
    const heroOut = span(u, 0.08, 0.55);
    hero.style.opacity = String(1 - heroOut);
    hero.style.transform = reduced ? "" : `translate3d(0, ${(-70 * ease(heroOut)).toFixed(1)}px, 0)`;
    // Hidden once gone, so its links can't be hit through the chapter text.
    hero.style.visibility = heroOut > 0.99 ? "hidden" : "";
    // Half faded, its buttons stop taking clicks and focus.
    hero.inert = heroOut > 0.5;
    if (cue) cue.style.opacity = String(1 - span(u, 0, 0.25));

    // Phone: from the hero spot the camera dives into the screen (zoom), then
    // pulls back to the chapter spot while the first cards fly out of it.
    // Reduced motion: the phone just switches spots halfway through the intro.
    let S;
    let px;
    let py;
    if (reduced) {
      const at = u < INTRO / 2 ? "hero" : "ch";
      S = layout[`${at}S`];
      px = layout[`${at}X`];
      py = layout[`${at}Y`];
    } else {
      const dive = ease(span(u, 0.05, INTRO));
      const back = ease(span(u, INTRO, INTRO + CHAPTER * 0.3));
      S = lerp(lerp(layout.heroS, layout.zoomS, dive), layout.chS, back);
      px = lerp(lerp(layout.heroX, layout.zoomX, dive), layout.chX, back);
      py = lerp(lerp(layout.heroY, layout.zoomY, dive), layout.chY, back);
      S *= 1 - 0.06 * ease(span(u, LENGTH - OUTRO, LENGTH));
    }
    const dx = px - layout.W / 2;
    const dy = py - layout.H / 2;
    device.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${S.toFixed(4)})`;

    // Chapter text only fades: it stays in the accessibility tree and in
    // find-in-page even while transparent. It waits until the camera has
    // pulled back from the screen.
    const t = (u - INTRO) / CHAPTER;
    const inT = span(t, 0.1, 0.26);
    const outT = span(u, LENGTH - OUTRO, LENGTH - 0.05);
    chapter.style.opacity = (inT * (1 - outT)).toFixed(3);
    chapter.style.transform = reduced ? "" : `translate3d(0, ${((1 - inT) * 26 - outT * 26).toFixed(1)}px, 0)`;

    flies.forEach((fly) => {
      const e = flyAmount(fly, t);
      const slot = layout.slots[fly.slot];
      // Slot centre in phone design px: undo the phone's translate and scale.
      const tx = (slot.x - px) / S + PHONE_W / 2 - fly.home.x;
      const ty = (slot.y - py) / S + PHONE_H / 2 - fly.home.y;
      const k = slot.w / (fly.home.w * S);
      // Reduced motion: no flight, the card fades in at its slot.
      const move = reduced ? (e > 0.02 ? 1 : 0) : e;
      const scale = lerp(fly.inFlow ? 1 : 0.5, k, move);
      fly.el.style.transform = `translate3d(${(tx * move).toFixed(1)}px, ${(ty * move).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      if (fly.inFlow) {
        fly.el.style.setProperty("--out", e.toFixed(3));
        fly.el.parentElement.style.setProperty("--out", e.toFixed(3));
      } else {
        fly.el.style.opacity = clamp(e * 2.4).toFixed(3);
      }
    });
  };

  const request = () => {
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  // Live or plain, decided again on every resize.
  const sync = () => {
    const live = window.innerHeight >= MIN_HEIGHT;
    if (live === tour.classList.contains("is-live")) {
      needsMeasure = true;
      request();
      return;
    }
    if (live) {
      tour.style.setProperty("--tour-length", String(LENGTH + 1));
      tour.classList.add("is-live");
      needsMeasure = true;
      request();
    } else {
      tour.classList.remove("is-live");
      tour.style.removeProperty("--tour-length");
      hero.inert = false;
      styled.forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
        el.style.removeProperty("visibility");
        el.style.removeProperty("--out");
      });
    }
  };

  // "Nasıl çalışır?" scrolls to the point where the cards are out: all of
  // them side by side, or the first one (the coffee picker) on a phone.
  tour.addEventListener("click", (event) => {
    const target = event.target.closest("[data-goto]");
    if (!target || !layout || !tour.classList.contains("is-live")) return;
    event.preventDefault();
    const t = layout.mode === "narrow" ? 0.2 : 0.45;
    const top = window.scrollY + tour.getBoundingClientRect().top + (INTRO + CHAPTER * t) * layout.H;
    window.scrollTo({ top, behavior: motionPreference.matches ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", sync);
  motionPreference.addEventListener?.("change", () => {
    lastU = -1;
    request();
  });
  // The layout depends on the header and text heights: measure again when
  // they change (fonts arriving, the header wrapping).
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      needsMeasure = true;
      request();
    });
    [header, hero, chapter].filter(Boolean).forEach((el) => observer.observe(el));
  }
  sync();
  render();

  // Going live makes this section several screens tall. A link that already
  // jumped to a later section (/#yakinda, /#sss) now points too high: jump
  // again to the same target.
  const anchored = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (anchored && !tour.contains(anchored) && tour.classList.contains("is-live")) {
    // "instant": "auto" would follow the page's smooth scroll-behavior.
    anchored.scrollIntoView({ block: "start", behavior: "instant" });
  }
})();
}
