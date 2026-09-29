"use client";

import { useState } from "react";
import {
  DELIVERY_ZONES,
  DELIVERY_ZONES_SENTENCE,
  OTHER_CITY_VALUE,
  WAITLIST_TEXT,
  zoneForCity,
} from "@/lib/delivery-zones";

/**
 * Delivery city + pincode fields shared by signup and the account page.
 * Emits form fields named `city` and `pincode`. Choosing a city outside
 * the delivery zones is allowed: the account is created and the member
 * joins the waitlist for their city.
 */
export function DeliveryLocationFields({
  initialCity = "",
  initialPincode = "",
  onChange,
  pincodeMaxWidth = false,
}: {
  initialCity?: string;
  initialPincode?: string;
  onChange?: (v: { city: string; pincode: string }) => void;
  pincodeMaxWidth?: boolean;
}) {
  const initialZone = zoneForCity(initialCity);
  const [select, setSelect] = useState<string>(
    initialZone ? initialZone.name : initialCity.trim() ? OTHER_CITY_VALUE : ""
  );
  const [otherCity, setOtherCity] = useState<string>(initialZone ? "" : initialCity);
  const [pincode, setPincode] = useState(initialPincode);

  const isOther = select === OTHER_CITY_VALUE;
  const city = isOther ? otherCity.trim() : select;

  function emit(nextCity: string, nextPincode: string) {
    onChange?.({ city: nextCity, pincode: nextPincode });
  }

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Delivery city</span>
        <select
          required
          className="input"
          value={select}
          onChange={(e) => {
            const v = e.target.value;
            setSelect(v);
            emit(v === OTHER_CITY_VALUE ? otherCity.trim() : v, pincode);
          }}
        >
          <option value="" disabled>
            Select your city
          </option>
          {DELIVERY_ZONES.map((z) => (
            <option key={z.id} value={z.name}>
              {z.name}
            </option>
          ))}
          <option value={OTHER_CITY_VALUE}>Other city (join the waitlist)</option>
        </select>
        <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
          This season we deliver in {DELIVERY_ZONES_SENTENCE}. More cities coming soon.
        </span>
      </label>

      {isOther && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your city</span>
          <input
            required
            type="text"
            placeholder="e.g. Jaipur"
            className="input"
            value={otherCity}
            onChange={(e) => {
              setOtherCity(e.target.value);
              emit(e.target.value.trim(), pincode);
            }}
          />
          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">{WAITLIST_TEXT}</span>
        </label>
      )}

      <input type="hidden" name="city" value={city} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Pincode{" "}
          {isOther || !select ? (
            <span className="text-[var(--color-ink-soft)] font-normal">(optional)</span>
          ) : null}
        </span>
        <input
          name="pincode"
          required={!!select && !isOther}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit pincode"
          className={pincodeMaxWidth ? "input max-w-[10rem]" : "input"}
          value={pincode}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setPincode(v);
            emit(city, v);
          }}
        />
      </label>
    </>
  );
}
