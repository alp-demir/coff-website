(function () {
  var API = "https://api.coffcircle.com/api/auth/verify-email";
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
    done("error", "Bağlantı geçersiz", "Doğrulama bağlantısı eksik ya da bozuk. E-postandaki bağlantıyı tekrar aç.", "coff'u aç");
    return;
  }

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token })
  })
    .then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function (r) {
      if (r.ok) {
        done("success", "E-posta doğrulandı",
          (r.data && r.data.message) || "Hesabın etkinleştirildi. Uygulamaya dönebilirsin.",
          "coff'u aç");
      } else {
        done("error", "Bağlantı geçersiz",
          (r.data && r.data.message) || "Bu doğrulama bağlantısı geçersiz veya süresi dolmuş. Uygulamadan yeni bir bağlantı iste.",
          "coff'u aç");
      }
    })
    .catch(function () {
      done("error", "Bağlantı hatası",
        "İnternet bağlantını kontrol edip sayfayı yenile.",
        "coff'u aç");
    });
})();
