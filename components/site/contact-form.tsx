"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContactState } from "@/app/actions/contact";

const initialState: ContactState = { status: "idle" };

/** Same server action as before (rate-limited, stored, emails the admin team) — only the styling changed. */
export function ContactForm({ whatsapp }: { whatsapp: string | null }) {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialState);

  if (state.status === "success") {
    return (
      <div className="form-ok" role="status">
        Thanks — we&apos;ve received your message and will get back to you shortly.
      </div>
    );
  }

  return (
    <form action={formAction} className="card cform fade d3">
      <div className="row2">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Phone</label>
          <input id="c-phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" name="message" rows={4} required />
      </div>
      {state.status === "error" && (
        <p className="form-err" role="alert">
          {state.message}
        </p>
      )}
      <div className="cform-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          <span>{isPending ? "Sending…" : "Send message"}</span>
        </button>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <span>WhatsApp us</span>
          </a>
        )}
      </div>
    </form>
  );
}
