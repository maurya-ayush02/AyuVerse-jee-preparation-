/* ==========================================================
   AyuVerse — Site-wide authentication
   ==========================================================
   - Browsing the site NEVER requires an account.
   - Only downloads (raw PDFs, quiz PDF, Notes Studio PNG/PDF
     export) require the visitor to be signed in.
   - Sign-in options: Google, Email + Password, Mobile number (OTP).
   - Backed by Firebase Authentication (free "Spark" plan — see
     js/firebase-config.js for one-time setup).
   ========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(function () {
  const CONFIG = window.AYU_FIREBASE_CONFIG || {};
  const isConfigured = CONFIG.apiKey && !/PASTE_YOUR/.test(CONFIG.apiKey);

  let auth = null;
  let db = null;
  let currentUser = null;
  let currentProfileName = null;
  let pendingConfirmation = null; // phone OTP confirmation result
  let downloadReasonPending = false;

  if (isConfigured) {
    try {
      const app = initializeApp(CONFIG);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (err) {
      console.error("AyuVerse auth: Firebase failed to initialize.", err);
    }
  }

  const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

  /* ---------------------------------------------------------
     Modal + nav DOM (built once, injected into every page)
     --------------------------------------------------------- */
  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "ayu-auth-overlay";
    overlay.id = "ayuAuthOverlay";
    overlay.innerHTML = `
      <div class="ayu-auth-modal" role="dialog" aria-modal="true" aria-labelledby="ayuAuthTitle">
        <button type="button" class="ayu-auth-close" id="ayuAuthClose" aria-label="Close">✕</button>
        <h2 class="ayu-auth-title" id="ayuAuthTitle">Sign in to AyuVerse</h2>
        <p class="ayu-auth-sub">Free, always. Signing in just keeps downloads tied to a real account.</p>
        <div class="ayu-auth-reason" id="ayuAuthReason"></div>

        <button type="button" class="ayu-auth-google" id="ayuGoogleBtn">
          <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C40.9 36.5 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <div class="ayu-auth-or">or</div>

        <div class="ayu-auth-tabs">
          <button type="button" class="ayu-auth-tab is-active" data-tab="email">Email</button>
          <button type="button" class="ayu-auth-tab" data-tab="phone">Mobile number</button>
        </div>

        <div class="ayu-auth-error" id="ayuAuthError"></div>

        <form class="ayu-auth-panel is-active" id="ayuEmailPanel" data-panel="email">
          <div class="ayu-auth-field" id="ayuNameField" hidden>
            <label for="ayuFullName">Full name</label>
            <input type="text" id="ayuFullName" autocomplete="name" placeholder="e.g. Ayush Maurya" minlength="2" maxlength="60" />
          </div>
          <div class="ayu-auth-field" id="ayuUsernameField" hidden>
            <label for="ayuUsername">Choose a username</label>
            <input type="text" id="ayuUsername" autocomplete="username" placeholder="e.g. ayush_10" minlength="3" maxlength="20" />
          </div>
          <div class="ayu-auth-field">
            <label for="ayuEmail" id="ayuEmailLabel">Email or username</label>
            <input type="text" id="ayuEmail" autocomplete="email" placeholder="you@example.com or username" required />
          </div>
          <div class="ayu-auth-field">
            <label for="ayuPassword">Password</label>
            <input type="password" id="ayuPassword" autocomplete="current-password" placeholder="At least 6 characters" required minlength="6" />
          </div>
          <button type="submit" class="ayu-auth-submit" id="ayuEmailSubmit">Sign in</button>
          <p class="ayu-auth-switch">
            <span id="ayuEmailSwitchText">New here?</span>
            <button type="button" id="ayuEmailSwitchBtn">Create an account</button>
          </p>
        </form>

        <form class="ayu-auth-panel" id="ayuPhonePanel" data-panel="phone">
          <div class="ayu-auth-field" id="ayuPhoneNumberField">
            <label for="ayuPhone">Mobile number</label>
            <input type="tel" id="ayuPhone" autocomplete="tel" placeholder="+91 98765 43210" required />
          </div>
          <div id="ayuRecaptchaContainer"></div>
          <button type="submit" class="ayu-auth-submit" id="ayuPhoneSendBtn">Send OTP</button>

          <div class="ayu-auth-field" id="ayuOtpField" hidden>
            <label for="ayuOtp">Enter the 6-digit code</label>
            <input type="text" id="ayuOtp" inputmode="numeric" placeholder="123456" />
          </div>
          <button type="button" class="ayu-auth-submit" id="ayuPhoneVerifyBtn" hidden>Verify &amp; sign in</button>
        </form>

        <div class="ayu-auth-guest">
          Just browsing? <button type="button" id="ayuGuestBtn">Continue without an account</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /* ---------------------------------------------------------
     Name-completion prompt
     Shown to any signed-in user whose stored profile doesn't
     have a real name yet (new phone/Google sign-ins with no
     name, or older accounts from before the "Full name" field
     existed, whose name is still just their username handle).
     Keeps nudging until it's actually filled in — that's how
     it gets fixed for every user, not just new signups.
     --------------------------------------------------------- */
  function buildNamePrompt() {
    const overlay = document.createElement("div");
    overlay.className = "ayu-auth-overlay";
    overlay.id = "ayuNamePromptOverlay";
    overlay.innerHTML = `
      <div class="ayu-auth-modal ayu-name-modal" role="dialog" aria-modal="true" aria-labelledby="ayuNamePromptTitle">
        <h2 class="ayu-auth-title" id="ayuNamePromptTitle">What's your name?</h2>
        <p class="ayu-auth-sub">This is shown across AyuVerse instead of your username — takes two seconds.</p>
        <form id="ayuNamePromptForm">
          <div class="ayu-auth-field">
            <label for="ayuNamePromptInput">Full name</label>
            <input type="text" id="ayuNamePromptInput" autocomplete="name" placeholder="e.g. Ayush Maurya" minlength="2" maxlength="60" required />
          </div>
          <div class="ayu-auth-error" id="ayuNamePromptError"></div>
          <button type="submit" class="ayu-auth-submit" id="ayuNamePromptSubmit">Save name</button>
        </form>
        <div class="ayu-auth-guest">
          <button type="button" id="ayuNamePromptSkip">Not now</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function needsName(profile) {
    if (!profile) return false;
    const name = (profile.name || "").trim();
    if (!name) return true;
    const username = (profile.username || "").trim();
    if (username && name.toLowerCase() === username.toLowerCase()) return true;
    return false;
  }

  let namePromptDismissed = false;

  function openNamePrompt() {
    if (namePromptDismissed) return;
    const overlay = document.getElementById("ayuNamePromptOverlay");
    if (!overlay) return;
    document.getElementById("ayuNamePromptError").textContent = "";
    overlay.classList.add("is-open");
    setTimeout(() => document.getElementById("ayuNamePromptInput").focus(), 50);
  }

  function closeNamePrompt() {
    const overlay = document.getElementById("ayuNamePromptOverlay");
    if (overlay) overlay.classList.remove("is-open");
  }

  function wireNamePrompt() {
    const form = document.getElementById("ayuNamePromptForm");
    const skipBtn = document.getElementById("ayuNamePromptSkip");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("ayuNamePromptInput");
      const errEl = document.getElementById("ayuNamePromptError");
      const name = input.value.trim();
      if (name.length < 2) {
        errEl.textContent = "Please enter your full name.";
        errEl.classList.add("is-visible");
        return;
      }
      const submitBtn = document.getElementById("ayuNamePromptSubmit");
      submitBtn.disabled = true;
      try {
        await updateProfile(currentUser, { displayName: name });
        await setDoc(doc(db, "users", currentUser.uid), { name }, { merge: true });
        currentProfileName = name;
        renderNav();
        closeNamePrompt();
      } catch (err) {
        console.error(err);
        errEl.textContent = "Couldn't save — please try again.";
        errEl.classList.add("is-visible");
      } finally {
        submitBtn.disabled = false;
      }
    });
    skipBtn.addEventListener("click", () => {
      namePromptDismissed = true;
      closeNamePrompt();
    });
  }

  function mountNavSlot() {
    let host = document.querySelector(".nav__menu");
    let floating = false;
    if (!host) {
      host = document.querySelector(".topbar, header, .nav-row");
      floating = true;
    }
    const slot = document.createElement("div");
    slot.className = "ayu-auth-slot" + (floating ? " ayu-auth-slot--fixed" : "");
    slot.id = "ayuAuthSlot";
    if (host) host.appendChild(slot);
    else document.body.appendChild(slot);
    return slot;
  }

  /* ---------------------------------------------------------
     UI state
     --------------------------------------------------------- */
  function showError(msg) {
    const el = document.getElementById("ayuAuthError");
    if (!el) return;
    if (!msg) { el.classList.remove("is-visible"); el.textContent = ""; return; }
    el.textContent = msg;
    el.classList.add("is-visible");
  }

  function friendlyError(err) {
    const map = {
      "auth/email-already-in-use": "That email already has an account — try signing in instead.",
      "auth/invalid-email": "That doesn't look like a valid email address.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/user-not-found": "No account with that email — try creating one.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/invalid-phone-number": "That phone number doesn't look right — include the country code, e.g. +91.",
      "auth/invalid-verification-code": "That code doesn't match. Double-check and try again.",
      "auth/popup-closed-by-user": "Sign-in was closed before finishing.",
      "auth/network-request-failed": "Network error — check your connection and try again.",
      "custom/bad-username": "Username should be 3–20 characters: letters, numbers, or underscore only.",
      "custom/need-name": "Please enter your full name.",
      "custom/need-email": "Please enter a valid email address to create your account.",
      "custom/username-taken": "That username is already taken — try another.",
      "custom/username-not-found": "No account with that username. Check the spelling, or sign in with your email instead.",
    };
    return map[err && err.code] || "Something went wrong. Please try again.";
  }

  function openModal(reason) {
    const overlay = document.getElementById("ayuAuthOverlay");
    if (!overlay) return;
    showError("");
    const reasonEl = document.getElementById("ayuAuthReason");
    if (reason === "download") {
      reasonEl.textContent = "Sign in to download this file — it's still 100% free.";
      reasonEl.classList.add("is-visible");
      downloadReasonPending = true;
    } else {
      reasonEl.classList.remove("is-visible");
      downloadReasonPending = false;
    }
    if (!isConfigured) {
      reasonEl.textContent = "Login isn't finished setting up on this site yet — please check back soon.";
      reasonEl.classList.add("is-visible");
    }
    overlay.classList.add("is-open");
  }

  function closeModal() {
    const overlay = document.getElementById("ayuAuthOverlay");
    if (overlay) overlay.classList.remove("is-open");
    showError("");
    resetPhonePanel();
  }

  function resetPhonePanel() {
    pendingConfirmation = null;
    const otpField = document.getElementById("ayuOtpField");
    const verifyBtn = document.getElementById("ayuPhoneVerifyBtn");
    const sendBtn = document.getElementById("ayuPhoneSendBtn");
    const numberField = document.getElementById("ayuPhoneNumberField");
    if (otpField) otpField.hidden = true;
    if (verifyBtn) verifyBtn.hidden = true;
    if (sendBtn) { sendBtn.hidden = false; sendBtn.disabled = false; sendBtn.textContent = "Send OTP"; }
    if (numberField) numberField.hidden = false;
  }

  function renderNav() {
    const slot = document.getElementById("ayuAuthSlot");
    if (!slot) return;
    if (currentUser) {
      const initial = (currentProfileName || currentUser.displayName || currentUser.email || currentUser.phoneNumber || "?").trim().charAt(0).toUpperCase();
      const name = currentProfileName || currentUser.displayName || currentUser.email || currentUser.phoneNumber || "Account";
      slot.innerHTML = `
        <div style="position:relative;">
          <button type="button" class="ayu-auth-user" id="ayuUserBtn">
            ${currentUser.photoURL
              ? `<img class="ayu-auth-avatar" src="${currentUser.photoURL}" alt="" referrerpolicy="no-referrer" />`
              : `<span class="ayu-auth-avatar">${initial}</span>`}
            <span class="ayu-auth-name">${name}</span>
          </button>
          <div class="ayu-auth-menu" id="ayuUserMenu">
            <a href="dashboard.html" id="ayuDashboardLink">Dashboard</a>
            <button type="button" id="ayuLogoutBtn">Log out</button>
          </div>
        </div>
      `;
      document.getElementById("ayuUserBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("ayuUserMenu").classList.toggle("is-open");
      });
      document.getElementById("ayuLogoutBtn").addEventListener("click", () => {
        if (auth) signOut(auth);
      });
    } else {
      slot.innerHTML = `<button type="button" class="ayu-auth-btn ayu-auth-btn--primary" id="ayuLoginBtn">Log in</button>`;
      document.getElementById("ayuLoginBtn").addEventListener("click", () => openModal());
    }
  }

  document.addEventListener("click", () => {
    const menu = document.getElementById("ayuUserMenu");
    if (menu) menu.classList.remove("is-open");
  });

  /* ---------------------------------------------------------
     Wire up modal interactions
     --------------------------------------------------------- */
  function wireModal() {
    document.getElementById("ayuAuthClose").addEventListener("click", closeModal);
    document.getElementById("ayuAuthOverlay").addEventListener("click", (e) => {
      if (e.target.id === "ayuAuthOverlay") closeModal();
    });
    document.getElementById("ayuGuestBtn").addEventListener("click", closeModal);

    // Tabs
    document.querySelectorAll(".ayu-auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".ayu-auth-tab").forEach((t) => t.classList.remove("is-active"));
        document.querySelectorAll(".ayu-auth-panel").forEach((p) => p.classList.remove("is-active"));
        tab.classList.add("is-active");
        document.querySelector(`.ayu-auth-panel[data-panel="${tab.dataset.tab}"]`).classList.add("is-active");
        showError("");
      });
    });

    // Google
    document.getElementById("ayuGoogleBtn").addEventListener("click", async () => {
      if (!requireConfigured()) return;
      showError("");
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        closeModal();
      } catch (err) {
        console.error(err);
        showError(friendlyError(err));
      }
    });

    // Email panel: sign in / sign up toggle
    let emailMode = "signin";
    const nameField = document.getElementById("ayuNameField");
    const usernameField = document.getElementById("ayuUsernameField");
    const emailLabel = document.getElementById("ayuEmailLabel");
    const emailInput = document.getElementById("ayuEmail");
    const switchBtn = document.getElementById("ayuEmailSwitchBtn");
    const switchText = document.getElementById("ayuEmailSwitchText");
    const submitBtn = document.getElementById("ayuEmailSubmit");
    switchBtn.addEventListener("click", () => {
      emailMode = emailMode === "signin" ? "signup" : "signin";
      const isSignup = emailMode === "signup";
      nameField.hidden = !isSignup;
      usernameField.hidden = !isSignup;
      emailLabel.textContent = isSignup ? "Email" : "Email or username";
      emailInput.placeholder = isSignup ? "you@example.com" : "you@example.com or username";
      submitBtn.textContent = isSignup ? "Create account" : "Sign in";
      switchText.textContent = isSignup ? "Already have an account?" : "New here?";
      switchBtn.textContent = isSignup ? "Sign in instead" : "Create an account";
      showError("");
    });

    document.getElementById("ayuEmailPanel").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!requireConfigured()) return;
      showError("");
      const identifier = document.getElementById("ayuEmail").value.trim();
      const password = document.getElementById("ayuPassword").value;
      const fullName = document.getElementById("ayuFullName").value.trim();
      const username = document.getElementById("ayuUsername").value.trim();
      submitBtn.disabled = true;
      try {
        if (emailMode === "signup") {
          if (fullName.length < 2) throw { code: "custom/need-name" };
          if (!USERNAME_RE.test(username)) throw { code: "custom/bad-username" };
          if (!identifier.includes("@")) throw { code: "custom/need-email" };
          const usernameKey = username.toLowerCase();
          const existing = await getDoc(doc(db, "usernames", usernameKey));
          if (existing.exists()) throw { code: "custom/username-taken" };

          // Store the person's real name as their display name — the
          // username stays a separate handle, used only for username
          // sign-in lookups.
          const cred = await createUserWithEmailAndPassword(auth, identifier, password);
          await updateProfile(cred.user, { displayName: fullName });
          await setDoc(doc(db, "usernames", usernameKey), {
            uid: cred.user.uid,
            email: identifier,
          });
          await setDoc(doc(db, "users", cred.user.uid), {
            name: fullName,
            username: username,
            email: identifier,
            provider: "password",
            createdAt: serverTimestamp(),
          });
        } else {
          let email = identifier;
          if (!identifier.includes("@")) {
            const snap = await getDoc(doc(db, "usernames", identifier.toLowerCase()));
            if (!snap.exists()) throw { code: "custom/username-not-found" };
            email = snap.data().email;
          }
          await signInWithEmailAndPassword(auth, email, password);
        }
        closeModal();
      } catch (err) {
        console.error(err);
        showError(friendlyError(err));
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Phone: send OTP
    document.getElementById("ayuPhonePanel").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!requireConfigured()) return;
      if (pendingConfirmation) return; // handled by verify button instead
      showError("");
      const phone = document.getElementById("ayuPhone").value.trim();
      const sendBtn = document.getElementById("ayuPhoneSendBtn");
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending…";
      try {
        if (!window.__ayuRecaptcha) {
          window.__ayuRecaptcha = new RecaptchaVerifier(auth, "ayuRecaptchaContainer", { size: "normal" });
        }
        pendingConfirmation = await signInWithPhoneNumber(auth, phone, window.__ayuRecaptcha);
        document.getElementById("ayuPhoneNumberField").hidden = true;
        sendBtn.hidden = true;
        document.getElementById("ayuOtpField").hidden = false;
        document.getElementById("ayuPhoneVerifyBtn").hidden = false;
      } catch (err) {
        console.error(err);
        showError(friendlyError(err));
        sendBtn.disabled = false;
        sendBtn.textContent = "Send OTP";
      }
    });

    // Phone: verify OTP
    document.getElementById("ayuPhoneVerifyBtn").addEventListener("click", async () => {
      if (!pendingConfirmation) return;
      showError("");
      const code = document.getElementById("ayuOtp").value.trim();
      const verifyBtn = document.getElementById("ayuPhoneVerifyBtn");
      verifyBtn.disabled = true;
      try {
        await pendingConfirmation.confirm(code);
        closeModal();
      } catch (err) {
        console.error(err);
        showError(friendlyError(err));
      } finally {
        verifyBtn.disabled = false;
      }
    });
  }

  /* ---------------------------------------------------------
     Ensure every signed-in user has a users/{uid} profile doc,
     regardless of which sign-in method they used (Google and
     phone sign-ins skip the email/password form, so this is
     where their profile first gets created).
     --------------------------------------------------------- */
  async function ensureUserProfile(user) {
    if (!db || !user) return null;
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data();
      const provider = (user.providerData[0] && user.providerData[0].providerId) || "unknown";
      const profile = {
        name: user.displayName || "",
        username: null,
        email: user.email || null,
        phone: user.phoneNumber || null,
        provider,
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, profile);
      return profile;
    } catch (err) {
      console.error("AyuVerse auth: couldn't create user profile.", err);
      return null;
    }
  }

  function requireConfigured() {
    if (!isConfigured || !auth || !db) {
      showError("Login isn't finished setting up on this site yet — please check back soon.");
      return false;
    }
    return true;
  }

  /* ---------------------------------------------------------
     Global download gate — intercepts before any page-level
     handler runs (capture phase), so nothing downloads unless
     the visitor is signed in.
     --------------------------------------------------------- */
  function wireDownloadGate() {
    document.addEventListener(
      "click",
      (e) => {
        const trigger = e.target.closest('a[download], .rawpdfbtn, #download-pdf-btn, [data-export]');
        if (!trigger) return;
        if (currentUser) return; // signed in, let it proceed
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        openModal("download");
      },
      true
    );
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function init() {
    buildModal();
    buildNamePrompt();
    mountNavSlot();
    wireModal();
    wireNamePrompt();
    wireDownloadGate();
    renderNav();

    if (auth) {
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        currentProfileName = null;
        renderNav();
        if (user) {
          ensureUserProfile(user).then((profile) => {
            if (profile && profile.name) {
              currentProfileName = profile.name;
              renderNav();
            }
            if (needsName(profile)) {
              openNamePrompt();
            }
          });
          if (downloadReasonPending) {
            downloadReasonPending = false;
            closeModal();
          }
        }
      });
    }

    window.AyuAuth = {
      isLoggedIn: () => !!currentUser,
      getUser: () => currentUser,
      open: (reason) => openModal(reason),
      close: closeModal,
      logout: () => auth && signOut(auth),
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
