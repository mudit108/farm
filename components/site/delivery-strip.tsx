import Link from "next/link";
import { MapPin } from "lucide-react";
import { DELIVERY_ZONE_NAMES, DELIVERY_FEE_TEXT, DELIVERY_TIMING_TEXT } from "@/lib/delivery-zones";

/**
 * "Delivering this season" strip — shows the live zone list from
 * lib/delivery-zones.ts plus a coming-soon line for other cities.
 */
export function DeliveryStrip({ showDetails = false }: { showDetails?: boolean }) {
  return (
    <div className="delivery-strip" role="note">
      <p className="delivery-strip-k">
        <MapPin size={14} aria-hidden="true" /> Delivering this season
      </p>
      <ul className="delivery-strip-zones">
        {DELIVERY_ZONE_NAMES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <p className="delivery-strip-soon">
        We&apos;re growing — more cities coming soon.{" "}
        <Link href="/auth/signup">Create an account to join the waitlist for your city.</Link>
      </p>
      {showDetails && (
        <p className="delivery-strip-detail">
          {DELIVERY_TIMING_TEXT}. {DELIVERY_FEE_TEXT}.
        </p>
      )}
    </div>
  );
}
