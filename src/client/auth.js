// Built-in auth for medicalscanner.20fit.id. Hydrates the /login, /register,
// /reset-password and /auth/callback shells (src/views/authPages.js) and talks
// to Supabase Auth directly with the app's existing supabase-js client — the
// SAME project as my.20fit.id, so accounts and the shared profile trigger are
// reused, and a scan saved here still shows on my.20fit.id/mcu.
//
// No new user table, no separate auth: signUp/signIn go through Supabase; the
// public.profiles + public.my20fit_profile rows are created by the shared
// on-auth.users trigger. Consent is stored in the user's auth metadata (no
// schema change). The SSO relay (sso-generate/consume) is untouched.

import { safeNextPath } from "/shared/returnTo.js";

const CONSENT_VERSION = "pdp-2022-v1";

export function setupAuth(root, { supabase, lang }) {
  const page = root.getAttribute("data-auth-page");
  const L = lang === "id" ? "id" : "en";
  const a = STRINGS(L);
  const defaultDest = L === "id" ? "/id/check-mcu" : "/check-mcu";

  const errEl = root.querySelector('[data-role="error"]');
  const noteEl = root.querySelector('[data-role="note"]');

  function showError(msg) {
    if (noteEl) noteEl.hidden = true;
    if (!errEl) return;
    errEl.textContent = msg || a.errGeneric;
    errEl.hidden = false;
  }
  function showNote(msg) {
    if (errEl) errEl.hidden = true;
    if (!noteEl) return;
    noteEl.textContent = msg;
    noteEl.hidden = false;
  }
  function clearMsgs() {
    if (errEl) errEl.hidden = true;
    if (noteEl) noteEl.hidden = true;
  }

  // Where to land after success: a validated internal path, else the uploader.
  function dest() {
    return safeNextPath(root.getAttribute("data-next") || "", defaultDest) || defaultDest;
  }
  const val = (name) => {
    const el = root.querySelector(`[data-role="${name}"]`);
    return el ? el.value.trim() : "";
  };
  const busy = (on, btn) => {
    if (!btn) return;
    btn.disabled = on;
    btn.classList.toggle("is-busy", on);
  };

  if (!supabase) {
    showError(a.errGeneric);
    return;
  }

  function mapError(err) {
    const m = ((err && (err.message || err.error_description)) || "").toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return a.errInvalidCreds;
    if (m.includes("not confirmed")) return a.errEmailNotConfirmed;
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already")) return a.errEmailExists;
    if (m.includes("at least 6") || m.includes("password should be") || m.includes("weak password")) return a.errWeakPassword;
    if (m.includes("unable to validate email") || m.includes("invalid email") || m.includes("invalid format")) return a.errEmailInvalid;
    return a.errGeneric;
  }

  async function startGoogle() {
    clearMsgs();
    const redirectTo = `${location.origin}/auth/callback` + (dest() !== defaultDest ? `?next=${encodeURIComponent(dest())}` : "");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) showError(a.errOAuth);
    } catch {
      showError(a.errOAuth);
    }
  }

  // Redeem whatever token the URL carries (OAuth ?code=, or an implicit
  // #access_token fragment) into a session. Returns true on success.
  async function redeemUrlToken() {
    const qs = new URLSearchParams(location.search);
    const code = qs.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return !error;
    }
    const hash = location.hash || "";
    if (hash.includes("access_token")) {
      const hp = new URLSearchParams(hash.replace(/^#/, ""));
      const access_token = hp.get("access_token");
      const refresh_token = hp.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        return !error;
      }
    }
    return false;
  }

  const wire = (sel, ev, fn) => {
    const el = root.querySelector(sel);
    if (el) el.addEventListener(ev, fn);
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (page === "login") {
    wire('[data-act="google"]', "click", startGoogle);
    wire('[data-role="form"]', "submit", async (e) => {
      e.preventDefault();
      clearMsgs();
      const email = val("email");
      const password = val("password");
      if (!email || !password) return showError(a.errRequired);
      const btn = root.querySelector('[data-act="submit"]');
      busy(true, btn);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          busy(false, btn);
          return showError(mapError(error));
        }
        showNote(a.redirecting);
        location.assign(dest());
      } catch {
        busy(false, btn);
        showError(a.errGeneric);
      }
    });
    return;
  }

  // ── REGISTER ─────────────────────────────────────────────────────────────
  if (page === "register") {
    wire('[data-act="google"]', "click", startGoogle);
    wire('[data-role="form"]', "submit", async (e) => {
      e.preventDefault();
      clearMsgs();
      const full_name = val("name");
      const email = val("email");
      const password = val("password");
      const consentEl = root.querySelector('[data-role="consent"]');
      const consented = Boolean(consentEl && consentEl.checked);
      if (!email || !password) return showError(a.errRequired);
      if (!consented) return showError(a.consentRequired);
      const btn = root.querySelector('[data-act="submit"]');
      busy(true, btn);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              full_name: full_name || undefined,
              // Consent captured at registration, stored in auth metadata
              // (no schema change) — the shared profile trigger ignores extras.
              mcu_health_consent_at: new Date().toISOString(),
              mcu_health_consent_version: CONSENT_VERSION,
              app_source: "medicalscanner",
            },
          },
        });
        if (error) {
          busy(false, btn);
          return showError(mapError(error));
        }
        // Session present → auto-confirmed → straight to the uploader.
        if (data && data.session) {
          showNote(a.redirecting);
          location.assign(dest());
          return;
        }
        // No session → email confirmation is on; tell them to verify.
        busy(false, btn);
        const form = root.querySelector('[data-role="form"]');
        if (form) form.hidden = true;
        showNote(a.verifyEmailTitle + " — " + a.verifyEmailDesc);
      } catch {
        busy(false, btn);
        showError(a.errGeneric);
      }
    });
    return;
  }

  // ── RESET PASSWORD (request + set-new, one page) ─────────────────────────
  if (page === "reset") {
    const requestBox = root.querySelector('[data-role="reset-request"]');
    const newpassBox = root.querySelector('[data-role="reset-newpass"]');
    const showNewPass = () => {
      if (requestBox) requestBox.hidden = true;
      if (newpassBox) newpassBox.hidden = false;
    };

    // Arriving from a recovery email link carries a token → switch to set-new.
    (async () => {
      const hasToken = new URLSearchParams(location.search).get("code") || (location.hash || "").includes("access_token");
      if (hasToken) {
        const ok = await redeemUrlToken();
        history.replaceState(null, "", location.pathname);
        if (ok) showNewPass();
        else showError(a.errRecoveryExpired);
      }
    })();

    wire('[data-role="form-request"]', "submit", async (e) => {
      e.preventDefault();
      clearMsgs();
      const email = val("email");
      if (!email) return showError(a.errRequired);
      const btn = root.querySelector('[data-act="reset-request"]');
      busy(true, btn);
      try {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` });
      } catch {
        /* never reveal whether the email exists */
      }
      busy(false, btn);
      showNote(a.resetSent);
    });

    wire('[data-role="form-newpass"]', "submit", async (e) => {
      e.preventDefault();
      clearMsgs();
      const password = val("password");
      if (!password) return showError(a.errRequired);
      const btn = root.querySelector('[data-act="reset-newpass"]');
      busy(true, btn);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          busy(false, btn);
          return showError(mapError(error));
        }
        showNote(a.redirecting);
        location.assign(defaultDest);
      } catch {
        busy(false, btn);
        showError(a.errGeneric);
      }
    });
    return;
  }

  // ── OAUTH / EMAIL-CONFIRM CALLBACK ───────────────────────────────────────
  if (page === "callback") {
    (async () => {
      const ok = await redeemUrlToken();
      if (ok) {
        location.assign(dest());
      } else {
        showError(a.errOAuth);
      }
    })();
    return;
  }
}

// Auth copy is duplicated here (tiny) so this module stays independent of the
// server i18n shape; keep in sync with src/shared/i18n.js `auth`.
function STRINGS(lang) {
  const id = {
    errInvalidCreds: "Email atau kata sandi salah.",
    errEmailNotConfirmed: "Email belum diverifikasi. Cek inbox kamu untuk tautan verifikasi.",
    errEmailExists: "Email ini sudah terdaftar. Silakan masuk.",
    errWeakPassword: "Kata sandi terlalu lemah (minimal 6 karakter).",
    errEmailInvalid: "Format email tidak valid.",
    errRequired: "Lengkapi semua kolom dulu ya.",
    errGeneric: "Terjadi kesalahan. Coba lagi.",
    errOAuth: "Gagal masuk dengan Google. Coba lagi.",
    errRecoveryExpired: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
    consentRequired: "Kamu harus menyetujui pemrosesan data kesehatan untuk mendaftar.",
    redirecting: "Berhasil. Mengalihkan…",
    verifyEmailTitle: "Cek email kamu",
    verifyEmailDesc: "Kami mengirim tautan verifikasi ke emailmu. Klik untuk mengaktifkan akun, lalu masuk.",
    resetSent: "Kalau email kamu terdaftar, tautan reset sudah dikirim. Cek inbox (dan folder spam).",
  };
  const en = {
    errInvalidCreds: "Wrong email or password.",
    errEmailNotConfirmed: "Email not verified yet. Check your inbox for the verification link.",
    errEmailExists: "This email is already registered. Please log in.",
    errWeakPassword: "Password is too weak (at least 6 characters).",
    errEmailInvalid: "Invalid email format.",
    errRequired: "Please fill in all fields.",
    errGeneric: "Something went wrong. Please try again.",
    errOAuth: "Google sign-in failed. Please try again.",
    errRecoveryExpired: "This reset link is invalid or expired. Request a new one.",
    consentRequired: "You must agree to health-data processing to sign up.",
    redirecting: "Success. Redirecting…",
    verifyEmailTitle: "Check your email",
    verifyEmailDesc: "We sent a verification link to your email. Click it to activate your account, then log in.",
    resetSent: "If your email is registered, a reset link is on its way. Check your inbox (and spam).",
  };
  return lang === "id" ? id : en;
}
