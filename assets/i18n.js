// Language for the pages the app's mail links open (verify-email,
// reset-password, email-verified). English mail links carry ?lang=en; any
// other visit stays Turkish — every link already sitting in an inbox, and
// every Turkish user. Loaded before each page's own script, which reads
// window.coffLang / window.coffT.
//
// English copy sits next to the Turkish in the markup:
//   data-en            → textContent
//   data-en-html       → innerHTML (authored copy with a link in it)
//   data-en-placeholder, data-en-aria-label → those attributes
(function () {
  var lang = new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "tr";
  window.coffLang = lang;
  window.coffT = function (tr, en) { return lang === "en" ? en : tr; };
  if (lang !== "en") return;

  document.documentElement.lang = "en";
  var title = document.querySelector("title[data-en]");
  if (title) document.title = title.getAttribute("data-en");

  function each(selector, apply) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) apply(nodes[i]);
  }
  each("[data-en]", function (el) { if (el.tagName !== "TITLE" && el.tagName !== "META") el.textContent = el.getAttribute("data-en"); });
  each("[data-en-html]", function (el) { el.innerHTML = el.getAttribute("data-en-html"); });
  each("[data-en-placeholder]", function (el) { el.setAttribute("placeholder", el.getAttribute("data-en-placeholder")); });
  each("[data-en-aria-label]", function (el) { el.setAttribute("aria-label", el.getAttribute("data-en-aria-label")); });
  each('meta[name="description"][data-en]', function (el) { el.setAttribute("content", el.getAttribute("data-en")); });
})();
