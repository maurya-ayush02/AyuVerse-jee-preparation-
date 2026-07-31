document.getElementById("brand-mark-img").src = "assets/images/icon-mark.webp";

/* ==========================================================
   AyuVerse — Physics Doubt Engine
   Curated bank of conceptual doubts, organised by chapter.
   Fully client-side (static site, no backend) — searchable
   and filterable so students can self-serve instantly.
========================================================== */

const CHAPTERS = [
  { id: "kinematics", name: "Kinematics" },
  { id: "laws", name: "Laws of Motion" },
  { id: "wep", name: "Work, Energy & Power" },
  { id: "rotation", name: "Rotational Motion" },
  { id: "gravitation", name: "Gravitation" },
  { id: "shmwaves", name: "SHM & Waves" },
  { id: "electrostat", name: "Electrostatics" },
  { id: "current", name: "Current Electricity" },
  { id: "magnetism", name: "Magnetism & EMI" },
  { id: "optics", name: "Optics" },
  { id: "modern", name: "Modern Physics" },
  { id: "thermo", name: "Thermodynamics" },
  { id: "fluids", name: "Fluid Mechanics" },
];

const DOUBTS = [
  { ch: "kinematics", q: "Why isn't average velocity always (u + v) / 2?", a: "That formula only holds when acceleration is constant, because it's really the time-average of a linear velocity-time graph. If acceleration changes with time, velocity vs time is a curve, not a straight line, and (u+v)/2 no longer equals total displacement divided by total time. Always fall back on avg velocity = total displacement / total time — it's true in every case, constant acceleration or not." },
  { ch: "kinematics", q: "What's actually different between average speed and average velocity?", a: "Average speed uses total path length (a scalar, always positive), while average velocity uses net displacement (a vector, can be zero or negative). A ball thrown up and caught at the same point has covered real distance, so its average speed is nonzero — but its displacement is zero, so its average velocity is exactly zero. They only match when motion is one-directional along a straight line." },
  { ch: "kinematics", q: "Why can velocity be negative but speed can never be?", a: "Speed is the magnitude of the velocity vector, and magnitudes are defined to be non-negative by convention — there's no such thing as 'negative distance covered'. Velocity, on the other hand, carries direction information relative to a chosen positive axis; a negative sign just means the object is moving opposite to whatever direction you called positive. So |velocity| = speed, always, and the sign lives entirely in the vector, not the magnitude." },

  { ch: "laws", q: "Why do we need a pseudo (fictitious) force in a non-inertial frame?", a: "Newton's laws are only valid in inertial frames. If you insist on analysing motion from an accelerating frame (say, a braking car), objects appear to accelerate even though no real force acts on them — because the frame itself is accelerating relative to the ground. To force F = ma to still 'work' in that frame, you add a pseudo force of magnitude ma_frame, directed opposite to the frame's acceleration. It isn't a real interaction — it's bookkeeping that lets you keep using F = ma in a frame where it technically doesn't apply." },
  { ch: "laws", q: "If every action has an equal and opposite reaction, why does anything move at all?", a: "The key point people miss is that action and reaction act on two different bodies, so they never cancel each other for a single object. When you push a wall, the wall pushes back on you — but your push is on the wall and the wall's push is on you, so neither force is 'used up' cancelling the other. What actually determines your motion is the net force on you alone, and that's rarely zero." },
  { ch: "laws", q: "Why isn't friction always equal to μN?", a: "μN is the maximum possible value of static friction, not its actual value in every situation. Static friction is a self-adjusting force — it takes whatever value is needed (from 0 up to μsN) to prevent relative sliding. Only once the applied force exceeds μsN does the object actually start to slip, and only then does kinetic friction (μkN, roughly constant) take over. So for a block sitting still with no horizontal push, friction on it is exactly zero, not μN." },

  { ch: "wep", q: "How can static friction do zero work if it clearly stops an object from sliding?", a: "Work depends on the displacement of the point where the force acts, not just whether the force exists. In pure rolling, the contact point of a wheel is instantaneously at rest relative to the ground (that's the whole definition of rolling without slipping) — so even though static friction acts there, that point undergoes zero displacement at that instant, and force × zero displacement = zero work. Friction changes the distribution of energy between translation and rotation, but it doesn't add or remove total mechanical energy in ideal rolling." },
  { ch: "wep", q: "Why is potential energy only defined for conservative forces?", a: "Potential energy is a bookkeeping trick that only works if the work done depends solely on the start and end positions, not the path taken — that's the literal definition of a conservative force. For non-conservative forces like friction, the work done depends on the path (a longer path means more energy lost to heat), so you can't assign a single, path-independent number to each position that would let you 'recover' the energy later. Without path-independence, the concept of a well-defined PE simply breaks down." },
  { ch: "wep", q: "Can kinetic energy ever be negative?", a: "No — kinetic energy is (1/2)mv², and since mass is always positive and v² can never be negative (even for negative velocities), KE is always ≥ 0. If a calculation ever gives you negative KE, it's a signal that something upstream is wrong — often a sign error in energy conservation, or applying a formula in a regime (like relativistic speeds) where it no longer applies." },

  { ch: "rotation", q: "What does moment of inertia actually mean physically?", a: "Moment of inertia is rotational inertia — it measures how much a body resists a change in its angular velocity, exactly the way mass measures resistance to a change in linear velocity. It depends not just on how much mass a body has, but on how that mass is distributed relative to the axis: mass far from the axis contributes far more (∝ r²) than the same mass close to the axis. That's why a hoop and a disc of equal mass and radius have different moments of inertia — the hoop has all its mass at maximum distance." },
  { ch: "rotation", q: "In an inelastic collision between rotating bodies, why is angular momentum conserved but kinetic energy isn't?", a: "Angular momentum is conserved whenever there's no external torque on the system — internal forces during the collision (however violent) always come in action-reaction pairs that produce equal and opposite torques about a common axis, so they cancel out in the total. Kinetic energy has no such guarantee: during an inelastic collision, some KE is genuinely converted into heat, sound, and deformation, which is precisely what 'inelastic' means. So conservation of angular momentum is a much stronger, more general law than conservation of KE." },
  { ch: "rotation", q: "Why does a solid sphere reach the bottom of an incline faster than a hollow sphere of the same mass and radius?", a: "Both have the same total energy budget (mgh) to split between translational and rotational KE, but a hollow sphere has a larger moment of inertia (mass is farther from the axis) so a larger fraction of that energy has to go into spinning it up rather than moving it forward. Less energy left for translational KE means a lower final linear speed and a longer time to reach the bottom — the solid sphere, with its smaller I, converts more of its PE into forward motion." },

  { ch: "gravitation", q: "Why is gravitational potential energy taken as negative?", a: "It's a choice of reference point, not a fundamental sign — by convention, PE is set to zero when two masses are infinitely far apart (no interaction at all). Since gravity is attractive, you have to do positive work to pull two masses apart to infinity, which means their PE at any finite separation must be lower than zero — hence the negative sign. It simply reflects that a bound system is in a lower energy state than a fully separated one." },
  { ch: "gravitation", q: "Why do astronauts in orbit feel weightless if Earth's gravity is still acting on them up there?", a: "They aren't actually weightless in the sense of zero gravitational force — gravity at typical orbital altitude is still roughly 90% of its surface value. What they experience is free fall: both the astronaut and the spacecraft are accelerating toward Earth at exactly the same rate, so there's no relative force between the astronaut and the floor/walls of the cabin, which is what a scale would normally measure as 'weight'. It's the same sensation you get in the weightless instant at the top of a jump, just sustained indefinitely because orbital velocity means they keep 'falling' around the Earth rather than into it." },
  { ch: "gravitation", q: "Why is escape velocity independent of the direction (angle) of launch?", a: "Escape velocity comes purely from an energy condition: total mechanical energy (KE + gravitational PE) must be ≥ 0 for a body to just barely reach infinity with zero leftover speed. Kinetic energy, (1/2)mv², depends only on speed, not direction — so the energy argument doesn't care which way you point the velocity vector. In practice, launching sideways from a real planet's surface would eventually hit the ground before escaping, but in the idealised point-mass scenario used for this result, direction genuinely doesn't matter." },

  { ch: "shmwaves", q: "Why is SHM defined by acceleration proportional to -x, and not to -x² or something else?", a: "The -x relationship is what makes the restoring force linear, and a linear restoring force is exactly the condition that produces a solution of the form x = A sin(ωt + φ) — pure sinusoidal motion with a single, amplitude-independent frequency. If the force went as -x² or any other power, the equation of motion wouldn't have that clean sinusoidal solution, the period would depend on amplitude, and the motion, while still oscillatory, would no longer qualify as simple harmonic motion by definition." },
  { ch: "shmwaves", q: "How does a wave carry energy from one place to another without carrying any matter?", a: "In a mechanical wave, each particle of the medium oscillates about its own fixed equilibrium position — it doesn't travel along with the wave, it just passes energy to its neighbour by pushing or pulling on it, like a row of people passing a ball down the line without anyone moving from their spot. What propagates is the disturbance (and the energy stored in it), not the material itself — that's why a cork bobbing on water waves moves up and down but doesn't get carried out to sea." },
  { ch: "shmwaves", q: "Why do beats occur when you play two notes of slightly different frequency together?", a: "Beats are the result of superposition: at some instants the two waves are in phase and add up (loud), and at other instants they're out of phase and cancel (quiet), and this pattern repeats periodically because the phase difference between them keeps drifting due to their slightly different frequencies. The beat frequency you hear as a pulsing loudness is exactly the difference between the two frequencies, |f1 − f2| — the closer the two notes are, the slower and more noticeable the beating." },

  { ch: "electrostat", q: "Why is the electric field inside a conductor always zero in electrostatic equilibrium?", a: "A conductor has free charges that are able to move. If there were any net field inside, those free charges would feel a force and keep moving — which by definition means the system hasn't reached equilibrium yet. The charges rearrange themselves on the surface precisely until the field they produce exactly cancels any external field everywhere inside, at which point there's no more force to drive further motion, and the conductor has reached (electrostatic) equilibrium. So zero internal field isn't an assumption — it's the necessary end state of that rearrangement." },
  { ch: "electrostat", q: "Why can't two electric field lines ever cross each other?", a: "A field line at any point is defined to be tangent to the direction of the net electric field at that point. If two lines crossed, the field at that crossing point would have to point in two different directions simultaneously — which is meaningless, because the net field at any location is a single, unique vector obtained by adding up all contributions there. Since the field can only have one direction at one point, its field lines can never intersect." },
  { ch: "electrostat", q: "Why is the potential the same everywhere on a conductor's surface, even if the charge isn't spread uniformly?", a: "Potential being constant on the surface follows from the field inside (and tangential to the surface) being zero at equilibrium — if there were any potential difference between two surface points, there'd be a tangential field driving charge to flow between them until that difference vanished. Charge density can still vary a lot across the surface (it's higher at sharp points, for instance) because density depends on local geometry, not directly on potential — but the conductor as a whole still settles at one single equipotential value." },

  { ch: "current", q: "Why does resistance increase with temperature in metals but decrease in semiconductors?", a: "In a metal, the number of free charge carriers is essentially fixed, and what temperature does is increase the thermal vibration of the lattice ions, giving electrons more to collide with — more collisions means more resistance. In a semiconductor, temperature does something different and dominant: it thermally excites more electrons across the band gap into the conduction band, sharply increasing the number of available charge carriers. That increase in carrier density outweighs the increased scattering, so overall resistance falls as temperature rises." },
  { ch: "current", q: "Why is terminal voltage less than EMF whenever current flows out of a cell?", a: "EMF is the total energy per unit charge the cell can supply, but real cells have internal resistance, and some of that energy is inevitably spent driving charge through the cell itself, not just through the external circuit. Terminal voltage is what's left over for the external circuit — EMF minus the voltage dropped across internal resistance (Ir). Only when no current flows (open circuit) does that internal drop vanish, and terminal voltage equals EMF exactly." },
  { ch: "current", q: "Kirchhoff's junction and loop rules feel like separate laws — what are they actually based on?", a: "They're not independent laws at all; they're charge conservation and energy conservation applied to a circuit. The junction rule (currents in = currents out) is just charge conservation — charge can't pile up or vanish at a junction. The loop rule (sum of EMFs = sum of IR drops around any closed loop) is energy conservation — potential is a well-defined quantity at every point in the circuit, so going around any closed path and returning to your start must give a net change of exactly zero." },

  { ch: "magnetism", q: "Why does the magnetic force on a moving charge do zero work?", a: "The magnetic force on a charge is always F = qv × B, and by the properties of the cross product, this force vector is always perpendicular to the velocity v. Work is force times displacement along the direction of motion, and a force perpendicular to velocity has zero component along the direction of motion at every instant. So a magnetic field can bend a charge's path (change its direction) but can never speed it up or slow it down — its speed and kinetic energy stay exactly constant." },
  { ch: "magnetism", q: "Why does Lenz's law say the induced current opposes the change that caused it?", a: "It's a direct consequence of energy conservation. If the induced current instead reinforced the change in flux, you'd get a runaway feedback loop — more flux change causing more induced current causing even more flux change — which would generate energy from nothing, violating the first law of thermodynamics. By opposing the change, the induced current requires you to do work (against that opposition) to keep changing the flux, and that work is exactly what becomes the electrical energy delivered by the induced EMF." },
  { ch: "magnetism", q: "Why is mutual inductance the same in both directions (M12 = M21) between two coils?", a: "This symmetry isn't obvious from the geometry, but it follows from a deeper energy argument (a reciprocity theorem): the magnetic energy stored in a two-coil system depends on a single cross term involving both currents, and that term must be symmetric for the total energy to be a well-defined, path-independent quantity. So no matter how different the two coils look — different shapes, sizes, turns — the flux linked in coil 2 due to unit current in coil 1 always equals the flux linked in coil 1 due to unit current in coil 2." },

  { ch: "optics", q: "Why does a plane mirror flip left and right but not flip you upside down?", a: "A mirror doesn't actually swap left and right — what it really does is reverse front and back (it flips the axis perpendicular to its surface, i.e. depth). The apparent left-right flip is something your brain adds: when you face a mirror, your image also appears to face you, and to make that image's 'left hand' line up with your own sense of left, your brain interprets the depth-reversal as a left-right swap. Up and down were never touched by the reflection, which is why the image isn't upside down." },
  { ch: "optics", q: "Why does a lens's focal length change when it's put in water instead of air?", a: "Focal length depends on how sharply the lens bends light, and that bending comes from the relative refractive index between the lens material and the surrounding medium (Lensmaker's equation uses n_lens/n_medium, not just n_lens). In air, that ratio is large because air's index (~1) is much smaller than glass's; in water, the surrounding index rises to ~1.33, shrinking the ratio and reducing the light-bending power — so a converging glass lens becomes noticeably weaker (longer focal length) underwater." },
  { ch: "optics", q: "Why do soap bubbles and oil films show colourful rainbow patterns?", a: "This is thin-film interference: light reflects off both the outer and inner surfaces of the thin film, and the two reflected waves travel slightly different path lengths before recombining. Because that extra path length depends on the film's thickness and the light's wavelength, some wavelengths interfere constructively (and appear bright) while others interfere destructively (and cancel) at any given point. Since film thickness varies slightly across a bubble's surface, different colours get reinforced in different spots, producing the shifting rainbow pattern." },

  { ch: "modern", q: "Why does the photoelectric effect happen instantly, with no time lag, while the wave theory of light predicted a delay?", a: "The wave theory pictured light energy spreading continuously across the entire wavefront, so it assumed an electron would need time to slowly 'soak up' enough energy before it could escape — predicting a measurable delay, especially for dim light. Einstein's photon picture explains the instant emission: light energy arrives in discrete packets (photons) of energy hf, and if a single photon has energy at least equal to the work function, it can be absorbed by a single electron and eject it in one shot, with no need to accumulate energy over time at all." },
  { ch: "modern", q: "What does 'wave-particle duality' actually mean — is light a wave or a particle?", a: "It means light (and matter) doesn't behave purely like either classical picture — it shows wave-like behaviour (interference, diffraction) in some experiments and particle-like behaviour (discrete energy exchange, as in the photoelectric effect) in others, and which one you observe depends on what you're measuring. It's not that light switches between two identities; rather, both classical concepts are approximations of a single underlying quantum description, and each experiment reveals a different aspect of that same reality." },
  { ch: "modern", q: "Why do we look at binding energy per nucleon, rather than just total binding energy, to judge nuclear stability?", a: "Total binding energy naturally grows with a bigger nucleus, just because there are more nucleons contributing to it — so on its own, total binding energy tells you more about size than stability. Binding energy per nucleon strips that size effect out and measures how tightly, on average, each individual nucleon is held — a genuinely fair way to compare nuclei of different sizes. That's exactly why the binding-energy-per-nucleon curve, peaking around iron/nickel, explains both why fusion releases energy for light nuclei and why fission releases energy for heavy ones — both processes move nuclei toward that peak." },

  { ch: "thermo", q: "Why is internal energy a state function but work isn't?", a: "Internal energy depends only on the current state of the system (its temperature, for an ideal gas) — however you got there, U is the same, which is exactly the definition of a state function. Work, by contrast, is a path function: the amount of work done in going from state A to state B depends on exactly how you got there — a slow isothermal expansion and a quick adiabatic expansion between the same two volumes do very different amounts of work, even though ΔU might differ too. Heat is likewise path-dependent; only their combination through the first law, ΔU = Q − W, is guaranteed to be path-independent." },
  { ch: "thermo", q: "Why does an ideal gas have zero potential energy between its molecules?", a: "It's part of the defining assumption of an ideal gas: molecules are treated as point particles with no intermolecular forces except during instantaneous, perfectly elastic collisions. With no forces acting between separated molecules, there's no interaction energy to store — so all of the gas's internal energy is purely kinetic, which is exactly why internal energy of an ideal gas depends only on temperature and not on volume or pressure." },
  { ch: "thermo", q: "Why is the Carnot engine's efficiency called the maximum possible, rather than just one option among many?", a: "This comes straight from the second law of thermodynamics: any cycle that could beat Carnot's efficiency between the same two temperatures could be combined with a reversed Carnot engine to create a net flow of heat from a cold reservoir to a hot one with no external work input — which is exactly what the second law forbids (Clausius statement). Carnot's cycle achieves the theoretical ceiling because it's entirely reversible, with no wasted, irreversible entropy-generating processes like friction or unrestrained expansion — anything real always falls short of it." },

  { ch: "fluids", q: "Why does a steel ship float when steel itself is denser than water?", a: "What matters for floating isn't the density of the material the ship is made of, but the average density of the entire ship (hull + all the enclosed air) compared to water. A ship's hull is shaped to enclose a large volume of air, which drastically lowers its overall average density below that of water, even though the steel plating alone would sink instantly. As long as the ship displaces a volume of water whose weight equals the ship's total weight before it's fully submerged, it floats — that's Archimedes' principle in action." },
  { ch: "fluids", q: "Why does fluid speed up when a pipe narrows, according to Bernoulli's principle?", a: "This actually comes from the continuity equation (mass conservation) first: for an incompressible fluid, the volume flow rate (A × v) must stay the same everywhere along the pipe, so a smaller cross-sectional area A forces a larger velocity v to keep that product constant. Bernoulli's equation then tells you the consequence of that speed-up: since kinetic energy per unit volume increases in the narrow section, pressure must drop there to keep total mechanical energy conserved along the flow — that pressure drop is what you measure, but the speed-up itself is really about conservation of mass." },
  { ch: "fluids", q: "Why does a liquid rise up a narrow capillary tube on its own?", a: "It's a competition between two forces: adhesion (the liquid's attraction to the tube's walls) and cohesion (the liquid's attraction to itself), combined with surface tension trying to minimise the liquid's surface area. When adhesion to the walls is strong (as with water and glass), the liquid surface curves upward at the walls (forming a concave meniscus), and surface tension along that curved surface pulls the liquid column upward until the weight of the risen liquid balances the vertical component of the surface tension force. Narrower tubes have a larger surface-to-volume ratio for the meniscus, which is why capillary rise is more pronounced in thinner tubes." },
];

