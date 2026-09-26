const question = document.querySelector(".question");
const hint = document.querySelector(".hint");
const yesBtn = document.querySelector(".yes-btn");
const noBtn = document.querySelector(".no-btn");
const summary = document.querySelector(".summary");
const signoff = document.querySelector(".signoff");
const toast = document.querySelector(".toast");
const dateInput = document.querySelector(".date-input");
const heartsBg = document.querySelector(".hearts-bg");
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HEARTS = ["💖", "💕", "💗", "💘", "❤️", "💞"];

// Personalize with ?to=Name&from=Name
const params = new URLSearchParams(location.search);
const toName = (params.get("to") || "").trim().slice(0, 40);
const fromName = (params.get("from") || "").trim().slice(0, 40);
if (toName) question.textContent = `${toName}, will you go out with me?`;
if (fromName) signoff.textContent = `Message me soon! — ${fromName}`;

const plan = { activity: "", emoji: "", when: "" };

/* ---------- Steps ---------- */
function showStep(name) {
  document.querySelectorAll(".step").forEach((s) => {
    s.classList.toggle("active", s.dataset.step === name);
  });
  if (name !== "ask") resetNoBtn();
}

/* ---------- The runaway "No" button ---------- */
const NO_TEXTS = [
  "No",
  "Are you sure?",
  "Really sure?",
  "Think again!",
  "Last chance!",
  "Surely not?",
  "You might regret this!",
  "Give it another thought!",
  "Are you absolutely certain?",
  "Have a heart! 🥺",
  "Don't be so cold!",
  "Change of heart?",
  "Is that your final answer?",
  "You're breaking my heart 💔",
];
const HINTS = [
  "",
  "Hmm, the button seems shy 👀",
  "Nope, it doesn't want to be clicked",
  "The Yes button is getting bigger… 👉",
  "Just saying, Yes looks really nice",
  "I can do this all day 😌",
  "My heart can't take much more",
  "Okay the No button is getting tired…",
];
const GIVE_UP_AT = NO_TEXTS.length + 2;
let dodges = 0;

function dodge() {
  dodges++;

  if (dodges >= GIVE_UP_AT) {
    noBtn.textContent = "Ok fine, yes 🙈";
    noBtn.classList.remove("running", "tired");
    noBtn.style.left = noBtn.style.top = "";
    hint.textContent = "The No button gave up 😂";
    return;
  }

  noBtn.textContent = NO_TEXTS[Math.min(dodges, NO_TEXTS.length - 1)];
  hint.textContent = HINTS[Math.min(dodges, HINTS.length - 1)];
  yesBtn.style.setProperty("--grow", Math.min(1 + dodges * 0.12, 2.2));
  noBtn.classList.toggle("tired", dodges > 7);

  moveNoBtn();
}

function moveNoBtn() {
  noBtn.classList.add("running");
  const rect = noBtn.getBoundingClientRect();
  const yesRect = yesBtn.getBoundingClientRect();
  const pad = 12;
  const maxX = Math.max(pad, window.innerWidth - rect.width - pad);
  const maxY = Math.max(pad, window.innerHeight - rect.height - pad);

  // Try a few spots, keep the first one that doesn't overlap Yes or sit under the cursor.
  let x, y;
  for (let i = 0; i < 20; i++) {
    x = pad + Math.random() * (maxX - pad);
    y = pad + Math.random() * (maxY - pad);
    const overlapsYes =
      x < yesRect.right + 10 &&
      x + rect.width > yesRect.left - 10 &&
      y < yesRect.bottom + 10 &&
      y + rect.height > yesRect.top - 10;
    const tooClose = Math.hypot(x - rect.left, y - rect.top) < 120;
    if (!overlapsYes && !tooClose) break;
  }
  noBtn.style.left = x + "px";
  noBtn.style.top = y + "px";
}

function resetNoBtn() {
  dodges = 0;
  noBtn.textContent = NO_TEXTS[0];
  noBtn.classList.remove("running", "tired");
  noBtn.style.left = noBtn.style.top = "";
  yesBtn.style.setProperty("--grow", 1);
  hint.textContent = "";
}

const noHasGivenUp = () => dodges >= GIVE_UP_AT;

noBtn.addEventListener("mouseover", () => {
  if (!noHasGivenUp()) dodge();
});
// Touch devices: dodge before the tap turns into a click.
noBtn.addEventListener("touchstart", (e) => {
  if (noHasGivenUp()) return;
  e.preventDefault();
  dodge();
}, { passive: false });
noBtn.addEventListener("click", () => {
  if (noHasGivenUp()) sayYes();
  else dodge();
});

