(function () {
  var API = "https://api.coffcircle.com/api/auth/reset-password";
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
      this.textContent = reveal ? "Gizle" : "Göster";
      this.setAttribute("aria-label", reveal ? "Şifreyi gizle" : "Şifreyi göster");
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
    show("error", "Bağlantı geçersiz veya eksik. Lütfen e-postandaki bağlantıyı tekrar aç.");
    showAppAction("coff'u aç", "coff://");
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "reset-msg";

    var p1 = pw.value, p2 = pw2.value;
    if (p1.length < 6) { show("error", "Şifre en az 6 karakter olmalı."); return; }
    if (p1 !== p2) { show("error", "Şifreler eşleşmiyor."); return; }

    btn.disabled = true;
    btn.textContent = "Güncelleniyor…";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          show("success", (r.data && r.data.message) || "Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.");
          showAppAction("coff'u aç ve giriş yap", "coff://");
        } else {
          btn.disabled = false;
          btn.textContent = "Şifremi güncelle";
          if (r.status === 400) {
            // Covers expired/used token AND "same as current password" — the
            // server message says which; the CTA stays neutral so it never
            // misdirects (user can retry inline or open the app as needed).
            show("error", (r.data && r.data.message) || "İşlem tamamlanamadı. Bağlantının süresi dolmuş olabilir, uygulamadan yeni bir bağlantı iste.");
            showAppAction("coff'u aç", "coff://");
          } else {
            show("error", (r.data && r.data.message) || "İşlem tamamlanamadı. Tekrar dene.");
          }
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Şifremi güncelle";
        show("error", "Bağlantı hatası. İnternetini kontrol edip tekrar dene.");
      });
  });
})();
