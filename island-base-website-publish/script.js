const config = window.ISLAND_BASE_CONFIG;

if (!config) {
  throw new Error("Island Base site configuration could not be loaded.");
}

const defaultMessage = (service = "a private ride") => `Hello Island Base, I would like to request a quotation.

Service: ${service === "a private ride" ? "" : service}
Date:
Pickup time:
Pickup location:
Destination:
One-way or return:
Passengers:
Luggage:
Additional stops:
Special requests:`;

const whatsappUrl = message =>
  `https://wa.me/${config.phoneInternational}?text=${encodeURIComponent(message)}`;

const announceTrackingHook = (source, service) => {
  const detail = { source, service };
  window.dispatchEvent(new CustomEvent("islandbase:whatsapp-click", { detail }));

  // Google Analytics is not loaded by this site. If it is approved and added
  // later, this hook starts recording WhatsApp clicks automatically.
  if (typeof window.gtag === "function") {
    window.gtag("event", "whatsapp_click", detail);
  }
};

document.querySelectorAll("[data-phone-link]").forEach(link => {
  link.href = `tel:+${config.phoneInternational}`;
  if (link.textContent.trim() !== "Call Now") link.textContent = config.phoneDisplay;
});

document.querySelectorAll("[data-email-link]").forEach(link => {
  link.href = `mailto:${config.email}`;
  link.textContent = config.email;
});

document.querySelectorAll("[data-social]").forEach(link => {
  const url = config.social[link.dataset.social];
  if (!url) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }
  link.hidden = false;
  link.href = url;
});

document.querySelectorAll(".js-whatsapp").forEach(link => {
  const service = link.dataset.service || "a private ride";
  link.href = whatsappUrl(defaultMessage(service));
  link.target = "_blank";
  link.rel = "noopener";
  link.addEventListener("click", () => announceTrackingHook("link", service));
});

const testimonialGrid = document.querySelector("#testimonial-grid");
const reviewTemplate = document.querySelector("#review-card-template");

if (testimonialGrid && reviewTemplate) {
  config.reviews.forEach(review => {
    const card = reviewTemplate.content.cloneNode(true);
    const stars = card.querySelector(".review-stars");
    stars.textContent = "★".repeat(review.rating);
    stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
    card.querySelector("blockquote").textContent = `“${review.text}”`;
    card.querySelector("strong").textContent = review.name;
    card.querySelector("footer span").textContent = review.source;
    testimonialGrid.append(card);
  });
}

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".primary-nav");

const closeMenu = ({ returnFocus = false } = {}) => {
  nav?.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.querySelector(".sr-only")?.replaceChildren("Open menu");
  document.body.classList.remove("menu-open");
  if (returnFocus) menuButton?.focus();
};

menuButton?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.querySelector(".sr-only").textContent = isOpen ? "Close menu" : "Open menu";
  document.body.classList.toggle("menu-open", isOpen);
  if (isOpen) nav.querySelector("a")?.focus();
});

nav?.querySelectorAll("a").forEach(link =>
  link.addEventListener("click", () => closeMenu())
);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav?.classList.contains("open")) {
    closeMenu({ returnFocus: true });
  }
});

const dateInput = document.querySelector('input[type="date"]');
if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

document.querySelector("#booking-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const message = `Hello Island Base, I would like to request a quotation.

Full name: ${values.name}
Service: ${values.service}
Date: ${values.date}
Pickup time: ${values.time}
Pickup location: ${values.pickup}
Destination: ${values.destination}
One-way or return: ${values.journey}
Passengers: ${values.passengers}
Luggage: ${values.luggage || "None specified"}
Additional stops: ${values.stops || "None"}
Waiting requirements: ${values.waiting || "None"}
Special requests: ${values.requests || "None"}`;

  announceTrackingHook("booking_form", values.service);
  window.open(whatsappUrl(message), "_blank", "noopener");
});

document.querySelector("#year").textContent = new Date().getFullYear();
