/* ==========================================================
   AyuVerse — Account Dashboard
   ==========================================================
   Reads/writes the signed-in user's profile doc (Firestore:
   users/{uid}). Full name lives on both the Firebase Auth
   displayName AND this doc; everything else (class, target
   year, phone) only lives in the doc.
   ========================================================== */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
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
  if (!isConfigured) return;

  const app = getApps().length ? getApp() : initializeApp(CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const els = {
    loading: document.getElementById("dashLoading"),
    guest: document.getElementById("dashGuest"),
    content: document.getElementById("dashContent"),
    guestLoginBtn: document.getElementById("dashGuestLoginBtn"),
    avatar: document.getElementById("dashAvatar"),
    name: document.getElementById("dashName"),
    handle: document.getElementById("dashHandle"),
    email: document.getElementById("dashEmail"),
    joined: document.getElementById("dashJoined"),
    provider: document.getElementById("dashProvider"),
    adminBadge: document.getElementById("dashAdminBadge"),
    memberSince: document.getElementById("dashStatSince"),
    accountType: document.getElementById("dashStatType"),
    completeness: document.getElementById("dashStatCompleteness"),
    completenessBar: document.getElementById("dashCompletenessBar"),
    downloads: document.getElementById("dashStatDownloads"),
    fieldsView: document.getElementById("dashFieldsView"),
    fieldsForm: document.getElementById("dashFieldsForm"),
    editBtn: document.getElementById("dashEditBtn"),
    cancelBtn: document.getElementById("dashCancelBtn"),
    saveMsg: document.getElementById("dashSaveMsg"),
    signOutBtn: document.getElementById("dashSignOutBtn"),
    signOutBtn2: document.getElementById("dashSignOutBtn2"),
    providerInline: document.getElementById("dashProviderInline"),
    viewName: document.getElementById("viewName"),
    viewUsername: document.getElementById("viewUsername"),
    viewClass: document.getElementById("viewClass"),
    viewTarget: document.getElementById("viewTarget"),
    viewPhone: document.getElementById("viewPhone"),
    formName: document.getElementById("formName"),
    formClass: document.getElementById("formClass"),
    formTarget: document.getElementById("formTarget"),
    formPhone: document.getElementById("formPhone"),
  };

  const PROVIDER_LABELS = {
    "google.com": "Google",
    password: "Email & password",
    phone: "Mobile (OTP)",
    unknown: "AyuVerse account",
  };

  function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
  }

  function formatDate(value) {
    let d = null;
    if (value && typeof value.toDate === "function") d = value.toDate();
    else if (value) d = new Date(value);
    if (!d || isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  async function ensureProfileDoc(user) {
    const ref = doc(db, "users", user.uid);
    let snap = await getDoc(ref);
    if (!snap.exists()) {
      const provider = (user.providerData[0] && user.providerData[0].providerId) || "unknown";
      await setDoc(ref, {
        name: user.displayName || "",
        username: null,
        email: user.email || null,
        phone: user.phoneNumber || null,
        provider,
        createdAt: serverTimestamp(),
      });
      snap = await getDoc(ref);
    }
    return snap.data() || {};
  }

  function computeCompleteness(profile) {
    const fields = [profile.name, profile.classLevel, profile.targetYear];
    const filled = fields.filter((v) => v !== undefined && v !== null && String(v).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }

  function renderReadView(profile) {
    els.viewName.textContent = profile.name || "Not set";
    els.viewUsername.textContent = profile.username ? `@${profile.username}` : "—";
    els.viewClass.textContent = profile.classLevel || "Not set";
    els.viewTarget.textContent = profile.targetYear || "Not set";
    els.viewPhone.textContent = profile.phone || "Not linked";
  }

  function renderForm(profile) {
    els.formName.value = profile.name || "";
    els.formClass.value = profile.classLevel || "";
    els.formTarget.value = profile.targetYear || "";
    els.formPhone.value = profile.phone || "";
  }

  function render(user, profile) {
    const displayName = profile.name || user.displayName || "AyuVerse Student";
    els.name.textContent = displayName;
    els.handle.textContent = profile.username ? `@${profile.username}` : "";
    els.handle.hidden = !profile.username;
    els.email.textContent = user.email || profile.phone || "No email on file";

    if (user.photoURL) {
      els.avatar.innerHTML = `<img src="${user.photoURL}" alt="" referrerpolicy="no-referrer" />`;
    } else {
      els.avatar.textContent = initials(displayName);
    }

    if (els.adminBadge) {
      const isAdmin = window.AyuPractice && user.uid === window.AyuPractice.ADMIN_UID;
      els.adminBadge.hidden = !isAdmin;
    }

    const providerLabel = PROVIDER_LABELS[profile.provider] || "AyuVerse account";
    els.provider.textContent = providerLabel;
    if (els.providerInline) els.providerInline.textContent = providerLabel;
    const joinedDate = formatDate(profile.createdAt || user.metadata.creationTime);
    els.joined.textContent = `Joined ${joinedDate}`;

    els.memberSince.textContent = joinedDate;
    els.accountType.textContent = providerLabel;

    const pct = computeCompleteness(profile);
    els.completeness.textContent = `${pct}%`;
    els.completenessBar.style.width = `${pct}%`;
    els.downloads.textContent = "Unlocked";

    renderReadView(profile);
    renderForm(profile);
  }

  function toggleEdit(editing) {
    if (editing) {
      hide(els.fieldsView);
      show(els.fieldsForm);
      els.editBtn.hidden = true;
    } else {
      show(els.fieldsView);
      hide(els.fieldsForm);
      els.editBtn.hidden = false;
      els.saveMsg.textContent = "";
      els.saveMsg.classList.remove("is-error");
    }
  }

  function wireEvents(user) {
    els.editBtn.addEventListener("click", () => toggleEdit(true));
    els.cancelBtn.addEventListener("click", () => toggleEdit(false));

    els.fieldsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = els.formName.value.trim();
      const classLevel = els.formClass.value;
      const targetYear = els.formTarget.value.trim();
      const phone = els.formPhone.value.trim();

      if (name.length < 2) {
        els.saveMsg.textContent = "Please enter your full name.";
        els.saveMsg.classList.add("is-error");
        return;
      }

      const saveBtn = els.fieldsForm.querySelector('button[type="submit"]');
      saveBtn.disabled = true;
      els.saveMsg.classList.remove("is-error");
      els.saveMsg.textContent = "Saving…";
      try {
        await updateProfile(user, { displayName: name });
        const ref = doc(db, "users", user.uid);
        const update = { name, classLevel, targetYear };
        if (phone) update.phone = phone;
        await setDoc(ref, update, { merge: true });
        const snap = await getDoc(ref);
        const profile = snap.data() || {};
        render(user, profile);
        toggleEdit(false);
        els.saveMsg.textContent = "Saved.";
      } catch (err) {
        console.error(err);
        els.saveMsg.textContent = "Couldn't save — please try again.";
        els.saveMsg.classList.add("is-error");
      } finally {
        saveBtn.disabled = false;
      }
    });

    const doSignOut = () => { if (window.AyuAuth) window.AyuAuth.logout(); };
    els.signOutBtn.addEventListener("click", doSignOut);
    if (els.signOutBtn2) els.signOutBtn2.addEventListener("click", doSignOut);
  }

  let wired = false;

  onAuthStateChanged(auth, async (user) => {
    hide(els.loading);
    if (!user) {
      hide(els.content);
      show(els.guest);
      return;
    }
    hide(els.guest);
    show(els.content);
    try {
      const profile = await ensureProfileDoc(user);
      render(user, profile);
      if (!wired) {
        wireEvents(user);
        wired = true;
      }
    } catch (err) {
      console.error("AyuVerse dashboard: failed to load profile.", err);
    }
  });

  if (els.guestLoginBtn) {
    els.guestLoginBtn.addEventListener("click", () => {
      if (window.AyuAuth) window.AyuAuth.open();
    });
  }
})();
