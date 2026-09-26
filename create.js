const form = document.querySelector(".maker");
const occasionsEl = document.querySelector(".occasions");
const themesEl = document.querySelector(".themes");
const liveQ = document.querySelector(".live-q");
const replyKind = form.elements.rk;
const replyId = form.elements.rid;
const fieldNote = document.querySelector(".field-note");
const errorEl = document.querySelector(".error");
const result = document.querySelector(".result");
const linkOut = document.querySelector(".link-out");
const toast = document.querySelector(".toast");
const shareBtn = document.querySelector(".share-link");

document.querySelector(".support-link").href = WY.SUPPORT_URL;

// Start from the link being edited (coming back from a preview), else defaults.
const state = WY.fromLocation() || WY.defaults();

/* ---------- Build the pickers ---------- */
function pill(label, value, group, extra = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pill";
  b.setAttribute("role", "radio");
  b.dataset.value = value;
  b.innerHTML = extra;
  b.append(label);
  group.appendChild(b);
  return b;
}

for (const [key, o] of Object.entries(WY.OCCASIONS)) {
  pill(`${o.emoji} ${o.label}`, key, occasionsEl);
}
for (const [key, t] of Object.entries(WY.THEMES)) {
  pill(t.label, key, themesEl, `<span class="swatch" style="background:${t.swatch}"></span>`);
}
for (const [key, r] of Object.entries(WY.REPLY)) {
  replyKind.add(new Option(r.label, key));
}

function markChecked(group, value) {
  group.querySelectorAll(".pill").forEach((p) =>
    p.setAttribute("aria-checked", String(p.dataset.value === value))
  );
}

/* ---------- Fill the form from state ---------- */
form.elements.to.value = state.to;
form.elements.from.value = state.from;
form.elements.q.value = state.q;
if (state.r) {
  replyKind.value = state.r.k;
  replyId.value = state.r.id;
}
render();

occasionsEl.addEventListener("click", (e) => {
  const p = e.target.closest(".pill");
  if (!p) return;
  const prevDefault = WY.OCCASIONS[state.o].question;
  state.o = p.dataset.value;
  // Keep a custom question, but swap in the new default if they hadn't changed it.
  const q = form.elements.q.value.trim();
  if (!q || q === prevDefault) form.elements.q.value = WY.OCCASIONS[state.o].question;
  state.th = WY.OCCASIONS[state.o].theme;
  sync();
});

themesEl.addEventListener("click", (e) => {
  const p = e.target.closest(".pill");
  if (!p) return;
  state.th = p.dataset.value;
  sync();
});

form.addEventListener("input", sync);
replyKind.addEventListener("change", () => {
  replyId.value = "";
  sync();
  if (replyKind.value) replyId.focus();
});

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
  markChecked(occasionsEl, state.o);
  markChecked(themesEl, state.th);
  document.body.dataset.theme = state.th;
  liveQ.textContent = WY.questionFor(state);

  const kind = WY.REPLY[replyKind.value];
  replyId.hidden = !kind;
  if (!kind) {
    fieldNote.textContent = "";
    fieldNote.classList.remove("caution");
    return;
  }
  replyId.placeholder = kind.placeholder;
  replyId.inputMode = kind.phone ? "tel" : replyKind.value === "email" ? "email" : "text";
  fieldNote.classList.toggle("caution", !!kind.phone || replyKind.value === "email");
  fieldNote.textContent = kind.phone
    ? "⚠️ Your number will be visible to anyone who has the link. A username (Instagram, Telegram) is more private."
    : replyKind.value === "email"
      ? "⚠️ Your email will be visible to anyone who has the link."
      : `After they say yes, a “Tell ${state.from || "them"} 💌” button opens a chat with you.`;
}

// The config to put in the link; reports a bad contact when `strict`.
function currentConfig(strict = true) {
  const cfg = { ...state, r: null };
  if (replyKind.value) {
    const id = WY.normalizeContact(replyKind.value, replyId.value);
    if (id) cfg.r = { k: replyKind.value, id };
    else if (strict) {
      errorEl.textContent = replyId.value.trim()
        ? `That doesn't look like a valid ${WY.REPLY[replyKind.value].label} contact.`
        : `Add your ${WY.REPLY[replyKind.value].label} contact, or choose “No reply button”.`;
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
