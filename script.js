const config = window.ISLAND_BASE_CONFIG;

if (!config) throw new Error("Island Base site configuration could not be loaded.");

const defaultMessage = (service = "") => `Hi, thank you for contacting Island Base Chauffeur Services.
To prepare my personalized quotation, here are my journey details:

Name:
Service required: ${service === "a private ride" ? "" : service}
Date:
Requested pickup time:
Exact pickup location:
Final destination or return location:
One-way or return service:
Expected return-collection time, if applicable:
Additional stops, in the correct order:
Expected waiting time:
Number of passengers:
Luggage details, if applicable:
Flight number, for an airport pickup:
Beach destination and preferred package length, for a beach trip:
Party venue and expected collection time, for party transportation:
Multiple pickup or drop-off locations:
Transportation assistance or special access requirements:

I understand that my booking is confirmed only after all stated confirmation requirements are completed and Island Base issues written confirmation.`;

const whatsappUrl = message =>
  `https://wa.me/${config.phoneInternational}?text=${encodeURIComponent(message)}`;

const announceTrackingHook = (source, service) => {
  const detail = { source, service };
  window.dispatchEvent(new CustomEvent("islandbase:whatsapp-click", { detail }));
  if (typeof window.gtag === "function") window.gtag("event", "whatsapp_click", detail);
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
    stars.textContent = "\u2605".repeat(review.rating);
    stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
    card.querySelector("blockquote").textContent = `\u201c${review.text}\u201d`;
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

nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => closeMenu()));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav?.classList.contains("open")) closeMenu({ returnFocus: true });
});

const dateInput = document.querySelector('input[type="date"]');
if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

const serviceSelect = document.querySelector("#service-select");
const conditionalFields = document.querySelectorAll(".conditional-field");
const beachSelect = document.querySelector("#beach-select");
const beachDuration = document.querySelector("#beach-duration");

const updateConditionalFields = () => {
  const service = serviceSelect?.value || "";
  conditionalFields.forEach(field => {
    const isRelevant = field.dataset.services.split("|").includes(service);
    field.hidden = !isRelevant;
    field.querySelectorAll("input, select, textarea").forEach(control => {
      control.disabled = !isRelevant;
      control.required = isRelevant;
    });
  });
};

serviceSelect?.addEventListener("change", updateConditionalFields);
updateConditionalFields();

const enforceBeachDuration = () => {
  const fullDayOnly = ["Salybia", "Toco"].includes(beachSelect?.value);
  const halfDayOption = beachDuration?.querySelector('option[value^="Half-day"]');
  if (halfDayOption) halfDayOption.disabled = fullDayOnly;
  if (fullDayOnly && beachDuration?.value.startsWith("Half-day")) beachDuration.value = "";
};

beachSelect?.addEventListener("change", enforceBeachDuration);

document.querySelector("#booking-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const optionalLine = (label, value) => value ? `${label}: ${value}` : null;
  const message = [
    "Hi, thank you for contacting Island Base Chauffeur Services.",
    "To prepare my personalized quotation, here are my journey details:",
    "",
    `Name: ${values.name}`,
    `Service required: ${values.service}`,
    `Date: ${values.date}`,
    `Requested pickup time: ${values.time}`,
    `Exact pickup location: ${values.pickup}`,
    `Final destination or return location: ${values.destination}`,
    `One-way or return service: ${values.journey}`,
    optionalLine("Expected return-collection time", values.returnTime),
    `Additional stops, in the correct order: ${values.stops || "None"}`,
    `Expected waiting time: ${values.waiting || "None"}`,
    `Number of passengers: ${values.passengers}`,
    `Luggage details: ${values.luggage || "None"}`,
    optionalLine("Flight number", values.flightNumber),
    optionalLine("Beach destination", values.beach),
    optionalLine("Beach package duration", values.beachDuration),
    optionalLine("Party or event venue", values.partyVenue),
    optionalLine("Party collection time", values.partyCollectionTime),
    `Multiple pickup or drop-off locations: ${values.multipleLocations}`,
    `Transportation assistance or access requirements: ${values.accessRequirements || "None"}`,
    `Parking, entrance or known access requirements: ${values.siteAccess || "None"}`,
    `Other special arrangements: ${values.requests || "None"}`,
    "",
    "I understand that my booking is confirmed only after all stated confirmation requirements are completed and Island Base issues written confirmation."
  ].filter(line => line !== null).join("\n");

  announceTrackingHook("booking_form", values.service);
  window.open(whatsappUrl(message), "_blank", "noopener");
});

document.querySelector("#year").textContent = new Date().getFullYear();