/* ==========================================================
   Ask-AI panel — a small teaching chat.
   Asks the student's name once (stored in localStorage), then
   explains step by step and can re-explain more simply on request,
   via a Cloudflare Worker proxy (keeps the Gemini key secret).
   Replace WORKER_URL below with your deployed Worker's URL.
========================================================== */
const WORKER_URL = "https://ayuverse-doubt-solver.maurya-kd75.workers.dev";
const NAME_KEY = "ayuverse_student_name";
const MAX_HISTORY_MESSAGES = 10; // trims older turns so payloads/cost stay bounded

const nameGateEl = document.getElementById("name-gate");
const nameInputEl = document.getElementById("name-input");
const nameSubmitEl = document.getElementById("name-submit");
const chatAreaEl = document.getElementById("chat-area");
const chatLogEl = document.getElementById("chat-log");
const questionEl = document.getElementById("ai-question");
const charCountEl = document.getElementById("char-count");
const solveBtn = document.getElementById("solve-btn");
const statusEl = document.getElementById("ai-status");
const errorEl = document.getElementById("ai-error");

const imageInputEl = document.getElementById("image-input");
const cameraInputEl = document.getElementById("camera-input");
const attachImgBtn = document.getElementById("attach-img-btn");
const snapCamBtn = document.getElementById("snap-cam-btn");
const imagePreviewContainer = document.getElementById("image-preview-container");
const imagePreviewEl = document.getElementById("image-preview");
const removeImgBtn = document.getElementById("remove-img-btn");

