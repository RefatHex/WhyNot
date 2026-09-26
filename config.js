// Shared by the page the crush sees (index.html) and the creator (create.html).
// A personalized page's settings live in the link after "#p=", which browsers
// never send to the server. They are base64-scrambled, not encrypted.
// Attached to window so it's shared even when a bundler (Netlify runs Parcel)
// wraps each script in its own scope.
window.WY = (() => {
  const OCCASIONS = {
    date: {
      label: "First date",
      emoji: "☕",
      question: "Will you go out with me?",
      theme: "pink",
      plan: true,
      doneTitle: "It's a date! 🥰",
      signoff: "Message me soon!",
      yesText: "I said YES! 💖",
    },
    valentine: {
      label: "Valentine",
      emoji: "🌹",
      question: "Will you be my Valentine?",
      theme: "red",
      plan: true,
      doneTitle: "Happy Valentine's! 🌹",
      signoff: "Message me soon!",
      yesText: "I'll be your Valentine! 🌹",
    },
    girlfriend: {
      label: "Be my girlfriend",
      emoji: "💞",
      question: "Will you be my girlfriend?",
      theme: "pink",
      plan: true,
      doneTitle: "It's official! 💞",
      signoff: "Message me soon!",
      yesText: "YES, I'll be your girlfriend! 💞",
    },
    boyfriend: {
      label: "Be my boyfriend",
      emoji: "💙",
      question: "Will you be my boyfriend?",
      theme: "night",
      plan: true,
      doneTitle: "It's official! 💙",
      signoff: "Message me soon!",
      yesText: "YES, I'll be your boyfriend! 💙",
    },
    prom: {
      label: "Prom",
      emoji: "💃",
      question: "Will you go to prom with me?",
      theme: "purple",
      plan: false,
      doneTitle: "See you at prom! 💃🕺",
      doneText: "Get ready to dance the night away ✨",
      signoff: "Can't wait!",
      yesText: "YES, I'll go to prom with you! 💃",
    },
    proposal: {
      label: "Proposal",
      emoji: "💍",
      question: "Will you marry me?",
      theme: "gold",
      plan: false,
      doneTitle: "We're getting married!! 💍",
      doneText: "Forever starts now ✨",
      signoff: "I love you ❤️",
      yesText: "YES! A thousand times yes! 💍",
    },
    bridesmaid: {
      label: "Bridesmaid",
      emoji: "💐",
      question: "Will you be my bridesmaid?",
      theme: "purple",
      plan: false,
      doneTitle: "Bridesmaid squad! 💐",
      doneText: "I couldn't do this without you 👰",
      signoff: "Love you bestie!",
      yesText: "YES, I'll be your bridesmaid! 💐",
    },
  };

  const THEMES = {
    pink: { label: "Pink", swatch: "#e94d58" },
    red: { label: "Rose red", swatch: "#d62839" },
    purple: { label: "Lavender", swatch: "#8e44ad" },
    gold: { label: "Gold", swatch: "#a8741a" },
    night: { label: "Night", swatch: "#1f1b33" },
  };

  const REPLY = {
    whatsapp: {
      label: "WhatsApp",
      placeholder: "Number with country code, e.g. 8801712345678",
      phone: true,
      pattern: /^\+?\d{7,15}$/,
      link: (id, text) => ({ href: `https://wa.me/${id.replace("+", "")}?text=${encodeURIComponent(text)}`, prefilled: true }),
    },
    instagram: {
      label: "Instagram",
      placeholder: "Your Instagram username",
      pattern: /^[A-Za-z0-9._]{1,30}$/,
      link: (id) => ({ href: `https://ig.me/m/${id}`, prefilled: false }),
    },
    telegram: {
      label: "Telegram",
      placeholder: "Your Telegram username",
      pattern: /^[A-Za-z0-9_]{5,32}$/,
      link: (id) => ({ href: `https://t.me/${id}`, prefilled: false }),
    },
    messenger: {
      label: "Messenger",
      placeholder: "Your Facebook username",
      pattern: /^[A-Za-z0-9.]{3,50}$/,
      link: (id) => ({ href: `https://m.me/${id}`, prefilled: false }),
    },
    sms: {
      label: "Text message",
      placeholder: "Phone number with country code",
      phone: true,
      pattern: /^\+?\d{7,15}$/,
      link: (id, text) => ({ href: `sms:${id}?&body=${encodeURIComponent(text)}`, prefilled: true }),
    },
    email: {
      label: "Email",
      placeholder: "you@example.com",
      pattern: /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,
      link: (id, text) => ({
        href: `mailto:${id}?subject=${encodeURIComponent("My answer 💌")}&body=${encodeURIComponent(text)}`,
        prefilled: true,
      }),
    },
  };

  const LIMITS = { name: 40, question: 100 };

  function clean(s, max) {
    return typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
  }

  function normalizeContact(kind, value) {
    const r = REPLY[kind];
    if (!r || typeof value !== "string") return "";
    let v = value.trim();
    v = r.phone ? v.replace(/[\s().-]/g, "") : v.replace(/^@/, "");
    return r.pattern.test(v) ? v : "";
  }

  // Turns untrusted input into a safe config, or null if it isn't one.
  function sanitize(raw) {
    if (!raw || typeof raw !== "object" || raw.v !== 1) return null;
    const o = Object.hasOwn(OCCASIONS, raw.o) ? raw.o : "date";
    const cfg = {
      o,
      to: clean(raw.t, LIMITS.name),
      from: clean(raw.f, LIMITS.name),
      q: clean(raw.q, LIMITS.question) || OCCASIONS[o].question,
      th: Object.hasOwn(THEMES, raw.th) ? raw.th : OCCASIONS[o].theme,
      r: null,
    };
    if (raw.r && Object.hasOwn(REPLY, raw.r.k)) {
      const id = normalizeContact(raw.r.k, raw.r.id);
      if (id) cfg.r = { k: raw.r.k, id };
    }
    return cfg;
  }

  function defaults() {
    return sanitize({ v: 1 });
  }

  // Compact form: leave out anything that matches the occasion's defaults.
  function toPayload(cfg) {
    const occ = OCCASIONS[cfg.o];
    const p = { v: 1 };
    if (cfg.o !== "date") p.o = cfg.o;
    if (cfg.to) p.t = cfg.to;
    if (cfg.from) p.f = cfg.from;
    if (cfg.q && cfg.q !== occ.question) p.q = cfg.q;
    if (cfg.th !== occ.theme) p.th = cfg.th;
    if (cfg.r) p.r = cfg.r;
    return p;
  }

  function encode(cfg) {
    const bytes = new TextEncoder().encode(JSON.stringify(toPayload(cfg)));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(str) {
    try {
      const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      return null;
    }
  }

  // The personalized config for this page, or null for the plain demo page.
  function fromLocation(loc = location) {
    const m = loc.hash.match(/^#p=([A-Za-z0-9_-]+)$/);
    if (m) return decode(m[1]);
    // Older links: ?to=Name&from=Name
    const params = new URLSearchParams(loc.search);
    if (params.has("to") || params.has("from")) {
      return sanitize({ v: 1, t: params.get("to"), f: params.get("from") });
    }
    return null;
  }

  // "Will you go out with me?" + "Alex" -> "Alex, will you go out with me?"
  function questionFor(cfg) {
    if (!cfg.to) return cfg.q;
    const q = /^[A-Z][a-z]/.test(cfg.q) ? cfg.q[0].toLowerCase() + cfg.q.slice(1) : cfg.q;
    return `${cfg.to}, ${q}`;
  }

  function replyLink(r, text) {
    return REPLY[r.k].link(r.id, text);
  }

  return {
    OCCASIONS, THEMES, REPLY, LIMITS,
    sanitize, defaults, encode, decode, fromLocation, questionFor, normalizeContact, replyLink,
    PREVIEW_KEY: "wy-preview",
    SUPPORT_URL: "https://link.payoneer.com/Token?t=7D37FE968561407DB7E757D3F3F899ED&src=mobile",
  };
})();
