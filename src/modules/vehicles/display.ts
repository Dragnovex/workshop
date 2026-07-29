import type { Vehicle } from "@/lib/domain/contracts";

export function getVehicleDisplayName(
  vehicle: Vehicle,
  locale: string,
): string {
  const lang = locale === "en" ? "en" : "ar";
  return `${vehicle.make[lang]} ${vehicle.model[lang]} ${vehicle.year}`;
}
