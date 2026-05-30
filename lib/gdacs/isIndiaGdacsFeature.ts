import type { Feature } from "geojson";

const INDIA_ISO3 = "IND";

const isIndiaName = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().toLowerCase() === "india";
};

const isIndiaIso3 = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().toUpperCase() === INDIA_ISO3;
};

const isIndiaAffectedCountryEntry = (entry: unknown): boolean => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const record = entry as Record<string, unknown>;

  if (isIndiaIso3(record.iso3)) {
    return true;
  }

  if (isIndiaName(record.countryname)) {
    return true;
  }

  if (isIndiaName(record.country)) {
    return true;
  }

  if (isIndiaName(record.name)) {
    return true;
  }

  return false;
};

const isIndiaAffectedCountries = (affected: unknown): boolean => {
  if (!affected) {
    return false;
  }

  if (Array.isArray(affected)) {
    return affected.some(isIndiaAffectedCountryEntry);
  }

  if (typeof affected === "object") {
    return isIndiaAffectedCountryEntry(affected);
  }

  return false;
};

/**
 * Returns true when GDACS feature properties indicate the event affects India.
 * Property shapes vary across GDACS records; this check is intentionally defensive.
 */
export const isIndiaGdacsFeature = (feature: Feature): boolean => {
  const properties = feature.properties as Record<string, unknown> | null;

  if (!properties) {
    return false;
  }

  if (isIndiaIso3(properties.iso3)) {
    return true;
  }

  if (isIndiaName(properties.country)) {
    return true;
  }

  if (isIndiaName(properties.countryname)) {
    return true;
  }

  if (isIndiaAffectedCountries(properties.affectedcountries)) {
    return true;
  }

  return false;
};
