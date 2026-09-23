"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBalanceOrder, verifyBalancePayment } from "@/app/actions/payment";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

type InstallmentPlan = {
  id: string;
  plan_id: string;
  balance_due_inr: number;
  balance_due_date: string;
};

type Step = "idle" | "processing" | "paid" | "error";

/**
 * Shown on My Farm only when the member has an unpaid 50-50 balance
 * (getMyInstallmentPlan returns null otherwise, and the page doesn't
 * render this at all). Same Razorpay checkout pattern as the main
 * plan-selection-form.tsx — order, then client-side handler verifies
 * and marks the balance settled.
 *
 * daysLeft is computed by the SERVER component that renders this, not
 * here — calling Date.now() during a client component's render is
 * flagged as an impure render by React's purity rule (same issue
 * already hit once before on the admin income page).
 */
export function BalancePaymentCard({ plan, daysLeft }: { plan: InstallmentPlan; daysLeft: number }) {
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  if (step === "paid") {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-[var(--color-green-deep)]">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Balance paid — you&apos;re fully settled.</p>
        </div>
      </Card>
    );
  }

  const dueDate = new Date(plan.balance_due_date);

  async function handlePay() {
    setStep("processing");
    setMessage("");

    const order = await createBalanceOrder(plan.id);
    if (order.status === "error") {
      setStep("error");
      setMessage(order.message);
      return;
    }

    if (!scriptReady || typeof window.Razorpay === "undefined") {
      setStep("error");
      setMessage("Payment widget is still loading — please try again in a moment.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Mera Khet",
      description: "Remaining balance",
      theme: { color: "#24402C" },
      handler: async (response: unknown) => {
        const r = response as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        setStep("processing");
        const result = await verifyBalancePayment({
          orderId: r.razorpay_order_id,
          paymentId: r.razorpay_payment_id,
          signature: r.razorpay_signature,
        });
        if (result.status === "error") {
          setStep("error");
          setMessage(result.message);
          return;
        }
        setStep("paid");
      },
      modal: { ondismiss: () => setStep("idle") },
    });

    razorpay.on("payment.failed", () => {
      setStep("error");
      setMessage("Payment failed. Please try again.");
    });

    razorpay.open();
  }

  return (
    <Card className="border-[var(--color-brown)]/30 bg-[var(--color-gold)]/5 p-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-brown)]">
        Balance Due
      </p>
      <p className="mt-2 text-2xl font-display">₹{plan.balance_due_inr.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Due {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        {daysLeft >= 0 ? ` — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : " — overdue"}
      </p>

      {message && <p className="mt-3 text-sm text-[var(--color-live)]">{message}</p>}

      <Button onClick={handlePay} disabled={step === "processing"} className="mt-4 w-full">
        {step === "processing" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </span>
        ) : (
          `Pay ₹${plan.balance_due_inr.toLocaleString("en-IN")} Now`
        )}
      </Button>
    </Card>
  );
}
