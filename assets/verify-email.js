(function () {
  var API = "https://api.coffcircle.com/api/auth/verify-email";
  var t = window.coffT;
  var headers = { "Content-Type": "application/json" };
  // Only English asks: the backend answers Turkish without it, and a Turkish
  // visit then sends nothing a pre-English backend's CORS policy would refuse.
  if (window.coffLang === "en") headers["X-Coff-Language"] = "en";
  var openApp = t("Coff Circle'ı aç", "Open Coff Circle");
  var params = new URLSearchParams(window.location.search);
  var token = params.get("token");

  var icon = document.getElementById("icon");
  var title = document.getElementById("title");
  var lead = document.getElementById("lead");
  var postActions = document.getElementById("post-actions");
  var appCta = document.getElementById("app-cta");

  function done(kind, heading, text, ctaLabel) {
    icon.className = "verify-icon " + kind;
    icon.textContent = kind === "success" ? "✓" : "✕";
    title.textContent = heading;
    lead.textContent = text;
    appCta.textContent = ctaLabel;
    // On success, deep-link to the verified route so a same-device app
    // flips its "verify your email" gate immediately; errors just open app.
    appCta.href = kind === "success" ? "coff://email-verified" : "coff://";
    postActions.className = "post-actions show";
  }

  if (!token) {
    done("error", t("Bağlantı geçersiz", "Invalid link"), t("Doğrulama bağlantısı eksik ya da bozuk. E-postandaki bağlantıyı tekrar aç.", "The verification link is missing or broken. Open the link in your email again."), openApp);
    return;
  }

  fetch(API, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ token: token })
  })
    .then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function (r) {
      if (r.ok) {
        done("success", t("E-posta doğrulandı", "Email verified"),
          (r.data && r.data.message) || t("Hesabın etkinleştirildi. Uygulamaya dönebilirsin.", "Your account is active. You can go back to the app."),
          openApp);
      } else {
        done("error", t("Bağlantı geçersiz", "Invalid link"),
          (r.data && r.data.message) || t("Bu doğrulama bağlantısı geçersiz veya süresi dolmuş. Uygulamadan yeni bir bağlantı iste.", "This verification link is invalid or has expired. Request a new one from the app."),
          openApp);
      }
    })
    .catch(function () {
      done("error", t("Bağlantı hatası", "Connection error"),
        t("İnternet bağlantını kontrol edip sayfayı yenile.", "Check your internet connection and refresh the page."),
        openApp);
    });
})();
