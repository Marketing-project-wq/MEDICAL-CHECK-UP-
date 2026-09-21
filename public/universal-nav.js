/*
 * 20FIT Universal Navigation Bar — self-contained "app switcher".
 * One file, zero dependencies, no framework. Drop it on ANY 20FIT subdomain:
 *
 *   <div id="universal-nav-20fit"></div>            (optional; auto-created)
 *   <script src="https://<host>/universal-nav.js" defer></script>
 *
 * It renders a thin black bar at the very top of <body> (above the page's own
 * header), a 3-column app-switcher (waffle) menu, and a profile dropdown.
 *
 * Auth is optional and driven by the host page (no shared auth lib required):
 *   window.__20FIT_NAV__ = { user, loginUrl, onLogout }   // read at load
 *   window.__20FIT_NAV_API__.setUser({ name, email, initial })  // after login check
 *   window.__20FIT_NAV_API__.setLogoutHandler(fn)
 * With no user it shows a "Masuk" button -> loginUrl.
 *
 * Icons are inline SVG line icons (no emoji), colored per app.
 */
(function () {
  "use strict";
  if (window.__20FIT_NAV_LOADED__) return;
  window.__20FIT_NAV_LOADED__ = true;

  var MOUNT_ID = "universal-nav-20fit";
  var DEFAULT_LOGIN = "https://my.20fit.id/auth/login";
  var PROFILE = "https://my.20fit.id";

  var MENU_ITEMS = [
    { id: "home", label: "Home", description: "Direktori Olahraga", icon: "home", url: "https://20fit.id", color: "#e5e5e5" },
    { id: "my20fit", label: "My 20FIT", description: "Member Portal", icon: "user", url: "https://my.20fit.id", color: "#818cf8" },
    { id: "recipe", label: "Recipe", description: "Menu & Resep Sehat", icon: "book", url: "https://recipe.20fit.id", color: "#4ade80" },
    { id: "calorie", label: "Calorie Tracker", description: "Hitung Kalori Harian", icon: "flame", url: "https://calorietracker.20fit.id", color: "#fb923c" },
    { id: "mcu", label: "MCU Scanner", description: "Baca Hasil Medical Check-Up", icon: "pulse", url: "https://medicalscanner.20fit.id", color: "#38bdf8" },
    { id: "media", label: "Media", description: "Blog & Artikel", icon: "news", url: "https://media.20fit.id", color: "#a78bfa" },
    { id: "workout", label: "Workout", description: "Streaming Latihan", icon: "dumbbell", url: "https://workout.20fit.id", color: "#f87171" },
    { id: "photo", label: "Photo", description: "Foto Event", icon: "camera", url: "https://photo.20fit.id", color: "#f472b6" },
    { id: "ticket", label: "Ticket", description: "Tiket & Booking", icon: "ticket", url: "https://ticket.20fit.id", color: "#2dd4bf" },
    { id: "talent", label: "Talent", description: "Talent & Event Organizer", icon: "users", url: "https://talent.20fit.id", color: "#60a5fa" },
  ];

  var HOST_MAP = {
    "20fit.id": "home", "www.20fit.id": "home",
    "my.20fit.id": "my20fit",
    "recipe.20fit.id": "recipe", "recepie.20fit.id": "recipe",
    "calorietracker.20fit.id": "calorie",
    "medicalscanner.20fit.id": "mcu",
    "media.20fit.id": "media",
    "workout.20fit.id": "workout",
    "photo.20fit.id": "photo",
    "ticket.20fit.id": "ticket",
    "talent.20fit.id": "talent",
  };

  // Inline SVG inner markup (stroke = currentColor). No emoji.
  var ICON = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h5v-5h4v5h5v-9"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
    flame: '<path d="M12 3c1 3 4 4.3 4 8a4 4 0 0 1-8 0c0-1.4.6-2.4 1.3-3.1C10 8.5 11 6.5 12 3z"/>',
    pulse: '<path d="M3 12h4l2 5 4-12 2 7h6"/>',
    news: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 9h7M7 12h7M7 15h4"/>',
    dumbbell: '<path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5M6.5 12h11"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.1"/><path d="M8.5 7 10 5h4l1.5 2"/>',
    ticket: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M15 6v12" stroke-dasharray="1.6 2.4"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M20.5 19a5.5 5.5 0 0 0-4-5.3"/>',
    waffle: '<circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 11.5h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 7l2.6 1.5M17.2 15.5l2.6 1.5M4.2 17l2.6-1.5M17.2 8.5l2.6-1.5"/>',
    logout: '<path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M3 12h11M11 8l4 4-4 4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  function svg(key, size) {
    return '<svg class="_20fn-svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[key] || "") + "</svg>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Active app: normally detected from the hostname; `forceApp` lets a host page
  // (or a preview/embed) pin it explicitly.
  var currentApp = (window.__20FIT_NAV__ && window.__20FIT_NAV__.forceApp) || HOST_MAP[location.hostname] || null;
  var currentItem = null;
  for (var i = 0; i < MENU_ITEMS.length; i++) if (MENU_ITEMS[i].id === currentApp) currentItem = MENU_ITEMS[i];
  var currentLabel = (currentItem && currentItem.label) || "20FIT";

  var pre = window.__20FIT_NAV__ || {};
  var state = {
    user: pre.user || null,
    loginUrl: pre.loginUrl || DEFAULT_LOGIN,
    onLogout: typeof pre.onLogout === "function" ? pre.onLogout : null,
    open: null, // 'apps' | 'profile' | null
  };

  function initial(u) {
    var n = (u && (u.initial || u.name || u.email)) || "?";
    return String(n).trim().charAt(0).toUpperCase() || "?";
  }

  function injectStyles() {
    if (document.getElementById("_20fn-style")) return;
    var css = [
      "#" + MOUNT_ID + "{--fn-bg:#111;--fn-fg:#fff;--fn-panel:#fff;--fn-ink:#1a1a1a;--fn-muted:#8a8a8a;--fn-line:#ececec;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;position:relative;z-index:9999}",
      "@media (prefers-color-scheme:dark){#" + MOUNT_ID + "{--fn-panel:#1c1c1c;--fn-ink:#f2f2f2;--fn-muted:#9a9a9a;--fn-line:#333}}",
      "._20fn-bar{display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;background:var(--fn-bg);color:var(--fn-fg)}",
      "._20fn-logo{display:flex;align-items:center;gap:7px;color:#fff;text-decoration:none;font-weight:800;letter-spacing:-.02em;font-size:15px}",
      "._20fn-logo b{color:#d62828}",
      "._20fn-label{flex:1;min-width:0;text-align:center;font-size:13px;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "._20fn-btn{display:inline-flex;align-items:center;justify-content:center;background:none;border:0;color:#fff;cursor:pointer;border-radius:9px;width:36px;height:36px;padding:0}",
      "._20fn-btn:hover,._20fn-btn[aria-expanded=true]{background:rgba(255,255,255,.15)}",
      "._20fn-avatar{width:30px;height:30px;border-radius:50%;background:#6366F1;color:#fff;font-weight:700;font-size:13px;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}",
      "._20fn-avatar:hover{box-shadow:0 0 0 2px rgba(255,255,255,.35)}",
      "._20fn-signin{background:#fff;color:#111;border:0;border-radius:7px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer}",
      "._20fn-panel{position:absolute;top:100%;right:8px;background:var(--fn-panel);color:var(--fn-ink);border-radius:0 0 16px 16px;box-shadow:0 10px 34px rgba(0,0,0,.22);z-index:10000;overflow:hidden;animation:_20fnIn .18s ease}",
      "@keyframes _20fnIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}",
      "._20fn-apps{width:min(468px,94vw);padding:14px}",
      "._20fn-apps-head{display:none;align-items:center;justify-content:space-between;margin-bottom:8px}",
      "._20fn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}",
      "._20fn-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;padding:14px 8px;border-radius:12px;text-decoration:none;color:var(--fn-ink);border:2px solid transparent;cursor:pointer}",
      "._20fn-card:hover{background:rgba(128,128,128,.1)}",
      "._20fn-card._active{border-color:currentColor;background:rgba(128,128,128,.12);cursor:default}",
      "._20fn-ico{width:30px;height:30px;display:flex;align-items:center;justify-content:center}",
      "._20fn-card ._20fn-t{font-size:12px;font-weight:700;line-height:1.15;color:var(--fn-ink)}",
      "._20fn-card ._20fn-d{font-size:10px;color:var(--fn-muted);line-height:1.2}",
      "._20fn-here{font-size:9px;color:#16a34a;font-weight:700;margin-top:2px}",
      "._20fn-profile{width:290px;padding:14px}",
      "._20fn-phead{display:flex;gap:11px;align-items:center;margin-bottom:6px}",
      "._20fn-pav{width:44px;height:44px;border-radius:50%;background:#6366F1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex:none}",
      "._20fn-pname{font-weight:700;font-size:14px;color:var(--fn-ink)}",
      "._20fn-pmail{font-size:12px;color:var(--fn-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}",
      "._20fn-sep{border:0;border-top:1px solid var(--fn-line);margin:10px 0}",
      "._20fn-row{display:flex;align-items:center;gap:11px;padding:9px 8px;border-radius:9px;text-decoration:none;color:var(--fn-ink);width:100%;background:none;border:0;cursor:pointer;text-align:left}",
      "._20fn-row:hover{background:rgba(128,128,128,.1)}",
      "._20fn-row ._20fn-ri{width:20px;height:20px;color:var(--fn-muted);flex:none}",
      "._20fn-rt{font-size:13px;font-weight:600}",
      "._20fn-rd{font-size:11px;color:var(--fn-muted)}",
      "._20fn-logout{color:#ef4444}._20fn-logout:hover{background:rgba(239,68,68,.1)}._20fn-logout ._20fn-ri{color:#ef4444}",
      "._20fn-x{display:none}",
      "@media (max-width:639px){",
      "._20fn-apps{position:fixed;inset:0;width:100vw;height:100dvh;border-radius:0;padding:16px;overflow:auto}",
      "._20fn-apps-head{display:flex}",
      "._20fn-apps ._20fn-grid{grid-template-columns:repeat(2,1fr);gap:10px}",
      "._20fn-x{display:inline-flex}",
      "}",
    ].join("");
    var st = document.createElement("style");
    st.id = "_20fn-style";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function appsPanelHtml() {
    var cards = MENU_ITEMS.map(function (m) {
      var active = m.id === currentApp;
      var href = active ? "#" : m.url;
      return (
        '<a class="_20fn-card' + (active ? " _active" : "") + '" href="' + esc(href) + '" data-nav="' + esc(m.id) + '"' +
        (active ? "" : ' rel="noopener"') +
        ' style="color:' + esc(m.color) + '">' +
        '<span class="_20fn-ico">' + svg(m.icon, 28) + "</span>" +
        '<span class="_20fn-t">' + esc(m.label) + "</span>" +
        '<span class="_20fn-d">' + esc(m.description) + "</span>" +
        (active ? '<span class="_20fn-here">Kamu di sini</span>' : "") +
        "</a>"
      );
    }).join("");
    return (
      '<div class="_20fn-panel _20fn-apps" data-panel="apps" role="menu" aria-label="Aplikasi 20FIT">' +
      '<div class="_20fn-apps-head"><strong>Aplikasi 20FIT</strong>' +
      '<button class="_20fn-btn _20fn-x" data-act="close" aria-label="Tutup" style="color:var(--fn-ink)">' + svg("close", 22) + "</button></div>" +
      '<div class="_20fn-grid">' + cards + "</div></div>"
    );
  }

  function profilePanelHtml() {
    var u = state.user;
    var rows = [
      { t: "Profil Saya", d: "Lihat & edit profil", url: PROFILE + "/profile", icon: "user" },
      { t: "Riwayat Pembelian", d: "Semua transaksi di 20FIT", url: PROFILE + "/purchases", icon: "receipt" },
      { t: "Pengaturan Akun", d: "Password, email, keamanan", url: PROFILE + "/settings", icon: "settings" },
    ].map(function (r) {
      return (
        '<a class="_20fn-row" href="' + esc(r.url) + '">' +
        '<span class="_20fn-ri">' + svg(r.icon, 20) + "</span>" +
        '<span><span class="_20fn-rt" style="display:block">' + esc(r.t) + "</span>" +
        '<span class="_20fn-rd">' + esc(r.d) + "</span></span></a>"
      );
    }).join("");
    return (
      '<div class="_20fn-panel _20fn-profile" data-panel="profile" role="menu" aria-label="Profil">' +
      '<div class="_20fn-phead"><span class="_20fn-pav">' + esc(initial(u)) + "</span>" +
      "<span><span class=\"_20fn-pname\" style=\"display:block\">" + esc((u && u.name) || "User") + "</span>" +
      '<span class="_20fn-pmail">' + esc((u && u.email) || "") + "</span></span></div>" +
      '<hr class="_20fn-sep">' + rows + '<hr class="_20fn-sep">' +
      '<button class="_20fn-row _20fn-logout" data-act="logout"><span class="_20fn-ri">' + svg("logout", 20) + '</span><span class="_20fn-rt">Keluar</span></button>' +
      "</div>"
    );
  }

  function rightHtml() {
    if (state.user) {
      return '<button class="_20fn-avatar" data-act="toggle-profile" aria-haspopup="true" aria-expanded="false" aria-label="Profil">' + esc(initial(state.user)) + "</button>";
    }
    return '<button class="_20fn-signin" data-act="signin">Masuk</button>';
  }

  function barHtml() {
    return (
      '<div class="_20fn-bar">' +
      '<a class="_20fn-logo" href="https://20fit.id" aria-label="20FIT — Home">20<b>FIT</b></a>' +
      '<span class="_20fn-label">' + esc(currentLabel) + "</span>" +
      '<button class="_20fn-btn" data-act="toggle-apps" aria-haspopup="true" aria-expanded="false" aria-label="Menu aplikasi 20FIT">' + svg("waffle", 22) + "</button>" +
      rightHtml() +
      "</div>"
    );
  }

  var mount;
  function render() {
    var panels = "";
    if (state.open === "apps") panels = appsPanelHtml();
    else if (state.open === "profile") panels = profilePanelHtml();
    mount.innerHTML = barHtml() + panels;
    var appsBtn = mount.querySelector('[data-act="toggle-apps"]');
    if (appsBtn) appsBtn.setAttribute("aria-expanded", String(state.open === "apps"));
    var profBtn = mount.querySelector('[data-act="toggle-profile"]');
    if (profBtn) profBtn.setAttribute("aria-expanded", String(state.open === "profile"));
  }

  function setOpen(which) {
    state.open = state.open === which ? null : which;
    render();
  }
  function close() {
    if (state.open) {
      state.open = null;
      render();
    }
  }

  function doLogout() {
    if (state.onLogout) {
      try { state.onLogout(); return; } catch (e) { /* fall through to redirect */ }
    }
    location.href = state.loginUrl;
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest("[data-act],[data-nav]") : null;
    if (!t) return;
    var act = t.getAttribute("data-act");
    var nav = t.getAttribute("data-nav");
    if (nav) {
      if (nav === currentApp) { e.preventDefault(); close(); }
      return; // other apps: let the browser follow the href
    }
    if (act === "toggle-apps") { e.preventDefault(); setOpen("apps"); }
    else if (act === "toggle-profile") { e.preventDefault(); setOpen("profile"); }
    else if (act === "close") { e.preventDefault(); close(); }
    else if (act === "signin") { e.preventDefault(); location.href = state.loginUrl; }
    else if (act === "logout") { e.preventDefault(); doLogout(); }
  }

  function wireGlobal() {
    mount.addEventListener("click", onClick);
    document.addEventListener("mousedown", function (e) {
      if (state.open && !mount.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    window.addEventListener("scroll", function () { close(); }, { passive: true });
  }

  function init() {
    mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      mount = document.createElement("div");
      mount.id = MOUNT_ID;
      document.body.insertBefore(mount, document.body.firstChild);
    }
    injectStyles();
    render();
    wireGlobal();
  }

  window.__20FIT_NAV_API__ = {
    setUser: function (u) { state.user = u || null; render(); },
    setLoginUrl: function (url) { if (url) state.loginUrl = url; },
    setLogoutHandler: function (fn) { state.onLogout = typeof fn === "function" ? fn : null; },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
