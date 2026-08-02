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

  const PT_BLOCKS = [
    { key: "s", label: "s-block" },
    { key: "p", label: "p-block" },
    { key: "d", label: "d-block" },
    { key: "f", label: "f-block" },
  ];

  // Traditional CAS-style group labels (1A/2A…8A alongside the modern
  // 1-18 IUPAC numbering), shown in the header row above the table.
  const GROUP_OLD_LABELS = {
    1: "1A", 2: "2A",
    3: "3B", 4: "4B", 5: "5B", 6: "6B", 7: "7B", 8: "8B", 9: "8B", 10: "8B", 11: "1B", 12: "2B",
    13: "3A", 14: "4A", 15: "5A", 16: "6A", 17: "7A", 18: "8A",
  };

  // Row layout: row 1 is reserved for the group-number header, so every
  // period/series row shifts down by one from the raw period number.
  const HEADER_ROW = 1;
  const ROW_OFFSET = 1;

  // ---- Group header row (modern number on top, old A/B label below) ----
  for (let g = 1; g <= 18; g++) {
    const head = document.createElement("div");
    head.className = "pt-colhead";
    head.style.gridRow = String(HEADER_ROW);
    head.style.gridColumn = String(g);
    head.innerHTML = `<span class="pt-colhead__num">${g}</span><span class="pt-colhead__old">${GROUP_OLD_LABELS[g]}</span>`;
    grid.appendChild(head);
  }

  // ---- Build the element cells ----
  const frag = document.createDocumentFragment();

  PERIODIC_TABLE_DATA.forEach((el) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `pt-cell pt-cell--${el.cat} pt-cell--block-${el.block}`;
    cell.dataset.z = el.z;
    cell.dataset.block = el.block;
    cell.setAttribute("aria-haspopup", "dialog");
    cell.setAttribute("aria-label", `${el.name}, atomic number ${el.z}, ${el.block}-block`);

    if (el.group) {
      cell.style.gridRow = String(el.period + ROW_OFFSET);
      cell.style.gridColumn = String(el.group);
    } else if (el.series) {
      // Ce–Lu / Th–Lr only — La and Ac sit in the main table (group 3)
      const row = el.series === "lanthanide" ? 10 : 11;
      cell.style.gridRow = String(row);
      cell.style.gridColumn = String(el.seriesIndex + 3);
    }

    cell.innerHTML = `
      <span class="pt-cell__z">${el.z}</span>
      <span class="pt-cell__block">${el.block}</span>
      <span class="pt-cell__sym">${el.sym}</span>
      <span class="pt-cell__name">${el.name}</span>
    `;
    frag.appendChild(cell);
  });

  grid.appendChild(frag);

  // ---- Category legend ----
  const legend = document.getElementById("ptLegend");
  const blockLegend = document.getElementById("ptBlockLegend");

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
      if (blockLegend) blockLegend.querySelectorAll(".pt-legend__chip.is-active").forEach((c) => c.classList.remove("is-active"));
      const cat = active ? chip.dataset.cat : null;
      grid.querySelectorAll(".pt-cell[data-z]").forEach((cellEl) => {
        cellEl.classList.toggle("is-dimmed", !!cat && !cellEl.classList.contains(`pt-cell--${cat}`));
      });
    });
  }

  // ---- Block legend (s / p / d / f) ----
  if (blockLegend) {
    PT_BLOCKS.forEach((b) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `pt-legend__chip pt-legend__chip--block-${b.key}`;
      chip.dataset.block = b.key;
      chip.textContent = b.label;
      blockLegend.appendChild(chip);
    });

    blockLegend.addEventListener("click", (e) => {
      const chip = e.target.closest(".pt-legend__chip");
      if (!chip) return;
      const active = chip.classList.toggle("is-active");
      blockLegend.querySelectorAll(".pt-legend__chip").forEach((c) => {
        if (c !== chip) c.classList.remove("is-active");
      });
      if (legend) legend.querySelectorAll(".pt-legend__chip.is-active").forEach((c) => c.classList.remove("is-active"));
      const block = active ? chip.dataset.block : null;
      grid.querySelectorAll(".pt-cell[data-z]").forEach((cellEl) => {
        cellEl.classList.toggle("is-dimmed", !!block && cellEl.dataset.block !== block);
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
      if (legend) legend.querySelectorAll(".pt-legend__chip.is-active").forEach((c) => c.classList.remove("is-active"));
      if (blockLegend) blockLegend.querySelectorAll(".pt-legend__chip.is-active").forEach((c) => c.classList.remove("is-active"));
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
    document.getElementById("ptModalGroup").textContent = el.group ? `${el.group} (${GROUP_OLD_LABELS[el.group]})` : "—";
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
