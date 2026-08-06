/* AyuVerse Notes Studio - Fixed Async Flow & Storage Handling */
(() => {
  const PAGE_W = 850;
  const PAGE_H = 1100;
  const STORAGE_KEY = "ayuverse-notes-studio-v1";
  const IDB_NAME = "ayuverse-notes-studio";
  const IDB_STORE = "notebook";
  const IDB_RECORD = "main";
  const HISTORY_LIMIT = 60;
  const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
  const GRID_SIZE = 20;

  const NS_PALETTE = [
    "#00c3fa", "#0d7cf5", "#6b28f0", "#f06595",
    "#ff6b6b", "#ffa94d", "#ffd43b", "#51cf66",
    "#f3f4fb", "#1a1a2e",
  ];

  const NS = {
    canvas: null,
    pages: [],
    activeIndex: 0,
    tool: "select",
    color: NS_PALETTE[0],
    strokeWidth: 4,
    zoom: 1,
    pendingPlace: null,
    undoStack: [],
    redoStack: [],
    suppressHistory: false,
    watermarkImg: undefined,
    saveTimer: null,
    snapToGrid: false,
    clipboard: null,
  };

  function setStatus(text) {
    const el = document.getElementById("nsStatus");
    if (el) el.textContent = text;
  }

  function showBusy(text) {
    const busy = document.getElementById("nsBusy");
    const txt = document.getElementById("nsBusyText");
    if (txt) txt.textContent = text;
    if (busy) busy.hidden = false;
  }

  function hideBusy() {
    const busy = document.getElementById("nsBusy");
    if (busy) busy.hidden = true;
  }

  function newPage(overrides) {
    return Object.assign(
      { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), theme: "dark", ruled: true, json: null, thumb: null },
      overrides || {}
    );
  }

  function buildPageBackground(theme, ruled) {
    return new Promise((resolve) => {
      const off = document.createElement("canvas");
      off.width = PAGE_W;
      off.height = PAGE_H;
      const ctx = off.getContext("2d");

      const bg = theme === "dark" ? "#0d0f20" : "#ffffff";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);

      const glow = ctx.createRadialGradient(PAGE_W * 0.1, 0, 0, PAGE_W * 0.1, 0, PAGE_W);
      glow.addColorStop(0, theme === "dark" ? "rgba(107,40,240,0.12)" : "rgba(107,40,240,0.05)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);

      if (ruled) {
        const lineColor = theme === "dark" ? "rgba(184,187,214,0.20)" : "rgba(13,124,245,0.20)";
        const marginColor = theme === "dark" ? "rgba(255,107,107,0.30)" : "rgba(255,107,107,0.40)";
        const top = 74, gap = 34, bottom = PAGE_H - 40;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        for (let y = top; y < bottom; y += gap) {
          ctx.beginPath();
          ctx.moveTo(64, y + 0.5);
          ctx.lineTo(PAGE_W - 40, y + 0.5);
          ctx.stroke();
        }
        ctx.strokeStyle = marginColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(92, 24);
        ctx.lineTo(92, PAGE_H - 24);
        ctx.stroke();
      }

      function paintWatermark(img) {
        ctx.save();
        ctx.globalAlpha = theme === "dark" ? 0.10 : 0.06;
        ctx.translate(PAGE_W / 2, PAGE_H / 2);
        ctx.rotate((-9 * Math.PI) / 180);
        if (img) {
          const w = PAGE_W * 0.46;
          const h = w * (img.height / img.width);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "700 84px 'Space Grotesk', sans-serif";
          ctx.fillStyle = theme === "dark" ? "#ffffff" : "#0d0f20";
          ctx.fillText("AyuVerse", 0, 0);
        }
        ctx.restore();
        resolve(off.toDataURL("image/jpeg", 0.8));
      }

      if (NS.watermarkImg === undefined) {
        const img = new Image();
        img.onload = () => { NS.watermarkImg = img; paintWatermark(img); };
        img.onerror = () => { NS.watermarkImg = null; paintWatermark(null); };
        img.src = "assets/images/logo-full.webp";
      } else {
        paintWatermark(NS.watermarkImg);
      }
    });
  }

  async function refreshActiveBackground() {
    const page = NS.pages[NS.activeIndex];
    if (!page) return;
    const url = await buildPageBackground(page.theme, page.ruled);
    return new Promise((resolve) => {
      fabric.Image.fromURL(url, (img) => {
        NS.canvas.setBackgroundImage(img, () => {
          NS.canvas.renderAll();
          resolve();
        }, { originX: "left", originY: "top" });
      });
    });
  }

  // Database Persistence Fixes
  let dbPromise = null;
  function openDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB unavailable"));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbSet(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Save aborted"));
    });
  }

  async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  function saveCurrentPageState() {
    const page = NS.pages[NS.activeIndex];
    if (!page || !NS.canvas) return;
    const json = NS.canvas.toJSON();
    delete json.background;
    delete json.backgroundImage;
    delete json.overlay;
    delete json.overlayImage;
    page.json = json;
    // Lower JPEG quality thumbnail to preserve storage space
    page.thumb = NS.canvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.15 });
  }

  let saveGeneration = 0;
  function scheduleSave() {
    clearTimeout(NS.saveTimer);
    setStatus("Saving…");
    NS.saveTimer = setTimeout(doSave, 700);
  }

  async function doSave() {
    saveCurrentPageState();
    const myGeneration = ++saveGeneration;
    const payload = {
      pages: NS.pages,
      activeIndex: NS.activeIndex,
      color: NS.color,
      strokeWidth: NS.strokeWidth,
    };
    try {
      await idbSet(IDB_RECORD, payload);
      if (myGeneration !== saveGeneration) return;
      setStatus("All changes saved");
      const warn = document.getElementById("nsSaveWarn");
      if (warn) warn.hidden = true;
    } catch (err) {
      console.error("Autosave error:", err);
      if (myGeneration !== saveGeneration) return;
      setStatus("Error saving data");
      const warn = document.getElementById("nsSaveWarn");
      if (warn) warn.hidden = false;
    }
  }

  async function loadPage(index, isInitial) {
    if (!isInitial) saveCurrentPageState();
    NS.activeIndex = index;
    const page = NS.pages[index];

    NS.suppressHistory = true;
    if (page.json) {
      await new Promise((resolve) => {
        NS.canvas.loadFromJSON(page.json, () => {
          NS.canvas.renderAll();
          resolve();
        });
      });
    } else {
      NS.canvas.clear();
    }

    // Await background completion to prevent stuck promises
    await refreshActiveBackground();

    const snapshot = NS.canvas.toJSON();
    delete snapshot.background;
    delete snapshot.backgroundImage;
    NS.undoStack = [snapshot];
    NS.redoStack = [];
    NS.suppressHistory = false;

    updateThemeRuledUI();
    setTool("select");
    renderPagesList();
  }

  // Safe Export Routine with Guaranteed Unblock
  async function exportNotebookPdf() {
    if (!window.jspdf) {
      alert("PDF library failed to load.");
      return;
    }
    showBusy("Preparing PDF export…");
    try {
      saveCurrentPageState();
      const originalIndex = NS.activeIndex;
      const originalZoom = NS.zoom;
      setZoom(1);

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_W, PAGE_H] });

      for (let i = 0; i < NS.pages.length; i++) {
        showBusy(`Exporting page ${i + 1} of ${NS.pages.length}…`);
        await loadPage(i, true);
        const url = NS.canvas.toDataURL({ format: "jpeg", quality: 0.85, multiplier: 1.5 });
        if (i > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
        doc.addImage(url, "JPEG", 0, 0, PAGE_W, PAGE_H);
      }

      await loadPage(originalIndex, true);
      setZoom(originalZoom);
      doc.save("ayuverse-notes.pdf");
      setStatus("Export complete");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Check console for details.");
    } finally {
      hideBusy(); // Guarantees spinner disappears
    }
  }

  function setTool(tool) {
    NS.tool = tool;
    document.querySelectorAll("#nsTools .ns-tbtn").forEach((b) => b.classList.toggle("is-active", b.dataset.tool === tool));
    NS.canvas.isDrawingMode = false;
    NS.canvas.selection = true;
    NS.canvas.defaultCursor = "default";
    NS.canvas.hoverCursor = "move";
    NS.canvas.forEachObject((o) => (o.selectable = !o.locked));

    if (tool === "pen" || tool === "highlighter") {
      NS.canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(NS.canvas);
      brush.color = tool === "highlighter" ? "rgba(255, 212, 59, 0.35)" : NS.color;
      brush.width = tool === "highlighter" ? Math.max(NS.strokeWidth * 3, 14) : NS.strokeWidth;
      NS.canvas.freeDrawingBrush = brush;
    }
  }

  function renderPagesList() {
    const wrap = document.getElementById("nsPagesList");
    if (!wrap) return;
    wrap.innerHTML = "";
    NS.pages.forEach((p, i) => {
      const item = document.createElement("div");
      item.className = "ns-pagecard" + (i === NS.activeIndex ? " is-active" : "");
      const thumbBg = p.theme === "dark" ? "#0d0f20" : "#ffffff";
      item.innerHTML = `
        <button type="button" class="ns-pagecard__thumb" data-idx="${i}" style="background:${thumbBg}">
          ${p.thumb ? `<img src="${p.thumb}" alt="Page ${i + 1}" />` : ""}
        </button>
        <div class="ns-pagecard__row">
          <span>${i + 1}</span>
        </div>`;
      wrap.appendChild(item);
    });
  }

  function setZoom(z) {
    z = Math.min(2, Math.max(0.4, Math.round(z * 100) / 100));
    NS.zoom = z;
    NS.canvas.setZoom(z);
    NS.canvas.setWidth(PAGE_W * z);
    NS.canvas.setHeight(PAGE_H * z);
    const label = document.getElementById("nsZoomLabel");
    if (label) label.textContent = Math.round(z * 100) + "%";
  }

  function updateThemeRuledUI() {
    const page = NS.pages[NS.activeIndex];
    if (!page) return;
    document.querySelectorAll("#nsThemeToggle .ns-modechip").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.theme === page.theme));
    document.querySelectorAll("#nsRuledToggle .ns-modechip").forEach((b) =>
      b.classList.toggle("is-active", (b.dataset.ruled === "true") === page.ruled));
  }

  async function init() {
    if (typeof fabric === "undefined") {
      setStatus("Fabric engine unavailable.");
      return;
    }
    NS.canvas = new fabric.Canvas("nsCanvas", { selection: true, preserveObjectStacking: true });
    NS.canvas.setWidth(PAGE_W);
    NS.canvas.setHeight(PAGE_H);

    try {
      const saved = await idbGet(IDB_RECORD);
      if (saved && Array.isArray(saved.pages) && saved.pages.length) {
        NS.pages = saved.pages;
        NS.activeIndex = Math.min(saved.activeIndex || 0, NS.pages.length - 1);
      } else {
        NS.pages = [newPage()];
      }
    } catch (e) {
      NS.pages = [newPage()];
    }

    const exportBtn = document.getElementById("nsSaveWarnExport");
    if (exportBtn) exportBtn.addEventListener("click", exportNotebookPdf);

    const exportPdfOpt = document.querySelector('[data-export="pdf"]');
    if (exportPdfOpt) exportPdfOpt.addEventListener("click", exportNotebookPdf);

    await loadPage(NS.activeIndex, true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
