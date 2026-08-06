/* AyuVerse Notes Studio
   A canvas note-making tool: pen/highlighter/eraser/text/shapes, per-page
   dark or light theme with a translucent watermark, lined or plain ruling,
   image import from the gallery, PDF import (renders each PDF page as a
   locked background image you can annotate over), undo/redo, zoom, and
   PNG/PDF export. Everything is stored in this browser's localStorage —
   there is no backend, so nothing here ever leaves the device. */
(() => {
  const PAGE_W = 850;
  const PAGE_H = 1100;
  const STORAGE_KEY = "ayuverse-notes-studio-v1"; // legacy localStorage key, migrated on first load
  const IDB_NAME = "ayuverse-notes-studio";
  const IDB_STORE = "notebook";
  const IDB_RECORD = "main";
  const HISTORY_LIMIT = 60;
  const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

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
    watermarkImg: undefined, // undefined = not attempted yet, null = failed, Image = ready
    saveTimer: null,
  };

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------
  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function newPage(overrides) {
    return Object.assign(
      { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), theme: "dark", ruled: true, json: null, thumb: null },
      overrides || {}
    );
  }

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

  function downloadDataUrl(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------------------------------------------------------------------
  // Page background (theme + ruling + translucent watermark), rendered to
  // an offscreen canvas and handed to fabric as the page's background image.
  // ---------------------------------------------------------------------
  function buildPageBackground(theme, ruled) {
    return new Promise((resolve) => {
      const off = document.createElement("canvas");
      off.width = PAGE_W;
      off.height = PAGE_H;
      const ctx = off.getContext("2d");

      const bg = theme === "dark" ? "#0d0f20" : "#ffffff";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);

      // faint brand glow in the corner, echoing the site's own background
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
        resolve(off.toDataURL("image/png"));
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

  function refreshActiveBackground() {
    const page = NS.pages[NS.activeIndex];
    return buildPageBackground(page.theme, page.ruled).then(
      (url) =>
        new Promise((resolve) => {
          fabric.Image.fromURL(url, (img) => {
            NS.canvas.setBackgroundImage(img, () => {
              NS.canvas.renderAll();
              resolve();
            }, { originX: "left", originY: "top" });
          });
        })
    );
  }

  // ---------------------------------------------------------------------
  // Persistence — IndexedDB (localStorage's ~5-10MB quota was getting hit by
  // Fabric JSON + page thumbnails + PDF page images; IndexedDB has a much
  // higher, browser-managed quota and doesn't block the main thread).
  // ---------------------------------------------------------------------
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

  async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
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
      pages: NS.pages, activeIndex: NS.activeIndex, color: NS.color, strokeWidth: NS.strokeWidth,
    };
    try {
      await idbSet(IDB_RECORD, payload);
      if (myGeneration !== saveGeneration) return; // a newer save already landed
      setStatus("All changes saved");
      hideSaveWarning();
    } catch (err) {
      console.error("Autosave failed:", err);
      if (myGeneration !== saveGeneration) return;
      setStatus("Could not save — see warning above");
      showSaveWarning();
    }
    renderPagesList();
  }

  function showSaveWarning() {
    const el = document.getElementById("nsSaveWarn");
    if (el) el.hidden = false;
  }
  function hideSaveWarning() {
    const el = document.getElementById("nsSaveWarn");
    if (el) el.hidden = true;
  }
  function wireSaveWarning() {
    const btn = document.getElementById("nsSaveWarnExport");
    if (btn) btn.addEventListener("click", () => exportNotebookPdf());
  }

  async function loadPersisted() {
    try {
      const fromIdb = await idbGet(IDB_RECORD);
      if (fromIdb) return fromIdb;
    } catch (err) {
      console.warn("IndexedDB read failed, falling back to legacy storage:", err);
    }
    // One-time migration from the old localStorage-based save, if present.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        try {
          await idbSet(IDB_RECORD, parsed);
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.warn("Could not migrate legacy save into IndexedDB:", err);
        }
        return parsed;
      }
    } catch (err) {
      // legacy data unreadable/corrupt — fall through to a fresh notebook
    }
    return null;
  }

  function saveCurrentPageState() {
    const page = NS.pages[NS.activeIndex];
    if (!page || !NS.canvas) return;
    page.json = snapshotWithoutBackground();
    page.thumb = NS.canvas.toDataURL({ format: "png", multiplier: 0.22 });
  }

  // ---------------------------------------------------------------------
  // History (undo/redo) — snapshots the current page's fabric JSON
  // ---------------------------------------------------------------------
  // The background (theme fill + ruling + watermark) was being baked into
  // every snapshot as a base64 PNG via canvas.toJSON()'s backgroundImage
  // property — that's the actual weight in "undo stores full canvas
  // snapshots", far bigger than the drawn objects for most pages, and it's
  // fully reconstructable from page.theme/page.ruled via
  // refreshActiveBackground(). Stripping it out of both the undo stack and
  // persisted page.json means every push/save only carries what changed.
  function snapshotWithoutBackground() {
    const json = NS.canvas.toJSON();
    delete json.background;
    delete json.backgroundImage;
    delete json.overlay;
    delete json.overlayImage;
    return json;
  }

  function pushHistory() {
    if (NS.suppressHistory) return;
    const json = snapshotWithoutBackground();
    NS.undoStack.push(json);
    if (NS.undoStack.length > HISTORY_LIMIT) NS.undoStack.shift();
    NS.redoStack = [];
    scheduleSave();
  }

  function undo() {
    if (NS.undoStack.length < 2) return;
    NS.redoStack.push(NS.undoStack.pop());
    const prev = NS.undoStack[NS.undoStack.length - 1];
    NS.suppressHistory = true;
    // loadFromJSON clears the canvas (and its background) first. Undo/redo
    // never changes theme or ruling, so just re-attach the background image
    // already rendered — rebuilding it from scratch (gradient + toDataURL +
    // image reload) on every undo step would make undo noticeably laggy.
    const bg = NS.canvas.backgroundImage;
    NS.canvas.loadFromJSON(prev, () => {
      NS.canvas.setBackgroundImage(bg, () => {
        NS.canvas.renderAll();
        NS.suppressHistory = false;
        scheduleSave();
      });
    });
  }
  function redo() {
    if (!NS.redoStack.length) return;
    const next = NS.redoStack.pop();
    NS.undoStack.push(next);
    NS.suppressHistory = true;
    const bg = NS.canvas.backgroundImage;
    NS.canvas.loadFromJSON(next, () => {
      NS.canvas.setBackgroundImage(bg, () => {
        NS.canvas.renderAll();
        NS.suppressHistory = false;
        scheduleSave();
      });
    });
  }

  // ---------------------------------------------------------------------
  // Page navigation
  // ---------------------------------------------------------------------
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
    // Background is rebuilt from page.theme/page.ruled once, after objects
    // load, instead of being built then immediately discarded by
    // loadFromJSON's internal clear() and rebuilt again from stored JSON.
    await refreshActiveBackground();
    NS.undoStack = [snapshotWithoutBackground()];
    NS.redoStack = [];
    NS.suppressHistory = false;

    updateThemeRuledUI();
    setTool("select");
    renderPagesList();
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
          <button type="button" class="ns-pagecard__icon" data-dup="${i}" title="Duplicate page">⧉</button>
          <button type="button" class="ns-pagecard__icon" data-del="${i}" title="Delete page" ${NS.pages.length <= 1 ? "disabled" : ""}>✕</button>
        </div>`;
      wrap.appendChild(item);
    });
  }

  function duplicatePage(i) {
    if (i === NS.activeIndex) saveCurrentPageState();
    const src = NS.pages[i];
    const copy = newPage({
      theme: src.theme, ruled: src.ruled,
      json: src.json ? JSON.parse(JSON.stringify(src.json)) : null,
      thumb: src.thumb,
    });
    NS.pages.splice(i + 1, 0, copy);
    loadPage(i + 1);
    scheduleSave();
  }

  function deletePage(i) {
    if (NS.pages.length <= 1) return;
    if (!confirm("Delete this page? This can't be undone.")) return;
    NS.pages.splice(i, 1);
    if (NS.activeIndex === i) {
      loadPage(Math.min(i, NS.pages.length - 1));
    } else {
      if (NS.activeIndex > i) NS.activeIndex--;
      renderPagesList();
      scheduleSave();
    }
  }

  // ---------------------------------------------------------------------
  // Theme / ruling
  // ---------------------------------------------------------------------
  function buildThemeToggle() {
    const wrap = document.getElementById("nsThemeToggle");
    [["dark", "Dark"], ["light", "Light"]].forEach(([key, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pt-legend__chip ns-modechip";
      b.dataset.theme = key;
      b.textContent = label;
      wrap.appendChild(b);
    });
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".ns-modechip");
      if (!b) return;
      NS.pages[NS.activeIndex].theme = b.dataset.theme;
      refreshActiveBackground();
      updateThemeRuledUI();
      scheduleSave();
    });
  }

  function buildRuledToggle() {
    const wrap = document.getElementById("nsRuledToggle");
    [[true, "Lined"], [false, "Plain"]].forEach(([key, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pt-legend__chip ns-modechip";
      b.dataset.ruled = String(key);
      b.textContent = label;
      wrap.appendChild(b);
    });
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".ns-modechip");
      if (!b) return;
      NS.pages[NS.activeIndex].ruled = b.dataset.ruled === "true";
      refreshActiveBackground();
      updateThemeRuledUI();
      scheduleSave();
    });
  }

  function updateThemeRuledUI() {
    const page = NS.pages[NS.activeIndex];
    document.querySelectorAll("#nsThemeToggle .ns-modechip").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.theme === page.theme));
    document.querySelectorAll("#nsRuledToggle .ns-modechip").forEach((b) =>
      b.classList.toggle("is-active", (b.dataset.ruled === "true") === page.ruled));
    const shell = document.getElementById("nsPageShell");
    if (shell) shell.classList.toggle("ns-page-shell--light", page.theme === "light");
  }

  // ---------------------------------------------------------------------
  // Colour + stroke width
  // ---------------------------------------------------------------------
  function buildColorSwatches() {
    const wrap = document.getElementById("nsColors");
    NS_PALETTE.forEach((hex) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ns-swatch" + (hex === NS.color ? " is-active" : "");
      b.style.setProperty("--sw", hex);
      b.dataset.color = hex;
      b.title = hex;
      wrap.appendChild(b);
    });
    const custom = document.createElement("input");
    custom.type = "color";
    custom.className = "ns-swatch ns-swatch--custom";
    custom.title = "Custom colour";
    custom.value = NS.color;
    wrap.appendChild(custom);

    wrap.addEventListener("click", (e) => {
      const sw = e.target.closest(".ns-swatch:not(.ns-swatch--custom)");
      if (sw) setColor(sw.dataset.color);
    });
    custom.addEventListener("input", (e) => setColor(e.target.value));
  }

  function setColor(hex) {
    NS.color = hex;
    document.querySelectorAll(".ns-swatch").forEach((s) => s.classList.toggle("is-active", s.dataset.color === hex));
    if (NS.canvas.isDrawingMode && NS.canvas.freeDrawingBrush) {
      NS.canvas.freeDrawingBrush.color = NS.tool === "highlighter" ? hexToRgba(hex, 0.35) : hex;
    }
    applyColorToActive();
  }

  function applyColorToActive() {
    const obj = NS.canvas.getActiveObject();
    if (!obj) return;
    const targets = obj.type === "activeSelection" ? obj.getObjects() : [obj];
    targets.forEach((o) => {
      if (o.type === "i-text" || o.type === "text" || o.type === "textbox") o.set("fill", NS.color);
      else if (o.type === "group") o.getObjects().forEach((c) => c.set(c.type === "triangle" ? "fill" : "stroke", NS.color));
      else o.set({ stroke: NS.color });
    });
    NS.canvas.requestRenderAll();
    pushHistory();
  }

  function wireStrokeSlider() {
    const input = document.getElementById("nsStroke");
    input.value = NS.strokeWidth;
    input.addEventListener("input", (e) => {
      NS.strokeWidth = Number(e.target.value);
      if (NS.canvas.freeDrawingBrush) {
        NS.canvas.freeDrawingBrush.width = NS.tool === "highlighter" ? Math.max(NS.strokeWidth * 3, 14) : NS.strokeWidth;
      }
      const obj = NS.canvas.getActiveObject();
      if (obj) {
        const targets = obj.type === "activeSelection" ? obj.getObjects() : [obj];
        targets.forEach((o) => { if ("strokeWidth" in o) o.set("strokeWidth", NS.strokeWidth); });
        NS.canvas.requestRenderAll();
        pushHistory();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------
  function setTool(tool) {
    NS.tool = tool;
    document.querySelectorAll("#nsTools .ns-tbtn").forEach((b) => b.classList.toggle("is-active", b.dataset.tool === tool));

    NS.canvas.isDrawingMode = false;
    NS.canvas.selection = true;
    NS.canvas.defaultCursor = "default";
    NS.canvas.hoverCursor = "move";
    NS.canvas.forEachObject((o) => (o.selectable = true));
    NS.pendingPlace = null;

    if (tool === "pen" || tool === "highlighter") {
      NS.canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(NS.canvas);
      if (tool === "highlighter") {
        brush.color = hexToRgba(NS.color, 0.35);
        brush.width = Math.max(NS.strokeWidth * 3, 14);
      } else {
        brush.color = NS.color;
        brush.width = NS.strokeWidth;
      }
      NS.canvas.freeDrawingBrush = brush;
    } else if (tool === "eraser") {
      NS.canvas.selection = false;
      NS.canvas.defaultCursor = "not-allowed";
      NS.canvas.hoverCursor = "not-allowed";
      NS.canvas.forEachObject((o) => (o.selectable = false));
    } else if (["text", "sticky", "rect", "ellipse", "line", "arrow"].includes(tool)) {
      NS.pendingPlace = tool;
      NS.canvas.defaultCursor = "crosshair";
    }
  }

  function placeObject(kind, point) {
    const stroke = NS.color, sw = NS.strokeWidth;
    let obj = null;
    switch (kind) {
      case "text":
        obj = new fabric.IText("Type here", { left: point.x, top: point.y, fontFamily: "Inter, sans-serif", fontSize: 20 + sw, fill: stroke });
        break;
      case "sticky":
        obj = new fabric.Textbox("New note", {
          left: point.x, top: point.y, width: 220, fontFamily: "Inter, sans-serif",
          fontSize: 18, fill: "#1a1a2e", backgroundColor: stroke, padding: 10,
        });
        break;
      case "rect":
        obj = new fabric.Rect({ left: point.x - 60, top: point.y - 40, width: 120, height: 80, rx: 8, ry: 8, fill: "transparent", stroke, strokeWidth: sw });
        break;
      case "ellipse":
        obj = new fabric.Ellipse({ left: point.x - 60, top: point.y - 40, rx: 60, ry: 40, fill: "transparent", stroke, strokeWidth: sw });
        break;
      case "line":
        obj = new fabric.Line([point.x - 70, point.y, point.x + 70, point.y], { stroke, strokeWidth: sw });
        break;
      case "arrow": {
        const len = 140;
        const shaft = new fabric.Line([0, 0, len, 0], { stroke, strokeWidth: sw, originX: "center", originY: "center" });
        const head = new fabric.Triangle({ left: len / 2, top: 0, originX: "center", originY: "center", angle: 90, width: sw * 4 + 8, height: sw * 4 + 8, fill: stroke });
        obj = new fabric.Group([shaft, head], { left: point.x - len / 2, top: point.y });
        break;
      }
      default:
        return;
    }
    NS.canvas.add(obj);
    NS.canvas.setActiveObject(obj);
    NS.canvas.requestRenderAll();
  }

  function handleCanvasMouseDown(opt) {
    if (NS.tool === "eraser") {
      if (opt.target) NS.canvas.remove(opt.target);
      return;
    }
    if (NS.pendingPlace) {
      const p = NS.canvas.getPointer(opt.e);
      placeObject(NS.pendingPlace, p);
      NS.pendingPlace = null;
      setTool("select");
    }
  }

  // ---------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------
  function setZoom(z) {
    z = Math.min(2, Math.max(0.4, Math.round(z * 100) / 100));
    NS.zoom = z;
    NS.canvas.setZoom(z);
    NS.canvas.setWidth(PAGE_W * z);
    NS.canvas.setHeight(PAGE_H * z);
    const label = document.getElementById("nsZoomLabel");
    if (label) label.textContent = Math.round(z * 100) + "%";
  }

  // ---------------------------------------------------------------------
  // Import: gallery images
  // ---------------------------------------------------------------------
  function wireImageImport() {
    const btn = document.getElementById("nsImportImageBtn");
    const input = document.getElementById("nsImageInput");
    btn.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = () => {
          fabric.Image.fromURL(reader.result, (img) => {
            const scale = Math.min(1, (PAGE_W * 0.5) / img.width);
            img.set({ left: 110 + idx * 24, top: 110 + idx * 24, scaleX: scale, scaleY: scale });
            NS.canvas.add(img);
            NS.canvas.setActiveObject(img);
            NS.canvas.requestRenderAll();
          });
        };
        reader.readAsDataURL(file);
      });
      input.value = "";
    });
  }

  // ---------------------------------------------------------------------
  // Import: AyuVerse PDF notes — each PDF page becomes a new notebook page
  // with the rendered page locked in place, ready to annotate over.
  // ---------------------------------------------------------------------
  function wirePdfImport() {
    const btn = document.getElementById("nsImportPdfBtn");
    const input = document.getElementById("nsPdfInput");
    btn.addEventListener("click", () => input.click());
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      input.value = "";
      if (!file) return;
      if (!window.pdfjsLib) {
        alert("PDF import couldn't load. Check your connection and try again.");
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      showBusy("Reading PDF…");
      try {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        saveCurrentPageState();

        const insertAt = NS.activeIndex + 1;
        const pageTheme = NS.pages[NS.activeIndex].theme;

        // Render, insert, and place one PDF page at a time instead of
        // rendering every page up front — holding N full-resolution page
        // images in memory at once is what froze the tab on large PDFs.
        for (let i = 1; i <= pdf.numPages; i++) {
          showBusy(`Rendering PDF page ${i} of ${pdf.numPages}…`);
          const pdfPage = await pdf.getPage(i);
          const baseViewport = pdfPage.getViewport({ scale: 1 });
          const scale = (PAGE_W - 40) / baseViewport.width;
          const viewport = pdfPage.getViewport({ scale });
          const off = document.createElement("canvas");
          off.width = viewport.width;
          off.height = viewport.height;
          const offCtx = off.getContext("2d");
          await pdfPage.render({ canvasContext: offCtx, viewport }).promise;
          const dataUrl = off.toDataURL("image/png");
          // release the render target and pdf.js page resources immediately
          off.width = off.height = 0;
          if (pdfPage.cleanup) pdfPage.cleanup();

          const idx = insertAt + (i - 1);
          NS.pages.splice(idx, 0, newPage({ theme: pageTheme, ruled: false }));
          showBusy(`Placing page ${i} of ${pdf.numPages}…`);
          await loadPage(idx);
          await new Promise((resolve) => {
            fabric.Image.fromURL(dataUrl, (img) => {
              img.set({ left: (PAGE_W - viewport.width) / 2, top: 30, selectable: false, evented: false, hasControls: false });
              NS.canvas.add(img);
              NS.canvas.sendToBack(img);
              NS.canvas.requestRenderAll();
              resolve();
            });
          });
          saveCurrentPageState();
        }

        await loadPage(insertAt);
        setStatus(`Imported ${pdf.numPages} page${pdf.numPages > 1 ? "s" : ""} from PDF`);
      } catch (err) {
        console.error(err);
        alert("Couldn't read that PDF. Try a different file.");
      } finally {
        hideBusy();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------
  function exportCurrentPagePng() {
    saveCurrentPageState();
    // toDataURL's multiplier is relative to the canvas's *current* zoomed
    // size, so exporting while zoomed out silently downgraded resolution.
    // Divide by the active zoom so exports are always full quality.
    const url = NS.canvas.toDataURL({ format: "png", multiplier: 2 / NS.zoom });
    downloadDataUrl(url, `ayuverse-notes-page-${NS.activeIndex + 1}.png`);
  }

  async function exportNotebookPdf() {
    if (!window.jspdf) {
      alert("PDF export couldn't load. Check your connection and try again.");
      return;
    }
    showBusy("Preparing export…");
    saveCurrentPageState();
    const originalIndex = NS.activeIndex;
    const originalZoom = NS.zoom;
    setZoom(1); // export at full resolution regardless of on-screen zoom
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_W, PAGE_H] });
    for (let i = 0; i < NS.pages.length; i++) {
      showBusy(`Exporting page ${i + 1} of ${NS.pages.length}…`);
      await loadPage(i);
      const url = NS.canvas.toDataURL({ format: "jpeg", quality: 0.92, multiplier: 2 });
      if (i > 0) doc.addPage([PAGE_W, PAGE_H], "portrait");
      doc.addImage(url, "JPEG", 0, 0, PAGE_W, PAGE_H);
    }
    await loadPage(originalIndex);
    setZoom(originalZoom);
    doc.save("ayuverse-notes.pdf");
    hideBusy();
  }

  function wireExportMenu() {
    const btn = document.getElementById("nsExportBtn");
    const menu = document.getElementById("nsExportMenu");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    document.addEventListener("click", () => { menu.hidden = true; });
    menu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-export]");
      if (!item) return;
      menu.hidden = true;
      if (item.dataset.export === "png") exportCurrentPagePng();
      else exportNotebookPdf();
    });
  }

  // ---------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------
  function wireToolbar() {
    document.getElementById("nsTools").addEventListener("click", (e) => {
      const btn = e.target.closest(".ns-tbtn[data-tool]");
      if (btn) setTool(btn.dataset.tool);
    });
    document.getElementById("nsUndo").addEventListener("click", undo);
    document.getElementById("nsRedo").addEventListener("click", redo);
    document.getElementById("nsClearPage").addEventListener("click", () => {
      if (!confirm("Clear all drawings on this page?")) return;
      NS.canvas.getObjects().slice().forEach((o) => NS.canvas.remove(o));
      pushHistory();
    });
    document.getElementById("nsZoomIn").addEventListener("click", () => setZoom(NS.zoom + 0.1));
    document.getElementById("nsZoomOut").addEventListener("click", () => setZoom(NS.zoom - 0.1));
    document.getElementById("nsApplyAll").addEventListener("click", () => {
      const page = NS.pages[NS.activeIndex];
      NS.pages.forEach((p) => { p.theme = page.theme; p.ruled = page.ruled; });
      scheduleSave();
      renderPagesList();
    });
  }

  function wirePages() {
    document.getElementById("nsAddPage").addEventListener("click", () => {
      saveCurrentPageState();
      const cur = NS.pages[NS.activeIndex];
      NS.pages.splice(NS.activeIndex + 1, 0, newPage({ theme: cur.theme, ruled: cur.ruled }));
      loadPage(NS.activeIndex + 1);
      scheduleSave();
    });
    document.getElementById("nsPagesList").addEventListener("click", (e) => {
      const dup = e.target.closest("[data-dup]");
      const del = e.target.closest("[data-del]");
      const thumb = e.target.closest("[data-idx]");
      if (dup) return duplicatePage(Number(dup.dataset.dup));
      if (del) return deletePage(Number(del.dataset.del));
      if (thumb) {
        const idx = Number(thumb.dataset.idx);
        if (idx !== NS.activeIndex) loadPage(idx);
      }
    });
  }

  function wireCanvasEvents() {
    NS.canvas.on("object:added", pushHistory);
    NS.canvas.on("object:modified", pushHistory);
    NS.canvas.on("object:removed", pushHistory);
    NS.canvas.on("path:created", pushHistory);
    NS.canvas.on("mouse:down", handleCanvasMouseDown);
  }

  function wireKeyboard() {
    let clipboard = null;
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const active = NS.canvas.getActiveObject();
      const isEditingText = tag === "input" || tag === "textarea" || (active && active.isEditing);

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); scheduleSave(); return; }

      if (mod && e.key.toLowerCase() === "c" && !isEditingText && active) {
        e.preventDefault();
        active.clone((cloned) => { clipboard = cloned; });
        return;
      }
      if (mod && e.key.toLowerCase() === "v" && !isEditingText && clipboard) {
        e.preventDefault();
        clipboard.clone((cloned) => {
          NS.canvas.discardActiveObject();
          cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20, evented: true });
          if (cloned.type === "activeSelection") {
            cloned.canvas = NS.canvas;
            cloned.forEachObject((obj) => NS.canvas.add(obj));
            cloned.setCoords();
          } else {
            NS.canvas.add(cloned);
          }
          NS.canvas.setActiveObject(cloned);
          NS.canvas.requestRenderAll();
          pushHistory();
        });
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isEditingText && active) {
        e.preventDefault();
        const objs = active.type === "activeSelection" ? active.getObjects() : [active];
        objs.forEach((o) => NS.canvas.remove(o));
        NS.canvas.discardActiveObject();
        NS.canvas.requestRenderAll();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  async function init() {
    if (typeof fabric === "undefined") {
      setStatus("Notes Studio couldn't load its drawing engine — check your connection and reload.");
      return;
    }

    NS.canvas = new fabric.Canvas("nsCanvas", { selection: true, preserveObjectStacking: true });
    NS.canvas.setWidth(PAGE_W);
    NS.canvas.setHeight(PAGE_H);

    const saved = await loadPersisted();
    if (saved && Array.isArray(saved.pages) && saved.pages.length) {
      NS.pages = saved.pages;
      NS.activeIndex = Math.min(saved.activeIndex || 0, NS.pages.length - 1);
      NS.color = saved.color || NS.color;
      NS.strokeWidth = saved.strokeWidth || NS.strokeWidth;
    } else {
      NS.pages = [newPage()];
      NS.activeIndex = 0;
    }

    buildColorSwatches();
    buildThemeToggle();
    buildRuledToggle();
    wireStrokeSlider();
    wireToolbar();
    wirePages();
    wireCanvasEvents();
    wireImageImport();
    wirePdfImport();
    wireExportMenu();
    wireKeyboard();
    wireSaveWarning();

    loadPage(NS.activeIndex, true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