let currentImageData = null;

attachImgBtn.addEventListener("click", () => imageInputEl.click());
snapCamBtn.addEventListener("click", () => cameraInputEl.click());

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) { // 5MB limit check
    errorEl.textContent = "Image size must be smaller than 5MB.";
    errorEl.classList.remove("hidden");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    const dataUrl = evt.target.result;
    const [header, base64] = dataUrl.split(",");
    const mimeType = header.match(/:(.*?);/)[1];

    currentImageData = { mimeType, dataBase64: base64 };
    imagePreviewEl.src = dataUrl;
    imagePreviewContainer.classList.remove("hidden");
    errorEl.classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

imageInputEl.addEventListener("change", handleImageSelect);
cameraInputEl.addEventListener("change", handleImageSelect);

removeImgBtn.addEventListener("click", () => {
  currentImageData = null;
  imageInputEl.value = "";
  cameraInputEl.value = "";
  imagePreviewContainer.classList.add("hidden");
  imagePreviewEl.src = "";
});

let studentName = "";
let chatHistory = []; // [{ role: "user" | "ai", text }]

function getStoredName() {
  try {
    return localStorage.getItem(NAME_KEY) || "";
  } catch {
    return "";
  }
}
function storeName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* localStorage unavailable — chat still works, just won't remember next visit */
  }
}