window.addEventListener("resize", () => {
  if (!noBtn.classList.contains("running")) return;
  const rect = noBtn.getBoundingClientRect();
  noBtn.style.left = Math.min(rect.left, window.innerWidth - rect.width - 12) + "px";
  noBtn.style.top = Math.min(rect.top, window.innerHeight - rect.height - 12) + "px";
});

/* ---------- Yes! ---------- */
function sayYes() {
  const r = yesBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 140);
  showStep("what");
}
yesBtn.addEventListener("click", sayYes);

/* ---------- Choices ---------- */
document.querySelectorAll(".choices").forEach((group) => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice");
    if (!btn) return;
    group.querySelectorAll(".choice").forEach((c) => c.classList.remove("picked"));
    btn.classList.add("picked");
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 30);

    if (group.dataset.choice === "activity") {
      plan.activity = btn.dataset.value;
      plan.emoji = btn.dataset.emoji;
      setTimeout(() => showStep("when"), 350);
    } else {
      plan.when = btn.dataset.value;
      setTimeout(finish, 350);
    }
  });
});

const today = new Date();
dateInput.min = today.toISOString().slice(0, 10);
dateInput.addEventListener("change", () => {
  if (!dateInput.value) return;
  const d = new Date(dateInput.value + "T12:00:00");
  plan.when =
    "on " + d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  finish();
});

document.querySelectorAll("[data-back]").forEach((b) =>
  b.addEventListener("click", () => showStep(b.dataset.back))
);

function finish() {
  summary.innerHTML = "";
  summary.append(
    "We're going to ",
    Object.assign(document.createElement("strong"), { textContent: plan.activity }),
    " ",
    Object.assign(document.createElement("strong"), { textContent: plan.when }),
    ` ${plan.emoji}`
  );
  toast.textContent = "";
  showStep("done");
  celebrate();
}

document.querySelector(".restart-btn").addEventListener("click", () => {
  document.querySelectorAll(".choice").forEach((c) => c.classList.remove("picked"));
  dateInput.value = "";
  Object.assign(plan, { activity: "", emoji: "", when: "" });
  showStep("ask");
});

document.querySelector(".copy-btn").addEventListener("click", async () => {
  const who = toName ? `${toName} said YES! ` : "I said YES! ";
  const text = `${who}💖 We're going to ${plan.activity} ${plan.when} ${plan.emoji}`;
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.textContent = "Copied! Now send it 💌";
  } catch {
    toast.textContent = text;
  }
});

/* ---------- Effects: floating hearts ---------- */
function spawnFloatingHeart() {
  const h = document.createElement("span");
  h.className = "float-heart";
  h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  h.style.left = Math.random() * 100 + "vw";
  h.style.fontSize = 14 + Math.random() * 22 + "px";
  h.style.animationDuration = 7 + Math.random() * 7 + "s";
  h.style.setProperty("--drift", (Math.random() - 0.5) * 200 + "px");
  h.style.setProperty("--spin", (Math.random() - 0.5) * 90 + "deg");
  h.addEventListener("animationend", () => h.remove());
  heartsBg.appendChild(h);
}
if (!reduceMotion) {
  for (let i = 0; i < 6; i++) setTimeout(spawnFloatingHeart, i * 400);
  setInterval(spawnFloatingHeart, 900);
}

/* ---------- Effects: little hearts wherever you tap ---------- */
document.addEventListener("pointerdown", (e) => {
  if (reduceMotion || e.target.closest("button, input, a")) return;
  for (let i = 0; i < 5; i++) {
    const h = document.createElement("span");
    h.className = "pop-heart";
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.left = e.clientX + "px";
    h.style.top = e.clientY + "px";
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    h.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    h.style.setProperty("--dy", Math.sin(angle) * dist - 20 + "px");
    h.addEventListener("animationend", () => h.remove());
    document.body.appendChild(h);
  }
});

/* ---------- Effects: confetti canvas ---------- */
let particles = [];
let animating = false;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const COLORS = ["#e94d58", "#ff8fa3", "#ffc2d1", "#ffb703", "#b388eb", "#ffffff"];

function burst(x, y, count) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
      decay: 0.008 + Math.random() * 0.01,
      heart: Math.random() < 0.35 ? HEARTS[Math.floor(Math.random() * HEARTS.length)] : null,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }
  if (!animating) {
    animating = true;
    requestAnimationFrame(tick);
  }
}

function celebrate() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  burst(w / 2, h / 2, 160);
  setTimeout(() => burst(w * 0.2, h * 0.3, 80), 250);
  setTimeout(() => burst(w * 0.8, h * 0.3, 80), 500);
}

function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
  for (const p of particles) {
    p.vy += 0.18;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= p.decay;
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.heart) {
      ctx.font = `${p.size * 2}px serif`;
      ctx.fillText(p.heart, -p.size, p.size);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  }
  if (particles.length) requestAnimationFrame(tick);
  else animating = false;
}
