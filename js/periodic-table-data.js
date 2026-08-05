/* AyuVerse — Periodic Table dataset
   z: atomic number | sym: symbol | name | mass: standard atomic weight
   cat: category key (see PT_CATEGORIES in periodic-table.js)
   group: 1-18 (main table) | period: 1-7
   series/seriesIndex: set for lanthanides & actinides (displayed as a
   separate two-row block below the main table, standard convention)
   block: s | p | d | f
   config: electron configuration (noble-gas shorthand)
   en: electronegativity, Pauling scale (null where no established value —
       mostly noble gases and several synthetic elements)
   ar: atomic radius, covalent, in picometres (Cordero et al.; values for
       elements 104+ are theoretical/predicted, consistent with the
       "(pred.)" convention already used for superheavy configs)
   ox: common oxidation states, ascending (e.g. [-3, 3, 5] for N); an empty
       array means no well-established compounds/oxidation states
   ir: representative ionic radius — { q: charge, r: radius in pm } for the
       element's most chemically common ion (Shannon effective ionic
       radii, six-coordinate); null where no single ion is representative
       enough to be useful for a trend chart (most transition/heavy/
       synthetic elements, since they need a subscript in the ion) */

const PERIODIC_TABLE_DATA = [
  { z: 1, sym: "H", name: "Hydrogen", mass: "1.008", cat: "nonmetal", group: 1, period: 1, block: "s", config: "1s¹", en: 2.2, ar: 31, ox: [-1, 1], ir: null },
  { z: 2, sym: "He", name: "Helium", mass: "4.003", cat: "noble-gas", group: 18, period: 1, block: "s", config: "1s²", en: null, ar: 28, ox: [], ir: null },

  { z: 3, sym: "Li", name: "Lithium", mass: "6.94", cat: "alkali-metal", group: 1, period: 2, block: "s", config: "[He] 2s¹", en: 0.98, ar: 128, ox: [1], ir: { q: 1, r: 76 } },
  { z: 4, sym: "Be", name: "Beryllium", mass: "9.012", cat: "alkaline-earth-metal", group: 2, period: 2, block: "s", config: "[He] 2s²", en: 1.57, ar: 96, ox: [2], ir: { q: 2, r: 45 } },
  { z: 5, sym: "B", name: "Boron", mass: "10.81", cat: "metalloid", group: 13, period: 2, block: "p", config: "[He] 2s² 2p¹", en: 2.04, ar: 84, ox: [3], ir: null },
  { z: 6, sym: "C", name: "Carbon", mass: "12.011", cat: "nonmetal", group: 14, period: 2, block: "p", config: "[He] 2s² 2p²", en: 2.55, ar: 76, ox: [-4, 2, 4], ir: null },
  { z: 7, sym: "N", name: "Nitrogen", mass: "14.007", cat: "nonmetal", group: 15, period: 2, block: "p", config: "[He] 2s² 2p³", en: 3.04, ar: 71, ox: [-3, 3, 5], ir: null },
  { z: 8, sym: "O", name: "Oxygen", mass: "15.999", cat: "nonmetal", group: 16, period: 2, block: "p", config: "[He] 2s² 2p⁴", en: 3.44, ar: 66, ox: [-2], ir: { q: -2, r: 140 } },
  { z: 9, sym: "F", name: "Fluorine", mass: "18.998", cat: "halogen", group: 17, period: 2, block: "p", config: "[He] 2s² 2p⁵", en: 3.98, ar: 57, ox: [-1], ir: { q: -1, r: 133 } },
  { z: 10, sym: "Ne", name: "Neon", mass: "20.180", cat: "noble-gas", group: 18, period: 2, block: "p", config: "[He] 2s² 2p⁶", en: null, ar: 58, ox: [], ir: null },

  { z: 11, sym: "Na", name: "Sodium", mass: "22.990", cat: "alkali-metal", group: 1, period: 3, block: "s", config: "[Ne] 3s¹", en: 0.93, ar: 166, ox: [1], ir: { q: 1, r: 102 } },
  { z: 12, sym: "Mg", name: "Magnesium", mass: "24.305", cat: "alkaline-earth-metal", group: 2, period: 3, block: "s", config: "[Ne] 3s²", en: 1.31, ar: 141, ox: [2], ir: { q: 2, r: 72 } },
  { z: 13, sym: "Al", name: "Aluminium", mass: "26.982", cat: "post-transition-metal", group: 13, period: 3, block: "p", config: "[Ne] 3s² 3p¹", en: 1.61, ar: 121, ox: [3], ir: { q: 3, r: 54 } },
  { z: 14, sym: "Si", name: "Silicon", mass: "28.085", cat: "metalloid", group: 14, period: 3, block: "p", config: "[Ne] 3s² 3p²", en: 1.9, ar: 111, ox: [-4, 4], ir: null },
  { z: 15, sym: "P", name: "Phosphorus", mass: "30.974", cat: "nonmetal", group: 15, period: 3, block: "p", config: "[Ne] 3s² 3p³", en: 2.19, ar: 107, ox: [-3, 3, 5], ir: null },
  { z: 16, sym: "S", name: "Sulfur", mass: "32.06", cat: "nonmetal", group: 16, period: 3, block: "p", config: "[Ne] 3s² 3p⁴", en: 2.58, ar: 105, ox: [-2, 2, 4, 6], ir: { q: -2, r: 184 } },
  { z: 17, sym: "Cl", name: "Chlorine", mass: "35.45", cat: "halogen", group: 17, period: 3, block: "p", config: "[Ne] 3s² 3p⁵", en: 3.16, ar: 102, ox: [-1, 1, 3, 5, 7], ir: { q: -1, r: 181 } },
  { z: 18, sym: "Ar", name: "Argon", mass: "39.948", cat: "noble-gas", group: 18, period: 3, block: "p", config: "[Ne] 3s² 3p⁶", en: null, ar: 106, ox: [], ir: null },

  { z: 19, sym: "K", name: "Potassium", mass: "39.098", cat: "alkali-metal", group: 1, period: 4, block: "s", config: "[Ar] 4s¹", en: 0.82, ar: 203, ox: [1], ir: { q: 1, r: 138 } },
  { z: 20, sym: "Ca", name: "Calcium", mass: "40.078", cat: "alkaline-earth-metal", group: 2, period: 4, block: "s", config: "[Ar] 4s²", en: 1.0, ar: 176, ox: [2], ir: { q: 2, r: 100 } },
  { z: 21, sym: "Sc", name: "Scandium", mass: "44.956", cat: "transition-metal", group: 3, period: 4, block: "d", config: "[Ar] 3d¹ 4s²", en: 1.36, ar: 170, ox: [3], ir: { q: 3, r: 75 } },
  { z: 22, sym: "Ti", name: "Titanium", mass: "47.867", cat: "transition-metal", group: 4, period: 4, block: "d", config: "[Ar] 3d² 4s²", en: 1.54, ar: 160, ox: [2, 3, 4], ir: { q: 4, r: 61 } },
  { z: 23, sym: "V", name: "Vanadium", mass: "50.942", cat: "transition-metal", group: 5, period: 4, block: "d", config: "[Ar] 3d³ 4s²", en: 1.63, ar: 153, ox: [2, 3, 4, 5], ir: { q: 3, r: 64 } },
  { z: 24, sym: "Cr", name: "Chromium", mass: "51.996", cat: "transition-metal", group: 6, period: 4, block: "d", config: "[Ar] 3d⁵ 4s¹", en: 1.66, ar: 139, ox: [2, 3, 6], ir: { q: 3, r: 62 } },
  { z: 25, sym: "Mn", name: "Manganese", mass: "54.938", cat: "transition-metal", group: 7, period: 4, block: "d", config: "[Ar] 3d⁵ 4s²", en: 1.55, ar: 139, ox: [2, 3, 4, 6, 7], ir: { q: 2, r: 83 } },
  { z: 26, sym: "Fe", name: "Iron", mass: "55.845", cat: "transition-metal", group: 8, period: 4, block: "d", config: "[Ar] 3d⁶ 4s²", en: 1.83, ar: 132, ox: [2, 3], ir: { q: 2, r: 78 } },
  { z: 27, sym: "Co", name: "Cobalt", mass: "58.933", cat: "transition-metal", group: 9, period: 4, block: "d", config: "[Ar] 3d⁷ 4s²", en: 1.88, ar: 126, ox: [2, 3], ir: { q: 2, r: 75 } },
  { z: 28, sym: "Ni", name: "Nickel", mass: "58.693", cat: "transition-metal", group: 10, period: 4, block: "d", config: "[Ar] 3d⁸ 4s²", en: 1.91, ar: 124, ox: [2, 3], ir: { q: 2, r: 69 } },
  { z: 29, sym: "Cu", name: "Copper", mass: "63.546", cat: "transition-metal", group: 11, period: 4, block: "d", config: "[Ar] 3d¹⁰ 4s¹", en: 1.9, ar: 132, ox: [1, 2], ir: { q: 2, r: 73 } },
  { z: 30, sym: "Zn", name: "Zinc", mass: "65.38", cat: "transition-metal", group: 12, period: 4, block: "d", config: "[Ar] 3d¹⁰ 4s²", en: 1.65, ar: 122, ox: [2], ir: { q: 2, r: 74 } },
  { z: 31, sym: "Ga", name: "Gallium", mass: "69.723", cat: "post-transition-metal", group: 13, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p¹", en: 1.81, ar: 122, ox: [3], ir: { q: 3, r: 62 } },
  { z: 32, sym: "Ge", name: "Germanium", mass: "72.630", cat: "metalloid", group: 14, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p²", en: 2.01, ar: 120, ox: [-4, 2, 4], ir: { q: 4, r: 53 } },
  { z: 33, sym: "As", name: "Arsenic", mass: "74.922", cat: "metalloid", group: 15, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p³", en: 2.18, ar: 119, ox: [-3, 3, 5], ir: null },
  { z: 34, sym: "Se", name: "Selenium", mass: "78.971", cat: "nonmetal", group: 16, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p⁴", en: 2.55, ar: 120, ox: [-2, 2, 4, 6], ir: { q: -2, r: 198 } },
  { z: 35, sym: "Br", name: "Bromine", mass: "79.904", cat: "halogen", group: 17, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p⁵", en: 2.96, ar: 120, ox: [-1, 1, 3, 5, 7], ir: { q: -1, r: 196 } },
  { z: 36, sym: "Kr", name: "Krypton", mass: "83.798", cat: "noble-gas", group: 18, period: 4, block: "p", config: "[Ar] 3d¹⁰ 4s² 4p⁶", en: 3.0, ar: 116, ox: [2], ir: null },

  { z: 37, sym: "Rb", name: "Rubidium", mass: "85.468", cat: "alkali-metal", group: 1, period: 5, block: "s", config: "[Kr] 5s¹", en: 0.82, ar: 220, ox: [1], ir: { q: 1, r: 152 } },
  { z: 38, sym: "Sr", name: "Strontium", mass: "87.62", cat: "alkaline-earth-metal", group: 2, period: 5, block: "s", config: "[Kr] 5s²", en: 0.95, ar: 195, ox: [2], ir: { q: 2, r: 118 } },
  { z: 39, sym: "Y", name: "Yttrium", mass: "88.906", cat: "transition-metal", group: 3, period: 5, block: "d", config: "[Kr] 4d¹ 5s²", en: 1.22, ar: 190, ox: [3], ir: { q: 3, r: 90 } },
  { z: 40, sym: "Zr", name: "Zirconium", mass: "91.224", cat: "transition-metal", group: 4, period: 5, block: "d", config: "[Kr] 4d² 5s²", en: 1.33, ar: 175, ox: [4], ir: { q: 4, r: 72 } },
  { z: 41, sym: "Nb", name: "Niobium", mass: "92.906", cat: "transition-metal", group: 5, period: 5, block: "d", config: "[Kr] 4d⁴ 5s¹", en: 1.6, ar: 164, ox: [3, 5], ir: null },
  { z: 42, sym: "Mo", name: "Molybdenum", mass: "95.95", cat: "transition-metal", group: 6, period: 5, block: "d", config: "[Kr] 4d⁵ 5s¹", en: 2.16, ar: 154, ox: [2, 3, 4, 5, 6], ir: null },
  { z: 43, sym: "Tc", name: "Technetium", mass: "[98]", cat: "transition-metal", group: 7, period: 5, block: "d", config: "[Kr] 4d⁵ 5s²", en: 1.9, ar: 147, ox: [4, 6, 7], ir: null },
  { z: 44, sym: "Ru", name: "Ruthenium", mass: "101.07", cat: "transition-metal", group: 8, period: 5, block: "d", config: "[Kr] 4d⁷ 5s¹", en: 2.2, ar: 146, ox: [2, 3, 4, 6, 8], ir: null },
  { z: 45, sym: "Rh", name: "Rhodium", mass: "102.91", cat: "transition-metal", group: 9, period: 5, block: "d", config: "[Kr] 4d⁸ 5s¹", en: 2.28, ar: 142, ox: [2, 3, 4], ir: null },
  { z: 46, sym: "Pd", name: "Palladium", mass: "106.42", cat: "transition-metal", group: 10, period: 5, block: "d", config: "[Kr] 4d¹⁰", en: 2.2, ar: 139, ox: [2, 4], ir: null },
  { z: 47, sym: "Ag", name: "Silver", mass: "107.87", cat: "transition-metal", group: 11, period: 5, block: "d", config: "[Kr] 4d¹⁰ 5s¹", en: 1.93, ar: 145, ox: [1], ir: { q: 1, r: 115 } },
  { z: 48, sym: "Cd", name: "Cadmium", mass: "112.41", cat: "transition-metal", group: 12, period: 5, block: "d", config: "[Kr] 4d¹⁰ 5s²", en: 1.69, ar: 144, ox: [2], ir: { q: 2, r: 95 } },
  { z: 49, sym: "In", name: "Indium", mass: "114.82", cat: "post-transition-metal", group: 13, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p¹", en: 1.78, ar: 142, ox: [3], ir: { q: 3, r: 80 } },
  { z: 50, sym: "Sn", name: "Tin", mass: "118.71", cat: "post-transition-metal", group: 14, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p²", en: 1.96, ar: 139, ox: [2, 4], ir: { q: 4, r: 69 } },
  { z: 51, sym: "Sb", name: "Antimony", mass: "121.76", cat: "metalloid", group: 15, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p³", en: 2.05, ar: 139, ox: [-3, 3, 5], ir: null },
  { z: 52, sym: "Te", name: "Tellurium", mass: "127.60", cat: "metalloid", group: 16, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p⁴", en: 2.1, ar: 138, ox: [-2, 2, 4, 6], ir: { q: -2, r: 221 } },
  { z: 53, sym: "I", name: "Iodine", mass: "126.90", cat: "halogen", group: 17, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p⁵", en: 2.66, ar: 139, ox: [-1, 1, 3, 5, 7], ir: { q: -1, r: 220 } },
  { z: 54, sym: "Xe", name: "Xenon", mass: "131.29", cat: "noble-gas", group: 18, period: 5, block: "p", config: "[Kr] 4d¹⁰ 5s² 5p⁶", en: 2.6, ar: 140, ox: [2, 4, 6, 8], ir: null },

  { z: 55, sym: "Cs", name: "Caesium", mass: "132.91", cat: "alkali-metal", group: 1, period: 6, block: "s", config: "[Xe] 6s¹", en: 0.79, ar: 244, ox: [1], ir: { q: 1, r: 167 } },
  { z: 56, sym: "Ba", name: "Barium", mass: "137.33", cat: "alkaline-earth-metal", group: 2, period: 6, block: "s", config: "[Xe] 6s²", en: 0.89, ar: 215, ox: [2], ir: { q: 2, r: 135 } },

  { z: 57, sym: "La", name: "Lanthanum", mass: "138.91", cat: "lanthanide", group: 3, period: 6, series: "lanthanide", seriesIndex: 0, block: "d", config: "[Xe] 5d¹ 6s²", en: 1.1, ar: 207, ox: [3], ir: { q: 3, r: 103 } },
  { z: 58, sym: "Ce", name: "Cerium", mass: "140.12", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 1, block: "f", config: "[Xe] 4f¹ 5d¹ 6s²", en: 1.12, ar: 204, ox: [3, 4], ir: null },
  { z: 59, sym: "Pr", name: "Praseodymium", mass: "140.91", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 2, block: "f", config: "[Xe] 4f³ 6s²", en: 1.13, ar: 203, ox: [3, 4], ir: null },
  { z: 60, sym: "Nd", name: "Neodymium", mass: "144.24", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 3, block: "f", config: "[Xe] 4f⁴ 6s²", en: 1.14, ar: 201, ox: [3], ir: null },
  { z: 61, sym: "Pm", name: "Promethium", mass: "[145]", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 4, block: "f", config: "[Xe] 4f⁵ 6s²", en: 1.13, ar: 199, ox: [3], ir: null },
  { z: 62, sym: "Sm", name: "Samarium", mass: "150.36", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 5, block: "f", config: "[Xe] 4f⁶ 6s²", en: 1.17, ar: 198, ox: [2, 3], ir: null },
  { z: 63, sym: "Eu", name: "Europium", mass: "151.96", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 6, block: "f", config: "[Xe] 4f⁷ 6s²", en: 1.2, ar: 198, ox: [2, 3], ir: null },
  { z: 64, sym: "Gd", name: "Gadolinium", mass: "157.25", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 7, block: "f", config: "[Xe] 4f⁷ 5d¹ 6s²", en: 1.2, ar: 196, ox: [3], ir: null },
  { z: 65, sym: "Tb", name: "Terbium", mass: "158.93", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 8, block: "f", config: "[Xe] 4f⁹ 6s²", en: 1.1, ar: 194, ox: [3, 4], ir: null },
  { z: 66, sym: "Dy", name: "Dysprosium", mass: "162.50", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 9, block: "f", config: "[Xe] 4f¹⁰ 6s²", en: 1.22, ar: 192, ox: [3], ir: null },
  { z: 67, sym: "Ho", name: "Holmium", mass: "164.93", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 10, block: "f", config: "[Xe] 4f¹¹ 6s²", en: 1.23, ar: 192, ox: [3], ir: null },
  { z: 68, sym: "Er", name: "Erbium", mass: "167.26", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 11, block: "f", config: "[Xe] 4f¹² 6s²", en: 1.24, ar: 189, ox: [3], ir: null },
  { z: 69, sym: "Tm", name: "Thulium", mass: "168.93", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 12, block: "f", config: "[Xe] 4f¹³ 6s²", en: 1.25, ar: 190, ox: [2, 3], ir: null },
  { z: 70, sym: "Yb", name: "Ytterbium", mass: "173.05", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 13, block: "f", config: "[Xe] 4f¹⁴ 6s²", en: 1.1, ar: 187, ox: [2, 3], ir: null },
  { z: 71, sym: "Lu", name: "Lutetium", mass: "174.97", cat: "lanthanide", period: 6, series: "lanthanide", seriesIndex: 14, block: "d", config: "[Xe] 4f¹⁴ 5d¹ 6s²", en: 1.27, ar: 187, ox: [3], ir: null },

  { z: 72, sym: "Hf", name: "Hafnium", mass: "178.49", cat: "transition-metal", group: 4, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d² 6s²", en: 1.3, ar: 175, ox: [4], ir: null },
  { z: 73, sym: "Ta", name: "Tantalum", mass: "180.95", cat: "transition-metal", group: 5, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d³ 6s²", en: 1.5, ar: 170, ox: [5], ir: null },
  { z: 74, sym: "W", name: "Tungsten", mass: "183.84", cat: "transition-metal", group: 6, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d⁴ 6s²", en: 2.36, ar: 162, ox: [2, 3, 4, 5, 6], ir: null },
  { z: 75, sym: "Re", name: "Rhenium", mass: "186.21", cat: "transition-metal", group: 7, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d⁵ 6s²", en: 1.9, ar: 151, ox: [4, 6, 7], ir: null },
  { z: 76, sym: "Os", name: "Osmium", mass: "190.23", cat: "transition-metal", group: 8, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d⁶ 6s²", en: 2.2, ar: 144, ox: [2, 3, 4, 6, 8], ir: null },
  { z: 77, sym: "Ir", name: "Iridium", mass: "192.22", cat: "transition-metal", group: 9, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d⁷ 6s²", en: 2.2, ar: 141, ox: [3, 4, 6], ir: null },
  { z: 78, sym: "Pt", name: "Platinum", mass: "195.08", cat: "transition-metal", group: 10, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d⁹ 6s¹", en: 2.28, ar: 136, ox: [2, 4], ir: null },
  { z: 79, sym: "Au", name: "Gold", mass: "196.97", cat: "transition-metal", group: 11, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", en: 2.54, ar: 136, ox: [1, 3], ir: { q: 1, r: 137 } },
  { z: 80, sym: "Hg", name: "Mercury", mass: "200.59", cat: "transition-metal", group: 12, period: 6, block: "d", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", en: 2.0, ar: 132, ox: [1, 2], ir: { q: 2, r: 102 } },
  { z: 81, sym: "Tl", name: "Thallium", mass: "204.38", cat: "post-transition-metal", group: 13, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", en: 1.62, ar: 145, ox: [1, 3], ir: { q: 1, r: 150 } },
  { z: 82, sym: "Pb", name: "Lead", mass: "207.2", cat: "post-transition-metal", group: 14, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", en: 1.87, ar: 146, ox: [2, 4], ir: { q: 2, r: 119 } },
  { z: 83, sym: "Bi", name: "Bismuth", mass: "208.98", cat: "post-transition-metal", group: 15, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", en: 2.02, ar: 148, ox: [3, 5], ir: { q: 3, r: 103 } },
  { z: 84, sym: "Po", name: "Polonium", mass: "[209]", cat: "post-transition-metal", group: 16, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", en: 2.0, ar: 140, ox: [2, 4], ir: null },
  { z: 85, sym: "At", name: "Astatine", mass: "[210]", cat: "halogen", group: 17, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", en: 2.2, ar: 150, ox: [-1, 1], ir: null },
  { z: 86, sym: "Rn", name: "Radon", mass: "[222]", cat: "noble-gas", group: 18, period: 6, block: "p", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", en: null, ar: 150, ox: [2], ir: null },

  { z: 87, sym: "Fr", name: "Francium", mass: "[223]", cat: "alkali-metal", group: 1, period: 7, block: "s", config: "[Rn] 7s¹", en: 0.7, ar: 260, ox: [1], ir: null },
  { z: 88, sym: "Ra", name: "Radium", mass: "[226]", cat: "alkaline-earth-metal", group: 2, period: 7, block: "s", config: "[Rn] 7s²", en: 0.9, ar: 221, ox: [2], ir: { q: 2, r: 148 } },

  { z: 89, sym: "Ac", name: "Actinium", mass: "[227]", cat: "actinide", group: 3, period: 7, series: "actinide", seriesIndex: 0, block: "d", config: "[Rn] 6d¹ 7s²", en: 1.1, ar: 215, ox: [3], ir: { q: 3, r: 112 } },
  { z: 90, sym: "Th", name: "Thorium", mass: "232.04", cat: "actinide", period: 7, series: "actinide", seriesIndex: 1, block: "f", config: "[Rn] 6d² 7s²", en: 1.3, ar: 206, ox: [4], ir: { q: 4, r: 94 } },
  { z: 91, sym: "Pa", name: "Protactinium", mass: "231.04", cat: "actinide", period: 7, series: "actinide", seriesIndex: 2, block: "f", config: "[Rn] 5f² 6d¹ 7s²", en: 1.5, ar: 200, ox: [4, 5], ir: null },
  { z: 92, sym: "U", name: "Uranium", mass: "238.03", cat: "actinide", period: 7, series: "actinide", seriesIndex: 3, block: "f", config: "[Rn] 5f³ 6d¹ 7s²", en: 1.38, ar: 196, ox: [3, 4, 5, 6], ir: { q: 4, r: 89 } },
  { z: 93, sym: "Np", name: "Neptunium", mass: "[237]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 4, block: "f", config: "[Rn] 5f⁴ 6d¹ 7s²", en: 1.36, ar: 190, ox: [3, 4, 5, 6, 7], ir: null },
  { z: 94, sym: "Pu", name: "Plutonium", mass: "[244]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 5, block: "f", config: "[Rn] 5f⁶ 7s²", en: 1.28, ar: 187, ox: [3, 4, 5, 6], ir: null },
  { z: 95, sym: "Am", name: "Americium", mass: "[243]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 6, block: "f", config: "[Rn] 5f⁷ 7s²", en: 1.3, ar: 180, ox: [3, 4, 5, 6], ir: null },
  { z: 96, sym: "Cm", name: "Curium", mass: "[247]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 7, block: "f", config: "[Rn] 5f⁷ 6d¹ 7s²", en: 1.3, ar: 169, ox: [3], ir: null },
  { z: 97, sym: "Bk", name: "Berkelium", mass: "[247]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 8, block: "f", config: "[Rn] 5f⁹ 7s²", en: 1.3, ar: null, ox: [3, 4], ir: null },
  { z: 98, sym: "Cf", name: "Californium", mass: "[251]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 9, block: "f", config: "[Rn] 5f¹⁰ 7s²", en: 1.3, ar: null, ox: [3], ir: null },
  { z: 99, sym: "Es", name: "Einsteinium", mass: "[252]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 10, block: "f", config: "[Rn] 5f¹¹ 7s²", en: 1.3, ar: null, ox: [3], ir: null },
  { z: 100, sym: "Fm", name: "Fermium", mass: "[257]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 11, block: "f", config: "[Rn] 5f¹² 7s²", en: 1.3, ar: null, ox: [3], ir: null },
  { z: 101, sym: "Md", name: "Mendelevium", mass: "[258]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 12, block: "f", config: "[Rn] 5f¹³ 7s²", en: 1.3, ar: null, ox: [2, 3], ir: null },
  { z: 102, sym: "No", name: "Nobelium", mass: "[259]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 13, block: "f", config: "[Rn] 5f¹⁴ 7s²", en: 1.3, ar: null, ox: [2, 3], ir: null },
  { z: 103, sym: "Lr", name: "Lawrencium", mass: "[266]", cat: "actinide", period: 7, series: "actinide", seriesIndex: 14, block: "d", config: "[Rn] 5f¹⁴ 6d¹ 7s²", en: 1.3, ar: null, ox: [3], ir: null },

  { z: 104, sym: "Rf", name: "Rutherfordium", mass: "[267]", cat: "transition-metal", group: 4, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d² 7s²", en: null, ar: 157, ox: [4], ir: null },
  { z: 105, sym: "Db", name: "Dubnium", mass: "[268]", cat: "transition-metal", group: 5, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d³ 7s²", en: null, ar: 149, ox: [5], ir: null },
  { z: 106, sym: "Sg", name: "Seaborgium", mass: "[269]", cat: "transition-metal", group: 6, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d⁴ 7s²", en: null, ar: 143, ox: [6], ir: null },
  { z: 107, sym: "Bh", name: "Bohrium", mass: "[270]", cat: "transition-metal", group: 7, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d⁵ 7s²", en: null, ar: 141, ox: [7], ir: null },
  { z: 108, sym: "Hs", name: "Hassium", mass: "[269]", cat: "transition-metal", group: 8, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d⁶ 7s²", en: null, ar: 134, ox: [8], ir: null },
  { z: 109, sym: "Mt", name: "Meitnerium", mass: "[278]", cat: "transition-metal", group: 9, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d⁷ 7s² (pred.)", en: null, ar: 129, ox: [], ir: null },
  { z: 110, sym: "Ds", name: "Darmstadtium", mass: "[281]", cat: "transition-metal", group: 10, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d⁹ 7s¹ (pred.)", en: null, ar: 128, ox: [], ir: null },
  { z: 111, sym: "Rg", name: "Roentgenium", mass: "[282]", cat: "transition-metal", group: 11, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s¹ (pred.)", en: null, ar: 121, ox: [], ir: null },
  { z: 112, sym: "Cn", name: "Copernicium", mass: "[285]", cat: "transition-metal", group: 12, period: 7, block: "d", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", en: null, ar: 122, ox: [2], ir: null },
  { z: 113, sym: "Nh", name: "Nihonium", mass: "[286]", cat: "post-transition-metal", group: 13, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹ (pred.)", en: null, ar: 136, ox: [], ir: null },
  { z: 114, sym: "Fl", name: "Flerovium", mass: "[289]", cat: "post-transition-metal", group: 14, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p² (pred.)", en: null, ar: 143, ox: [2], ir: null },
  { z: 115, sym: "Mc", name: "Moscovium", mass: "[290]", cat: "post-transition-metal", group: 15, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³ (pred.)", en: null, ar: 162, ox: [], ir: null },
  { z: 116, sym: "Lv", name: "Livermorium", mass: "[293]", cat: "post-transition-metal", group: 16, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴ (pred.)", en: null, ar: 175, ox: [], ir: null },
  { z: 117, sym: "Ts", name: "Tennessine", mass: "[294]", cat: "halogen", group: 17, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵ (pred.)", en: null, ar: 165, ox: [-1], ir: null },
  { z: 118, sym: "Og", name: "Oganesson", mass: "[294]", cat: "noble-gas", group: 18, period: 7, block: "p", config: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶ (pred.)", en: null, ar: 157, ox: [], ir: null },
];