function addMessage(role, text, extra) {
  chatHistory.push(Object.assign({ role, text }, extra));

  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  const roleLabel = role === "user" ? "You" : "Ayu (AI tutor)";
  msg.innerHTML = `
    <div class="msg-role">${roleLabel}</div>
    <div class="msg-bubble"></div>
  `;
  msg.querySelector(".msg-bubble").textContent = text;

  if (role === "ai") {
    const btn = document.createElement("button");
    btn.className = "explain-more-btn";
    btn.type = "button";
    btn.textContent = "Still confused? Explain it more simply →";
    btn.addEventListener("click", () => {
      btn.disabled = true;
      sendToTutor("I still don't understand this — can you explain it again in a simpler way, maybe with an easier example or analogy?");
    });
    msg.appendChild(btn);
  }

  chatLogEl.appendChild(msg);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

async function sendToTutor(text) {
  const extra = currentImageData ? { image: currentImageData } : undefined;

  addMessage("user", text || "[Attached Image]", extra);
  removeImgBtn.click();

  errorEl.classList.add("hidden");
  solveBtn.disabled = true;
  statusEl.classList.remove("hidden");

  const trimmedHistory = chatHistory.slice(-MAX_HISTORY_MESSAGES);

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: studentName, messages: trimmedHistory }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.error) {
      const base = (data && data.error) || `Request failed (${res.status})`;
      const detail = data && data.detail ? `: ${data.detail}` : "";
      throw new Error(base + detail);
    }

    addMessage("ai", data.answer || "No response was returned — try rephrasing your question.");
  } catch (err) {
    errorEl.textContent = "Couldn't get a reply right now (" + err.message + "). Please try again in a moment.";
    errorEl.classList.remove("hidden");
  } finally {
    solveBtn.disabled = false;
    statusEl.classList.add("hidden");
  }
}

