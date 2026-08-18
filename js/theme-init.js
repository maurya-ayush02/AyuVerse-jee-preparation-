/* ==========================================================
   AyuVerse — Theme bootstrap
   Runs synchronously, before CSS paints, so the page never
   flashes the wrong theme. Keep this file tiny and fast.
   ========================================================== */
(function () {
  try {
    var stored = localStorage.getItem("ayu-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
