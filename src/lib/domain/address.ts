import type { Address } from "./contracts";

export function formatAddress(address: Address, locale: string): string {
  const lang = locale === "en" ? "en" : "ar";
  const separator = lang === "en" ? ", " : "، ";
  const parts =
    lang === "en"
      ? [
          address.buildingNo ? `Bldg ${address.buildingNo}` : null,
          address.street.en,
          address.district.en,
          address.city.en,
          address.postalCode,
          address.country.en,
        ]
      : [
          address.district.ar,
          address.street.ar,
          address.buildingNo,
          address.city.ar,
          address.postalCode,
          address.country.ar,
        ];
  return parts.filter(Boolean).join(separator);
}
