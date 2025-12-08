// src/lib/location.ts

export type AppLocation = {
  countryCode: string;
  label: string;
  languageCode?: string;
};

export const SUPPORTED_LOCATIONS: AppLocation[] = [
  { countryCode: "us", label: "United States", languageCode: "en" },
  { countryCode: "gb", label: "United Kingdom", languageCode: "en" },
  { countryCode: "de", label: "Germany", languageCode: "de" },
  { countryCode: "fr", label: "France", languageCode: "fr" },
  { countryCode: "ro", label: "Romania", languageCode: "ro" },
  { countryCode: "es", label: "Spain", languageCode: "es" },
];

export function getDefaultLocationFromNavigator(): AppLocation {
  if (typeof navigator !== "undefined") {
    const locale = navigator.language || (navigator.languages && navigator.languages[0]);
    if (locale) {
      const lower = locale.toLowerCase();
      const match = SUPPORTED_LOCATIONS.find((loc) => {
        const lang = (loc.languageCode || "").toLowerCase();
        const cc = loc.countryCode.toLowerCase();
        return (
          (lang && lower.startsWith(lang)) ||
          lower.endsWith("-" + cc)
        );
      });
      if (match) return match;
    }
  }

  return SUPPORTED_LOCATIONS[0];
}
