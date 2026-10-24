// The printed QR codes: coffcircle.com/q/<material>-<platform>, /kart and the
// older /ios and /android. Sends the visitor on to the same target _redirects
// would (generated into _scan-targets.js by tools/website/sync-chrome.mjs),
// then reports the scan to the backend in the background, so a slow or down
// API never delays or breaks a scan; a failed report is only a scan not
// counted.
//
// If the daily Functions quota runs out, Pages fails open by default (the
// project setting): requests skip the Function and get the static site and
// _redirects, so the printed links keep working, uncounted.
//
// _routes.json limits this Function to those paths (and /functions/*, which
// it answers 404 so its own source is not served as a static file). Every
// other request stays plain static files and _redirects. Pages applies
// neither _redirects nor _headers to a response a Function makes, so
// sync-chrome.mjs generates both the targets and the /* headers from those
// files into _scan-targets.js.
import { SCAN_TARGETS, SECURITY_HEADERS } from "./_scan-targets.js";

const SCAN_API = "https://api.coffcircle.com/api/qr/scan";
// Link previews (WhatsApp, iMessage, Telegram, social cards), crawlers,
// scripts and monitors fetch a URL with nobody behind it; they get the
// redirect but are not counted. Any "...bot" token except CUBOT, a phone
// brand; app names alone (Pinterest) are left out, because their in-app
// browsers are people tapping. An empty user agent is a script too.
const NOT_A_PERSON = /(?<!cu)bot\b|crawl|spider|slurp|facebookexternalhit|whatsapp|embedly|skypeuripreview|curl\/|wget\/|python|go-http|headless|uptimerobot|^$/i;
// Only the live site reports. Branch previews (*.pages.dev) and local runs
// redirect the same way but would otherwise land in the production counts.
const LIVE_HOSTS = ["coffcircle.com", "www.coffcircle.com"];
let warnedUnusableKey = false;

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "");
  if (path === "functions" || path.startsWith("functions/")) {
    return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
  }
  const target = SCAN_TARGETS[path];
  if (!target) return context.next();

  // Browsers prefetch or prerender links they expect a tap on (Sec-Purpose,
  // older Purpose); nobody scanned anything yet.
  const purpose = `${request.headers.get("sec-purpose") || ""} ${request.headers.get("purpose") || ""}`;
  const counted = request.method === "GET"
    && LIVE_HOSTS.includes(url.hostname)
    && !NOT_A_PERSON.test(request.headers.get("user-agent") || "")
    && !/prefetch|prerender/i.test(purpose);
  if (counted) {
    const code = path.replace(/^q\//, "");
    // Only the code goes out: nothing about the visitor, so the count is
    // scans, repeats included, never people.
    // QR_SCAN_KEY, a Pages secret, matches the backend's QR_SCAN_KEY; once
    // both are set, only this Function can count. Without it the report goes
    // out unsigned, which the backend accepts until its key is set. The key is
    // printable ASCII (openssl rand -hex 32); a secret that is not is left
    // off rather than let fetch throw unseen, so the backend counts the
    // report as one without a key and its WARN shows the problem.
    const headers = { "Content-Type": "application/json" };
    // ASCII whitespace only, as the backend trims its copy.
    const scanKey = (context.env?.QR_SCAN_KEY || "").replace(/^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g, "");
    if (/^[\x21-\x7e]+$/.test(scanKey)) headers["X-Coff-Scan-Key"] = scanKey;
    else if (scanKey && !warnedUnusableKey) {
      warnedUnusableKey = true; // once per isolate, not once per scan
      console.warn("QR_SCAN_KEY is not printable ASCII without spaces; scans reported without it");
    }
    context.waitUntil(
      fetch(SCAN_API, { method: "POST", headers, body: JSON.stringify({ code }) }).catch(() => {}),
    );
  }

  // 302 and no-store, like _redirects: the target follows STORE_STATE.
  return new Response(null, {
    status: 302,
    headers: { ...SECURITY_HEADERS, Location: new URL(target, url).toString(), "Cache-Control": "no-store" },
  });
}
