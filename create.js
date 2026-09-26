const form = document.querySelector(".maker");
const liveQ = document.querySelector(".live-q");
const replyId = form.elements.rid;
const fieldNote = document.querySelector(".field-note");
const errorEl = document.querySelector(".error");
const result = document.querySelector(".result");
const linkOut = document.querySelector(".link-out");
const toast = document.querySelector(".toast");
const shareBtn = document.querySelector(".share-link");

document.querySelector(".support-link").href = WY.SUPPORT_URL;

// Start from the link being edited (coming back from a preview). Otherwise start
// from today's Valentine's Week day if it is one, else the defaults.
const today = WY.occasionForToday();
const state = WY.fromLocation() || WY.sanitize({ v: 1, o: today || "date" });
let replyKind = state.r ? state.r.k : "";

/* ---------- Dropdown ---------- */
// A small listbox: click or arrow keys to open, arrows/Enter to pick, Esc to close.
// Option labels and icons only ever come from config.js, never from user input.
const dropdowns = [];

function makeDropdown(root, options, value, onChange) {
  const name = root.dataset.dd;
  const labelId = root.getAttribute("aria-labelledby");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "dd-trigger";
  trigger.id = `${name}-trigger`;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-labelledby", `${labelId} ${trigger.id}`);

  const panel = document.createElement("div");
  panel.className = "dd-panel";
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-labelledby", labelId);
  panel.tabIndex = -1;
  panel.hidden = true;

  const content = (o) =>
    `<span class="dd-icon">${o.icon}</span><span class="dd-text">${o.label}</span>` +
    (o.badge ? `<span class="today">${o.badge}</span>` : "");

  let lastGroup = null;
  const optionEls = options.map((o, i) => {
    if (o.group && o.group !== lastGroup) {
      lastGroup = o.group;
      const h = document.createElement("div");
      h.className = "dd-group";
      h.setAttribute("role", "presentation");
      h.textContent = o.group;
      panel.appendChild(h);
    }
    const el = document.createElement("div");
    el.className = "dd-option";
    el.id = `${name}-opt-${i}`;
    el.setAttribute("role", "option");
    el.innerHTML = content(o) + '<span class="dd-check" aria-hidden="true">✓</span>';
    el.addEventListener("click", () => choose(i));
    el.addEventListener("pointermove", () => setActive(i, false));
    panel.appendChild(el);
    return el;
  });
  root.append(trigger, panel);

  let selected = 0;
  let active = 0;

  function set(v) {
    selected = Math.max(0, options.findIndex((o) => o.value === v));
    trigger.innerHTML = content(options[selected]) + '<span class="dd-chevron" aria-hidden="true"></span>';
    optionEls.forEach((el, i) => el.setAttribute("aria-selected", String(i === selected)));
  }

  function setActive(i, scroll = true) {
    active = (i + options.length) % options.length;
    optionEls.forEach((el, j) => el.classList.toggle("active", j === active));
    panel.setAttribute("aria-activedescendant", optionEls[active].id);
    if (scroll) optionEls[active].scrollIntoView({ block: "nearest" });
  }

  function open() {
    dropdowns.forEach((d) => d !== api && d.close());
    panel.hidden = false;
    root.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    // Open upward if there isn't room below.
    const r = trigger.getBoundingClientRect();
    root.classList.toggle("up", window.innerHeight - r.bottom < panel.offsetHeight + 16 && r.top > panel.offsetHeight + 16);
    setActive(selected);
    panel.focus({ preventScroll: true });
  }

  function close(focusTrigger = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    root.classList.remove("open", "up");
    trigger.setAttribute("aria-expanded", "false");
    if (focusTrigger) trigger.focus();
  }

  function choose(i) {
    const changed = i !== selected;
    set(options[i].value);
    close(true);
    if (changed) onChange(options[i].value);
  }

  trigger.addEventListener("click", () => (panel.hidden ? open() : close()));
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      open();
    }
  });
  panel.addEventListener("keydown", (e) => {
    const keys = {
      ArrowDown: () => setActive(active + 1),
      ArrowUp: () => setActive(active - 1),
      Home: () => setActive(0),
      End: () => setActive(options.length - 1),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => close(true),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    } else if (e.key === "Tab") close();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!root.contains(e.target)) close();
  });

  const api = { set, close };
  dropdowns.push(api);
  set(value);
  return api;
}

const occasionOptions = [];
for (const [groupKey, groupLabel] of Object.entries(WY.GROUPS)) {
  for (const [key, o] of Object.entries(WY.OCCASIONS)) {
    if (o.group !== groupKey) continue;
    occasionOptions.push({ value: key, icon: o.emoji, label: o.label, group: groupLabel, badge: key === today ? "today" : "" });
  }
}

