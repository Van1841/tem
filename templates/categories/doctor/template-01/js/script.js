// Shared engine for every doctor template page.
document.documentElement.classList.add("js");

// Preview-time fallbacks so a raw {{TOKEN}} never shows before a deploy step fills it in.
const LEAD_FALLBACKS = {
  BUSINESS_NAME: "Your Clinic",
  BUSINESS_CATEGORY: "Doctor",
  CURRENT_YEAR: String(new Date().getFullYear()),
};
const TOKEN_RE = /\{\{([A-Z_]+)\}\}/g;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  resolveLeadTokens();
  hideEmptyLeadFields();
  initNav();
  initReveal();
  initFaq();
  initContactForm();
});

function isBlank(value) {
  const v = (value || "").trim().toLowerCase();
  return v === "" || v === "null" || v === "undefined" || v === "nan";
}

function fillTokens(text) {
  return text.replace(TOKEN_RE, (_, key) => LEAD_FALLBACKS[key] ?? "");
}

function resolveLeadTokens() {
  document.title = fillTokens(document.title);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    if (n.nodeValue.includes("{{")) n.nodeValue = fillTokens(n.nodeValue);
  });
  document.querySelectorAll("*").forEach((el) => {
    for (const attr of el.attributes) {
      if (attr.value.includes("{{")) attr.value = fillTokens(attr.value);
    }
  });
}

// Hides elements whose backing lead field was never supplied (e.g. no phone on file).
function hideEmptyLeadFields() {
  document.querySelectorAll("[data-require]").forEach((el) => {
    if (isBlank(el.getAttribute("data-require"))) el.hidden = true;
  });
}

function initNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (!toggle || !links) return;
  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

function initFaq() {
  document.querySelectorAll(".faq-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.nextElementSibling.hidden = open;
    });
  });
}

// No booking backend: the form only acknowledges the request in the page.
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const note = form.querySelector(".form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (note) note.textContent = "Thank you — please call the clinic to confirm your appointment.";
    form.reset();
  });
}

// Lightbox for gallery images.
document.addEventListener("click", (e) => {
  const img = e.target.closest(".gallery-grid img");
  if (!img) return;
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Enlarged photo");
  box.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
  box.addEventListener("click", () => box.remove());
  document.addEventListener("keydown", function esc(ev) {
    if (ev.key === "Escape") { box.remove(); document.removeEventListener("keydown", esc); }
  });
  document.body.appendChild(box);
});
