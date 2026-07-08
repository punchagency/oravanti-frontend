// A curated fallback for environments where `Intl.supportedValuesOf` is not
// available. Covers the common zones; the full runtime list is preferred.
const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Phoenix",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Moscow",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

/** The list of selectable IANA timezones (runtime list when available). */
export function listTimezones(): string[] {
  const supported = (Intl as IntlWithSupportedValues).supportedValuesOf?.(
    "timeZone",
  );
  if (supported && supported.length) {
    return supported.includes("UTC") ? supported : ["UTC", ...supported];
  }
  return FALLBACK_TIMEZONES;
}
