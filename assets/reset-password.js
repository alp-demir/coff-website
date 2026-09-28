(function () {
  var API = "https://api.coffcircle.com/api/auth/reset-password";
  var t = window.coffT;
  var headers = { "Content-Type": "application/json" };
  // Only English asks: the backend answers Turkish without it, and a Turkish
  // visit then sends nothing a pre-English backend's CORS policy would refuse.
  if (window.coffLang === "en") headers["X-Coff-Language"] = "en";
  var openApp = t("coff'u aç", "Open coff");
  var updateLabel = t("Şifremi güncelle", "Update my password");
  var params = new URLSearchParams(window.location.search);
  var token = params.get("token");

  var form = document.getElementById("reset-form");
  var pw = document.getElementById("pw");
  var pw2 = document.getElementById("pw2");
  var bar = document.getElementById("pw-bar");
  var btn = document.getElementById("submit-btn");
  var msg = document.getElementById("msg");
  var postActions = document.getElementById("post-actions");
  var appCta = document.getElementById("app-cta");

  function show(kind, text) {
    msg.className = "reset-msg " + kind;
    msg.textContent = text;
  }

  // Reveal the "open app" / "request new link" button. label + href differ
  // by context so the same element serves success and expired-token states.
  function showAppAction(label, href) {
    appCta.textContent = label;
    appCta.href = href;
    postActions.className = "post-actions show";
  }

  // Show/hide toggle for each password field.
  var toggles = document.querySelectorAll(".pw-toggle");
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener("click", function () {
      var input = document.getElementById(this.getAttribute("data-target"));
      var reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      this.textContent = reveal ? t("Gizle", "Hide") : t("Göster", "Show");
      this.setAttribute("aria-label", reveal ? t("Şifreyi gizle", "Hide password") : t("Şifreyi göster", "Show password"));
    });
  }

  // Lightweight strength meter — purely visual feedback, no gating beyond
  // the 6-char minimum the backend enforces.
  pw.addEventListener("input", function () {
    var v = pw.value, score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[0-9]/.test(v) && /[a-zA-Z]/.test(v)) score++;
    if (/[^a-zA-Z0-9]/.test(v)) score++;
    var pct = [0, 30, 55, 80, 100][score];
    var color = score >= 3 ? "#2e7d52" : score === 2 ? "#c9892e" : "#b3261e";
    bar.style.width = pct + "%";
    bar.style.background = color;
  });

  if (!token) {
    form.style.display = "none";
    show("error", t("Bağlantı geçersiz veya eksik. Lütfen e-postandaki bağlantıyı tekrar aç.", "The link is invalid or incomplete. Please open the link in your email again."));
    showAppAction(openApp, "coff://");
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "reset-msg";

    var p1 = pw.value, p2 = pw2.value;
    if (p1.length < 6) { show("error", t("Şifre en az 6 karakter olmalı.", "Password must be at least 6 characters.")); return; }
    if (p1 !== p2) { show("error", t("Şifreler eşleşmiyor.", "Passwords don't match.")); return; }

    btn.disabled = true;
    btn.textContent = t("Güncelleniyor…", "Updating…");

    fetch(API, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ token: token, newPassword: p1 })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (r) {
        if (r.ok) {
          form.style.display = "none";
          show("success", (r.data && r.data.message) || t("Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.", "Your password is updated. You can sign in with your new password."));
          showAppAction(t("coff'u aç ve giriş yap", "Open coff and sign in"), "coff://");
        } else {
          btn.disabled = false;
          btn.textContent = updateLabel;
          if (r.status === 400) {
            // Covers expired/used token AND "same as current password" — the
            // server message says which; the CTA stays neutral so it never
            // misdirects (user can retry inline or open the app as needed).
            show("error", (r.data && r.data.message) || t("İşlem tamamlanamadı. Bağlantının süresi dolmuş olabilir, uygulamadan yeni bir bağlantı iste.", "Couldn't complete that. The link may have expired; request a new one from the app."));
            showAppAction(openApp, "coff://");
          } else {
            show("error", (r.data && r.data.message) || t("İşlem tamamlanamadı. Tekrar dene.", "Couldn't complete that. Try again."));
          }
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = updateLabel;
        show("error", t("Bağlantı hatası. İnternetini kontrol edip tekrar dene.", "Connection error. Check your internet and try again."));
      });
  });
})();
