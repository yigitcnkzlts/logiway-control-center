const KEYS = {
  loads: "logiway-loads",
  offers: "logiway-offers",
  matches: "logiway-matches",
};

function read(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("logiway-marketplace-change", { detail: { key } }));
  return value;
}

export function getLoads(seed = []) {
  const stored = read(KEYS.loads, []);
  return stored.length ? stored : write(KEYS.loads, seed);
}

export function saveLoads(loads) {
  return write(KEYS.loads, loads);
}

export function getOffers(seed = []) {
  const stored = read(KEYS.offers, []);
  return stored.length ? stored : write(KEYS.offers, seed.map(offer => ({ ...offer, status: offer.status || "Bekliyor" })));
}

export function saveOffers(offers) {
  return write(KEYS.offers, offers);
}

export function getMatches() {
  return read(KEYS.matches, []);
}

export function saveMatches(matches) {
  return write(KEYS.matches, matches);
}

export function subscribeMarketplace(callback) {
  const onChange = () => callback();
  window.addEventListener("storage", onChange);
  window.addEventListener("logiway-marketplace-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("logiway-marketplace-change", onChange);
  };
}

function countryFromLocation(value = "") {
  return value.split("·")[0].split(",").at(-1)?.trim() || "";
}

export function matchLoad(load, preferences = {}) {
  const originCountry = load.originCountry || countryFromLocation(load.from);
  const destinationCountry = load.destinationCountry || countryFromLocation(load.to);
  const originMatch = preferences.origin === "Tümü" || preferences.origin === originCountry;
  const destinationMatch = preferences.destination === "Tümü" || preferences.destination === destinationCountry;
  const vehicleMatch = preferences.vehicle === "Tümü" || preferences.vehicle === load.vehicle;
  const score = Math.min(99, 5 + (originMatch ? 42 : 8) + (destinationMatch ? 34 : 6) + (vehicleMatch ? 15 : 3));
  const reasons = [
    originMatch ? "Kalkış konumu uygun" : "Yakın kalkış koridoru",
    destinationMatch ? "Hedef rota uygun" : "Alternatif hedef rota",
    vehicleMatch ? "Araç tipi uygun" : "Araç tipi kontrol edilmeli",
    "Firma doğrulandı",
  ];
  return { score, reasons, originCountry, destinationCountry };
}

export function loadToJob(load, preferences = {}) {
  const result = matchLoad(load, preferences);
  return {
    ...load,
    originCountry: result.originCountry,
    destinationCountry: result.destinationCountry,
    company: load.company || "Kaya Lojistik",
    distance: load.distance || "Rota hesaplanacak",
    match: result.score,
    matchReasons: result.reasons,
  };
}

export function getMarketplaceSnapshot() {
  return { loads: getLoads(), offers: getOffers(), matches: getMatches() };
}
