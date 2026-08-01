/* AyuVerse — Periodic Table renderer & interactions */
(() => {
  const grid = document.getElementById("ptGrid");
  if (!grid || typeof PERIODIC_TABLE_DATA === "undefined") return;

  const PT_CATEGORIES = [
    { key: "alkali-metal", label: "Alkali metal" },
    { key: "alkaline-earth-metal", label: "Alkaline earth metal" },
    { key: "transition-metal", label: "Transition metal" },
    { key: "post-transition-metal", label: "Post-transition metal" },
    { key: "metalloid", label: "Metalloid" },
    { key: "nonmetal", label: "Reactive nonmetal" },
    { key: "halogen", label: "Halogen" },
    { key: "noble-gas", label: "Noble gas" },
    { key: "lanthanide", label: "Lanthanide" },
    { key: "actinide", label: "Actinide" },
  ];

  // ---- Build the grid ----
  const frag = document.createDocumentFragment();

  PERIODIC_TABLE_DATA.forEach((el) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `pt-cell pt-cell--${el.cat}`;
    cell.dataset.z = el.z;
    cell.setAttribute("aria-haspopup", "dialog");
    cell.setAttribute("aria-label", `${el.name}, atomic number ${el.z}`);

    if (el.series) {
      // Lanthanide / actinide row, placed below the main table
      const row = el.series === "lanthanide" ? 9 : 10;
      cell.style.gridRow = String(row);
      cell.style.gridColumn = String(el.seriesIndex + 3);
    } else {
      cell.style.gridRow = String(el.period);
      cell.style.gridColumn = String(el.group);
    }

    cell.innerHTML = `
      <span class="pt-cell__z">${el.z}</span>
      <span class="pt-cell__sym">${el.sym}</span>
      <span class="pt-cell__name">${el.name}</span>
    `;
    frag.appendChild(cell);
  });

  // Placeholder cells linking the main table to the f-block rows
  const laPlaceholder = document.createElement("div");
  laPlaceholder.className = "pt-cell pt-cell--placeholder";
  laPlaceholder.style.gridRow = "6";
  laPlaceholder.style.gridColumn = "3";
  laPlaceholder.textContent = "57–71";

  const acPlaceholder = document.createElement("div");
  acPlaceholder.className = "pt-cell pt-cell--placeholder";
  acPlaceholder.style.gridRow = "7";
  acPlaceholder.style.gridColumn = "3";
  acPlaceholder.textContent = "89–103";

  grid.appendChild(laPlaceholder);
  grid.appendChild(acPlaceholder);
  grid.appendChild(frag);

  // ---- Legend ----
  const legend = document.getElementById("ptLegend");
  if (legend) {
    PT_CATEGORIES.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `pt-legend__chip pt-legend__chip--${c.key}`;
      chip.dataset.cat = c.key;
      chip.textContent = c.label;
      legend.appendChild(chip);
    });

    legend.addEventListener("click", (e) => {
      const chip = e.target.closest(".pt-legend__chip");
      if (!chip) return;
      const active = chip.classList.toggle("is-active");
      legend.querySelectorAll(".pt-legend__chip").forEach((c) => {
        if (c !== chip) c.classList.remove("is-active");
      });
      const cat = active ? chip.dataset.cat : null;
      grid.querySelectorAll(".pt-cell[data-z]").forEach((cellEl) => {
        cellEl.classList.toggle("is-dimmed", !!cat && !cellEl.classList.contains(`pt-cell--${cat}`));
      });
    });
  }

  // ---- Search / filter ----
  const searchInput = document.getElementById("ptSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      grid.querySelectorAll(".pt-cell[data-z]").forEach((cellEl) => {
        const el = PERIODIC_TABLE_DATA[Number(cellEl.dataset.z) - 1];
        const match =
          !q ||
          el.name.toLowerCase().startsWith(q) ||
          el.sym.toLowerCase() === q ||
          String(el.z) === q;
        cellEl.classList.toggle("is-dimmed", !match);
      });
      // Clear any active legend highlight while searching
      if (legend) {
        legend.querySelectorAll(".pt-legend__chip.is-active").forEach((c) => c.classList.remove("is-active"));
      }
    });
  }

  // ---- Detail modal ----
  const modal = document.getElementById("ptModal");
  const scrim = document.getElementById("ptModalScrim");
  const closeBtn = document.getElementById("ptModalClose");
  let lastFocused = null;

  function openDetail(el) {
    lastFocused = document.activeElement;
    document.getElementById("ptModalZ").textContent = el.z;
    document.getElementById("ptModalSym").textContent = el.sym;
    document.getElementById("ptModalName").textContent = el.name;
    document.getElementById("ptModalMass").textContent = el.mass;
    document.getElementById("ptModalCat").textContent =
      PT_CATEGORIES.find((c) => c.key === el.cat)?.label || el.cat;
    document.getElementById("ptModalGroup").textContent = el.group || "—";
    document.getElementById("ptModalPeriod").textContent = el.period;
    document.getElementById("ptModalBlock").textContent = el.block.toUpperCase() + "-block";
    document.getElementById("ptModalConfig").textContent = el.config;
    modal.className = `notes-modal pt-modal pt-modal--${el.cat}`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeDetail() {
    modal.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeDetail();
  }

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest(".pt-cell[data-z]");
    if (!cell) return;
    const el = PERIODIC_TABLE_DATA[Number(cell.dataset.z) - 1];
    openDetail(el);
  });

  if (scrim) scrim.addEventListener("click", closeDetail);
  if (closeBtn) closeBtn.addEventListener("click", closeDetail);
})();
