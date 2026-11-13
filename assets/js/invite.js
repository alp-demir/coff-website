// coffcircle.com/d/<CODE> and /en/d/<CODE>: the invite page.
//
// _redirects serves d/index.html (en/d/index.html) for every code with a 200
// rewrite, so the code is read from the address bar. The page then
//   1. asks the API for the inviter's first name (GET /api/public/invites/CODE,
//      first name only, rate-limited per address) and puts it in the title;
//      while that runs, or when it fails, the title stays generic;
//   2. shows the code with a copy button, unless the API says the code is
//      unknown (404), or the path holds no valid code at all;
//   3. tags the store badges so the store consoles count invite installs:
//      App Store pt + ct=invite, Play referrer utm_source=invite,
//      utm_medium=referral, utm_campaign=invite, utm_content=CODE (the Android
//      app reads the code back from the Install Referrer).
// Opening this page connects nobody: the app asks the invited person first.
// Names go in with textContent only. The "Sample view" row on the page is fixed
// sample people (Addendum 5): the real inviter's name goes in the title and
// avatar only, never next to an invented coffee.
(() => {
  const API = "https://api.coffcircle.com/api/public/invites/";
  // App Store Connect provider token; --check keeps it equal to sync-chrome.mjs.
  const APP_STORE_PT = "128945825";
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const CODE_SHAPE = new RegExp(`^[${ALPHABET}]{6}$`);
  const TIMEOUT_MS = 6000;

  const lang = document.documentElement.lang === "en" ? "en" : "tr";
  const COPY = {
    tr: { title: (name) => `${name} seni Coff’a davet ediyor` },
    en: { title: (name) => `${name} invites you to Coff` },
  }[lang];

  const match = window.location.pathname.match(/^\/(?:en\/)?d\/([^/]+)\/?$/);
  let raw = "";
  try {
    raw = match ? decodeURIComponent(match[1]) : "";
  } catch {
    raw = "";
  }
  const candidate = raw.trim().toUpperCase();
  const code = CODE_SHAPE.test(candidate) ? candidate : null;

  const title = document.getElementById("inviteTitle");
  const avatar = document.getElementById("inviteAvatar");
  const codeCard = document.getElementById("inviteCodeCard");
  const codeOut = document.getElementById("inviteCode");
  const copyButton = document.getElementById("inviteCopy");
  const otherLang = document.getElementById("inviteOtherLang");

  if (code && otherLang) otherLang.href = `${otherLang.getAttribute("href")}${code}`;

  // Store links, tagged once; a code that is unknown still gets the invite
  // campaign, without utm_content.
  const tagStores = (withCode) => {
    document.querySelectorAll('[data-sync="stores"] a[href]').forEach((link) => {
      let target;
      try {
        target = new URL(link.href);
      } catch {
        return;
      }
      if (target.hostname === "apps.apple.com") {
        if (APP_STORE_PT) target.searchParams.set("pt", APP_STORE_PT);
        target.searchParams.set("ct", "invite");
        // The Turkish page links the /tr/ storefront; a shared link opens the
        // friend's own store.
        target.pathname = target.pathname.replace(/^\/[a-z]{2}\//, "/");
      } else if (target.hostname === "play.google.com") {
        const referrer = new URLSearchParams({
          utm_source: "invite",
          utm_medium: "referral",
          utm_campaign: "invite",
        });
        if (withCode) referrer.set("utm_content", withCode);
        target.searchParams.set("referrer", referrer.toString());
      }
      link.href = target.toString();
    });
  };

  const showCode = () => {
    if (!code || !codeCard) return;
    codeOut.textContent = code;
    codeCard.hidden = false;
  };

  const showName = (name) => {
    title.textContent = COPY.title(name);
    const initial = Array.from(name)[0].toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");
    avatar.textContent = initial;
  };

  if (copyButton) {
    const idle = copyButton.textContent;
    let timer = null;
    copyButton.addEventListener("click", async () => {
      if (!code) return;
      let copied = false;
      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        // Older in-app browsers: select the code so a long press copies it.
        const range = document.createRange();
        range.selectNodeContents(codeOut);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (!copied) return;
      copyButton.textContent = copyButton.dataset.done;
      clearTimeout(timer);
      timer = setTimeout(() => {
        copyButton.textContent = idle;
      }, 2000);
    });
  }

  if (!code) {
    // Not a code at all: the page without a name and without the code card.
    tagStores(null);
    return;
  }

  tagStores(code);

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  fetch(API + encodeURIComponent(code), {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    signal: controller ? controller.signal : undefined,
  })
    .then(async (response) => {
      if (response.status === 404) {
        // Unknown or no longer available: no name, no code card.
        tagStores(null);
        return;
      }
      showCode();
      if (!response.ok) return;
      const body = await response.json();
      const name = typeof body.inviterFirstName === "string" ? body.inviterFirstName.trim() : "";
      if (name) showName(name);
    })
    .catch(() => {
      // Network failure or timeout: generic title, the code stays usable.
      showCode();
    })
    .finally(() => {
      if (timeout) clearTimeout(timeout);
    });
})();
