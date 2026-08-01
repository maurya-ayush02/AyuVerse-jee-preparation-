/* AyuVerse — registers the service worker on pages that don't load js/script.js */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      /* fails silently on unsupported browsers / file:// */
    });
  });
}
