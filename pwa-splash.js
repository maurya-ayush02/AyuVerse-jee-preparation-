/* AyuVerse — PWA launch animation.
   Plays a short logo animation only when the site is opened as an
   installed app (standalone display mode) — never in a normal
   browser tab, and only once per session so it doesn't repeat on
   every in-app page navigation. Pure inline-style transitions are
   used (no <style> tag), so this works regardless of each page's
   CSP style-src setting. */
(function () {
  var isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  if (!isStandalone) return;

  try {
    if (sessionStorage.getItem("ayuverse-splash-shown")) return;
    sessionStorage.setItem("ayuverse-splash-shown", "1");
  } catch (e) {
    /* sessionStorage unavailable — fall through and show it once anyway */
  }

  function showSplash() {
    var overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;" +
      "align-items:center;justify-content:center;background:#070a14;" +
      "opacity:1;transition:opacity .45s ease;";

    var logo = document.createElement("img");
    logo.src = "assets/images/icon-mark.webp";
    logo.alt = "AyuVerse";
    logo.style.cssText =
      "width:96px;height:96px;opacity:0;transform:scale(.7);" +
      "transition:opacity .45s ease,transform .45s cubic-bezier(.34,1.56,.64,1);";

    overlay.appendChild(logo);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        logo.style.opacity = "1";
        logo.style.transform = "scale(1)";
      });
    });

    setTimeout(function () {
      overlay.style.opacity = "0";
      setTimeout(function () {
        overlay.remove();
      }, 450);
    }, 850);
  }

  if (document.body) {
    showSplash();
  } else {
    document.addEventListener("DOMContentLoaded", showSplash);
  }
})();
