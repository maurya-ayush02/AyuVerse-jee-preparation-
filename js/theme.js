/* ==========================================================
   AyuVerse — Theme toggle
   Mounts a sun/moon button into the nav on every page.
   js/theme-init.js already set the initial data-theme attr
   before paint; this file just adds the interactive control.
   ========================================================== */
(function () {
  const SUN_ICON =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const MOON_ICON =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function updateMetaThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", currentTheme() === "light" ? "#f4f5fb" : "#060814");
  }

  let btn = null;
  function updateButton() {
    if (!btn) return;
    const isLight = currentTheme() === "light";
    btn.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    btn.setAttribute("aria-pressed", String(isLight));
    btn.innerHTML = isLight ? MOON_ICON : SUN_ICON;
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ayu-theme", theme); } catch (e) {}
    updateButton();
    updateMetaThemeColor();
  }

  function mount() {
    if (document.getElementById("themeToggleBtn")) return;
    const host = document.querySelector(".nav__menu");
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "themeToggleBtn";
    btn.addEventListener("click", () => setTheme(currentTheme() === "light" ? "dark" : "light"));
    if (host) {
      btn.className = "theme-toggle";
      const cta = host.querySelector(".nav__cta");
      if (cta) host.insertBefore(btn, cta);
      else host.appendChild(btn);
    } else {
      // Standalone pages without the shared nav bar get a floating button.
      btn.className = "theme-toggle theme-toggle--floating";
      document.body.appendChild(btn);
    }
    updateButton();
  }

  updateMetaThemeColor();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.AyuTheme = { get: currentTheme, set: setTheme };
})();
