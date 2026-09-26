"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBalanceOrder, verifyBalancePayment } from "@/app/actions/payment";
import type { BalanceStage } from "@/lib/demo-data";

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
 * status (due / late / released) is computed by the SERVER component
 * that renders this, not here — calling Date.now() during a client
 * component's render is flagged as an impure render by React's purity
 * rule. The server action applies the same rule again when charging,
 * so the amount shown here and the amount charged always agree.
 */
export function BalancePaymentCard({
  plan,
  status,
  lateFeeInr,
}: {
  plan: InstallmentPlan;
  status: BalanceStage;
  lateFeeInr: number;
}) {
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

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const { stage, daysLeft, releaseDate } = status;
  const fee = stage === "late" ? lateFeeInr : 0;
  const total = plan.balance_due_inr + fee;

  if (stage === "released") {
    return (
      <Card className="border-[var(--color-live)]/40 p-6">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-live)]">Balance not paid</p>
        <p className="mt-2 text-lg font-display">Your plots have been released.</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          The balance of {inr(plan.balance_due_inr)} was due on {fmt(plan.balance_due_date)} and wasn&apos;t paid by{" "}
          {fmt(releaseDate)}. Your deposit is handled under our{" "}
          <a href="/refund-policy" className="underline">
            Refund &amp; Cancellation policy
          </a>
          . Please contact us from Visits &amp; Support if you have any questions.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className={
        stage === "late" ? "border-[var(--color-live)]/40 bg-[var(--color-live)]/5 p-6" : "border-[var(--color-brown)]/30 bg-[var(--color-gold)]/5 p-6"
      }
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />
      <p
        className={`font-mono-data text-xs uppercase tracking-wide ${stage === "late" ? "text-[var(--color-live)]" : "text-[var(--color-brown)]"}`}
      >
        {stage === "late" ? "Balance overdue" : "Balance Due"}
      </p>
      <p className="mt-2 text-2xl font-display">{inr(total)}</p>
      {stage === "late" ? (
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {inr(plan.balance_due_inr)} balance + {inr(fee)} late fee. It was due on {fmt(plan.balance_due_date)}. Please pay by{" "}
          <strong>{fmt(releaseDate)}</strong>, or your plots will be released.
        </p>
      ) : (
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Due {fmt(plan.balance_due_date)} — {daysLeft === 0 ? "today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}. After that a {inr(lateFeeInr)} late fee
          applies, and plots are released if it&apos;s still unpaid 10 days later.
        </p>
      )}

      {message && <p className="mt-3 text-sm text-[var(--color-live)]">{message}</p>}

      <Button onClick={handlePay} disabled={step === "processing"} className="mt-4 w-full">
        {step === "processing" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </span>
        ) : (
          `Pay ${inr(total)} Now`
        )}
      </Button>
    </Card>
  );
}
