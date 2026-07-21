const defaultTimeZone = "Europe/Amsterdam";
const defaultAutoAwardThreshold = 0.86;
const defaultMissingCatalogThreshold = 0.75;

function cleanString(value, fallback = "") {
  const cleaned = typeof value === "string" ? value.trim() : "";
  return cleaned || fallback;
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

export function buildBugCatalogPrompt(catalog) {
  return catalog.map((entry) => `${entry.id}: ${entry.name}`).join("\n");
}

export function dayKeyInTimeZone(date = new Date(), timeZone = defaultTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function specificMissingSpeciesName(commonName, scientificName) {
  const normalizedCommonName = commonName.toLowerCase();
  return Boolean(scientificName)
    || (commonName.length >= 4
      && !normalizedCommonName.startsWith("onbekend")
      && !["bug", "insect", "spin", "kever", "vlinder", "wesp", "mier"].includes(normalizedCommonName));
}

export function normalizeIdentification(
  raw,
  catalog,
  autoAwardThreshold = defaultAutoAwardThreshold,
  missingCatalogThreshold = defaultMissingCatalogThreshold
) {
  const catalogMap = new Map(catalog.map((entry) => [entry.id, entry]));
  const containsBug = raw?.containsBug === true;
  const imageQuality = raw?.imageQuality === "poor" ? "poor" : "good";
  const catalogStatus = ["matched", "not_in_catalog", "uncertain"].includes(raw?.catalogStatus)
    ? raw.catalogStatus
    : "uncertain";
  const requestedBugId = cleanString(raw?.matchedBugId) || null;
  const matchedEntry = requestedBugId ? catalogMap.get(requestedBugId) : null;
  const confidence = clampConfidence(raw?.confidence);
  const commonName = cleanString(raw?.commonName, containsBug ? "Onbekende bug" : "Geen bug herkend");
  const scientificName = cleanString(raw?.scientificName);
  const reason = cleanString(raw?.reason, "De foto kon niet betrouwbaar worden beoordeeld.");

  let status;
  if (!containsBug) status = "rejected_no_bug";
  else if (imageQuality === "poor") status = "rejected_quality";
  else if (catalogStatus === "matched" && matchedEntry && confidence >= autoAwardThreshold) status = "matched";
  else if (
    catalogStatus === "not_in_catalog"
    && !matchedEntry
    && confidence >= missingCatalogThreshold
    && specificMissingSpeciesName(commonName, scientificName)
  ) status = "not_in_catalog";
  else status = "pending_review";

  return {
    status,
    identification: {
      bugId: matchedEntry?.id ?? null,
      commonName: matchedEntry?.name ?? commonName,
      scientificName,
      confidence,
      reason
    }
  };
}