function askQuestion() {
  const question = questionEl.value.trim();
  if (!question && !currentImageData) {
    errorEl.textContent = "Type a question or attach an image first.";
    errorEl.classList.remove("hidden");
    return;
  }
  questionEl.value = "";
  charCountEl.textContent = "0";
  sendToTutor(question);
}

function startChat(name) {
  studentName = name;
  nameGateEl.classList.add("hidden");
  chatAreaEl.classList.remove("hidden");
  addMessage("ai", `Hey ${name}! Paste any JEE Advanced physics question or doubt below and I'll walk you through it step by step.`);
}

nameSubmitEl.addEventListener("click", () => {
  const name = nameInputEl.value.trim();
  if (!name) {
    nameInputEl.focus();
    return;
  }
  storeName(name);
  startChat(name);
});
nameInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") nameSubmitEl.click();
});

questionEl.addEventListener("input", () => {
  charCountEl.textContent = questionEl.value.length;
});
solveBtn.addEventListener("click", askQuestion);
questionEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") askQuestion();
});

const existingName = getStoredName();
if (existingName) {
  nameInputEl.value = existingName;
  startChat(existingName);
}

/* ---------------- Rendering & interaction ---------------- */

const chapterFilterEl = document.getElementById("chapter-filter");
const listEl = document.getElementById("doubt-list");
const searchEl = document.getElementById("search-input");
const countEl = document.getElementById("result-count");
const emptyEl = document.getElementById("empty-state");