const themeOptions = Object.entries(WY.THEMES).map(([key, t]) => ({
  value: key,
  icon: `<span class="swatch" style="background:${t.swatch}"></span>`,
  label: t.label,
}));

const REPLY_ICONS = { whatsapp: "💬", instagram: "📸", telegram: "✈️", messenger: "💭", sms: "📱", email: "✉️" };
const replyOptions = [
  { value: "", icon: "🙈", label: "No reply button" },
  ...Object.entries(WY.REPLY).map(([key, r]) => ({ value: key, icon: REPLY_ICONS[key] || "💌", label: r.label })),
];

makeDropdown(document.querySelector('[data-dd="occasion"]'), occasionOptions, state.o, (value) => {
  const prevDefault = WY.OCCASIONS[state.o].question;
  state.o = value;
  // Keep a custom question, but swap in the new default if they hadn't changed it.
  const q = form.elements.q.value.trim();
  if (!q || q === prevDefault) form.elements.q.value = WY.OCCASIONS[state.o].question;
  state.th = WY.OCCASIONS[state.o].theme;
  themeDd.set(state.th);
  sync();
});

const themeDd = makeDropdown(document.querySelector('[data-dd="theme"]'), themeOptions, state.th, (value) => {
  state.th = value;
  sync();
});

makeDropdown(document.querySelector('[data-dd="reply"]'), replyOptions, replyKind, (value) => {
  replyKind = value;
  replyId.value = "";
  sync();
  if (replyKind) replyId.focus();
});

/* ---------- Fill the form from state ---------- */
form.elements.to.value = state.to;
form.elements.from.value = state.from;
form.elements.q.value = state.q;
if (state.r) replyId.value = state.r.id;
render();

form.addEventListener("input", sync);

// Read the form into state and redraw.
function sync() {
  state.to = form.elements.to.value.trim();
  state.from = form.elements.from.value.trim();
  state.q = form.elements.q.value.trim() || WY.OCCASIONS[state.o].question;
  errorEl.textContent = "";
  result.hidden = true;
  render();
  // Keep the draft in this tab's address bar (after #, never sent anywhere) so a reload keeps it.
  history.replaceState(null, "", "#" + WY.encode(currentConfig(false)));
}

function render() {
  document.body.dataset.theme = state.th;
  liveQ.textContent = WY.questionFor(state);

  const kind = WY.REPLY[replyKind];
  replyId.hidden = !kind;
  if (!kind) {
    fieldNote.textContent = "";
    fieldNote.classList.remove("caution");
    return;
  }
  replyId.placeholder = kind.placeholder;
  replyId.inputMode = kind.phone ? "tel" : replyKind === "email" ? "email" : "text";
  fieldNote.classList.toggle("caution", !!kind.phone || replyKind === "email");
  fieldNote.textContent = kind.phone
    ? "⚠️ Your number will be visible to anyone who has the link. A username (Instagram, Telegram) is more private."
    : replyKind === "email"
      ? "⚠️ Your email will be visible to anyone who has the link."
      : `After they say yes, a “Tell ${state.from || "them"} 💌” button opens a chat with you.`;
}

// The config to put in the link; reports a bad contact when `strict`.
function currentConfig(strict = true) {
  const cfg = { ...state, r: null };
  if (replyKind) {
    const id = WY.normalizeContact(replyKind, replyId.value);
    if (id) cfg.r = { k: replyKind, id };
    else if (strict) {
      errorEl.textContent = replyId.value.trim()
        ? `That doesn't look like a valid ${WY.REPLY[replyKind].label} contact.`
        : `Add your ${WY.REPLY[replyKind].label} contact, or choose “No reply button”.`;
      replyId.focus();
      return null;
    }
  }
  return cfg;
}

function buildLink(cfg) {
  return new URL("./#" + WY.encode(cfg), location.href).href;
}

/* ---------- Preview / get link ---------- */
document.querySelector(".preview-btn").addEventListener("click", () => {
  const cfg = currentConfig();
  if (!cfg) return;
  const link = buildLink(cfg);
  // Only this tab remembers it's the sender, so only the sender sees "← Edit".
  try {
    sessionStorage.setItem(WY.PREVIEW_KEY, new URL(link).hash);
  } catch {}
  location.href = link;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const cfg = currentConfig();
  if (!cfg) return;
  linkOut.value = buildLink(cfg);
  toast.textContent = "";
  result.hidden = false;
  shareBtn.hidden = !navigator.share;
  result.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector(".copy-link").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(linkOut.value);
    toast.textContent = "Link copied! Now send it 💌";
  } catch {
    linkOut.select();
    toast.textContent = "Select the link above and copy it.";
  }
});

shareBtn.addEventListener("click", () => {
  navigator.share({ url: linkOut.value }).catch(() => {});
});
