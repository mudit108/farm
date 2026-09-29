// Single source of truth for where Mera Khet delivers this season, what
// delivery costs and when it starts. Every page, form and server action
// reads from here — to open a new city next season, add it to DELIVERY_ZONES.

export type DeliveryZone = {
  id: string;
  name: string;
  /** Other spellings people type (matched case-insensitively). */
  aliases: string[];
  /** Pincode prefixes that belong to this zone. */
  pincodePrefixes: string[];
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "mumbai", name: "Mumbai", aliases: ["bombay", "mumbai suburban", "greater mumbai"], pincodePrefixes: ["4000", "4001"] },
  { id: "thane", name: "Thane", aliases: ["thane west", "thane east"], pincodePrefixes: ["4006"] },
  { id: "navi-mumbai", name: "Navi Mumbai", aliases: ["navimumbai", "navi-mumbai", "new bombay", "vashi", "kharghar", "panvel", "nerul", "airoli"], pincodePrefixes: ["4007", "4102"] },
  { id: "pune", name: "Pune", aliases: ["poona", "pimpri", "pimpri-chinchwad", "pimpri chinchwad", "pcmc"], pincodePrefixes: ["411"] },
  { id: "bengaluru", name: "Bengaluru", aliases: ["bangalore", "bengaluru urban", "banglore", "blr"], pincodePrefixes: ["560"] },
];

/** Value used in the city dropdown for anyone outside the delivery zones. */
export const OTHER_CITY_VALUE = "__other__";

export const DELIVERY_ZONE_NAMES = DELIVERY_ZONES.map((z) => z.name);
/** "Mumbai, Thane, Navi Mumbai, Pune and Bengaluru" */
export const DELIVERY_ZONES_SENTENCE = DELIVERY_ZONE_NAMES.length > 1
  ? `${DELIVERY_ZONE_NAMES.slice(0, -1).join(", ")} and ${DELIVERY_ZONE_NAMES[DELIVERY_ZONE_NAMES.length - 1]}`
  : DELIVERY_ZONE_NAMES.join("");
/** "Mumbai · Thane · Navi Mumbai · Pune · Bengaluru" */
export const DELIVERY_ZONES_DOTS = DELIVERY_ZONE_NAMES.join(" · ");

/** Delivery charge per bag, in rupees, by bag size in kg. 15 kg bags ship free. */
export const DELIVERY_FEE_PER_BAG_INR: Record<number, number> = { 15: 0, 30: 150, 50: 250 };
export const DELIVERY_BAG_SIZES_KG = [15, 30, 50] as const;

/** Delivery starts this many days after harvest (time to finish harvest, mill and pack). */
export const DELIVERY_STARTS_AFTER_HARVEST_DAYS = 14;

/** Reusable copy so wording stays identical everywhere. */
export const DELIVERY_FEE_TEXT = "15 kg bags are delivered free; 30 kg bags cost ₹150 and 50 kg bags ₹250 per bag";
export const DELIVERY_TIMING_TEXT = "Deliveries begin 2 weeks after harvest, once harvesting, milling and packing are complete";
export const DELIVERY_SCOPE_TEXT = `This season we deliver in ${DELIVERY_ZONES_SENTENCE}. More cities are coming soon.`;
export const WAITLIST_TEXT =
  "We're not delivering to your city this season, but you can create an account and join the waitlist — we'll tell you as soon as we open in your city.";

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** The delivery zone for a typed/selected city, or null if outside the zones. */
export function zoneForCity(city: string | null | undefined): DeliveryZone | null {
  const c = norm(city);
  if (!c) return null;
  return (
    DELIVERY_ZONES.find((z) => norm(z.name) === c || z.aliases.some((a) => norm(a) === c)) ?? null
  );
}

export function isDeliverableCity(city: string | null | undefined): boolean {
  return zoneForCity(city) !== null;
}

/** true/false if the pincode agrees with the zone; null when there's nothing to check. */
export function pincodeMatchesZone(zone: DeliveryZone, pincode: string | null | undefined): boolean | null {
  const p = (pincode ?? "").trim();
  if (!/^\d{6}$/.test(p)) return null;
  return zone.pincodePrefixes.some((prefix) => p.startsWith(prefix));
}

export type CityValidation = { ok: true; zone: DeliveryZone | null } | { ok: false; message: string };

/**
 * Shared server/client check for a member's delivery city + pincode.
 * Outside the zones is allowed (waitlist) — zone is null then. Inside a
 * zone, a pincode is required and must belong to it.
 */
export function validateDeliveryLocation(city: string, pincode: string): CityValidation {
  const zone = zoneForCity(city);
  if (!zone) return { ok: true, zone: null };
  if (!/^\d{6}$/.test(pincode.trim())) {
    return { ok: false, message: `Please enter your 6-digit pincode so we can confirm delivery in ${zone.name}.` };
  }
  if (pincodeMatchesZone(zone, pincode) === false) {
    return {
      ok: false,
      message: `That pincode doesn't look like it's in ${zone.name}. Please check it, or WhatsApp us if you think this is a mistake.`,
    };
  }
  return { ok: true, zone };
}