let activeChapter = "all";
let activeQuery = "";

function buildChapterChips() {
  const allChip = document.createElement("button");
  allChip.className = "chip selected";
  allChip.type = "button";
  allChip.dataset.chapter = "all";
  allChip.textContent = "All chapters";
  chapterFilterEl.appendChild(allChip);

  CHAPTERS.forEach((c) => {
    const count = DOUBTS.filter((d) => d.ch === c.id).length;
    if (count === 0) return;
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.dataset.chapter = c.id;
    chip.textContent = `${c.name} (${count})`;
    chapterFilterEl.appendChild(chip);
  });

  chapterFilterEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    chapterFilterEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
    btn.classList.add("selected");
    activeChapter = btn.dataset.chapter;
    render();
  });
}

function chapterName(id) {
  const c = CHAPTERS.find((c) => c.id === id);
  return c ? c.name : id;
}

function matchesQuery(doubt, query) {
  if (!query) return true;
  const hay = (doubt.q + " " + doubt.a).toLowerCase();
  return hay.includes(query);
}

function render() {
  const query = activeQuery.trim().toLowerCase();
  const filtered = DOUBTS.filter((d) => {
    const chapterOk = activeChapter === "all" || d.ch === activeChapter;
    return chapterOk && matchesQuery(d, query);
  });

  listEl.innerHTML = "";
  countEl.textContent = `${filtered.length} doubt${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  filtered.forEach((d, i) => {
    const item = document.createElement("div");
    item.className = "doubt-item";
    item.innerHTML = `
      <button class="doubt-q" type="button" aria-expanded="false">
        <span class="doubt-tag">${chapterName(d.ch)}</span>
        <span class="doubt-q-text">${d.q}</span>
        <span class="doubt-chevron" aria-hidden="true">+</span>
      </button>
      <div class="doubt-a hidden">${d.a}</div>
    `;
    const btn = item.querySelector(".doubt-q");
    const answer = item.querySelector(".doubt-a");
    const chevron = item.querySelector(".doubt-chevron");
    btn.addEventListener("click", () => {
      const isOpen = !answer.classList.contains("hidden");
      answer.classList.toggle("hidden");
      btn.setAttribute("aria-expanded", String(!isOpen));
      chevron.textContent = isOpen ? "+" : "\u2212";
    });
    listEl.appendChild(item);
  });
}

searchEl.addEventListener("input", (e) => {
  activeQuery = e.target.value;
  render();
});

buildChapterChips();
render();
