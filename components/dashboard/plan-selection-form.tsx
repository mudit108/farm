"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { createPlanOrder, verifyPaymentAndClaim } from "@/app/actions/payment";
import { membershipPlans } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

type GridPlot = { plot_number: number; status: "available" | "filled" };

type FlowState =
  | { step: "idle" }
  | { step: "processing" }
  | { step: "success"; plotNumbers: number[] }
  | { step: "error"; message: string };

export function PlanSelectionForm({ grid }: { grid: GridPlot[] }) {
  const [state, setState] = useState<FlowState>({ step: "idle" });
  const [scriptReady, setScriptReady] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [startPlot, setStartPlot] = useState<number | null>(null);

  const plan = membershipPlans.find((p) => p.id === planId) ?? null;
  const statusByPlot = useMemo(() => new Map(grid.map((p) => [p.plot_number, p.status])), [grid]);

  const rangeValid = (start: number, count: number) => {
    if (start < 1 || start + count - 1 > grid.length) return false;
    for (let n = start; n < start + count; n++) {
      if (statusByPlot.get(n) !== "available") return false;
    }
    return true;
  };

  const selectedRange =
    plan && startPlot && rangeValid(startPlot, plan.plots)
      ? Array.from({ length: plan.plots }, (_, i) => startPlot + i)
      : null;

  async function handlePay() {
    if (!plan) return;
    if (mode === "custom" && !selectedRange) {
      setState({ step: "error", message: "Please choose a valid, fully available range first." });
      return;
    }

    setState({ step: "processing" });

    const order = await createPlanOrder(plan.id, mode === "custom" ? startPlot! : undefined);
    if (order.status === "error") {
      setState({ step: "error", message: order.message });
      return;
    }

    if (!scriptReady || typeof window.Razorpay === "undefined") {
      setState({ step: "error", message: "Payment widget is still loading — please try again in a moment." });
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Mera Khet",
      description: `${plan.name} (${plan.label}) — Wheat Season 2026–27`,
      theme: { color: "#3E5A3C" },
      handler: async (response: unknown) => {
        const r = response as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        setState({ step: "processing" });
        const result = await verifyPaymentAndClaim({
          orderId: r.razorpay_order_id,
          paymentId: r.razorpay_payment_id,
          signature: r.razorpay_signature,
        });
        if (result.status === "error") {
          setState({ step: "error", message: result.message });
          return;
        }
        setState({ step: "success", plotNumbers: result.plotNumbers });
      },
      modal: { ondismiss: () => setState({ step: "idle" }) },
    });

    razorpay.on("payment.failed", () => {
      setState({ step: "error", message: "Payment failed. Please try again." });
    });

    razorpay.open();
  }

  if (state.step === "success") {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-green)]/30 bg-[var(--color-green-soft)] p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--color-green-deep)]" />
        <p className="mt-3 font-display text-2xl text-[var(--color-green-deep)]">You&apos;re confirmed!</p>
        <p className="mt-1 text-sm text-[var(--color-green-deep)]">
          You&apos;ve been assigned{" "}
          <span className="font-semibold">
            {state.plotNumbers.length > 1 ? "Plots " : "Plot "}
            {state.plotNumbers.map((n) => `#${n}`).join(", ")}
          </span>
          . A confirmation email is on its way to you.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        {membershipPlans.map((p) => {
          const active = planId === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "flex cursor-pointer flex-col p-5 transition-colors",
                active
                  ? "border-[var(--color-green)] ring-1 ring-[var(--color-green)]"
                  : p.id === "3-plots"
                  ? "border-[var(--color-green)]/40"
                  : ""
              )}
              onClick={() => {
                setPlanId(p.id);
                setStartPlot(null);
                setState({ step: "idle" });
              }}
            >
              <Badge tone={p.id === "3-plots" ? "green" : "brown"}>{p.tagline}</Badge>
              <p className="mt-3 font-display text-2xl">{p.name}</p>
              <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{p.label}</p>

              <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-ink-soft)]">
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" />
                  {p.areaSqFt.toLocaleString()} sq ft ({p.approxAcre})
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" />
                  {p.wheatMinKg}–{p.wheatMaxKg} kg wheat
                </li>
              </ul>

              <p className="mt-4 font-display text-lg">₹{p.priceInr.toLocaleString("en-IN")}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">per season</p>

              <Button
                size="sm"
                variant={active ? "primary" : "outline"}
                className="mt-4 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlanId(p.id);
                  setStartPlot(null);
                  setState({ step: "idle" });
                }}
              >
                {active ? "Selected" : `Select ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      {plan && (
        <Card className="mt-6 p-5">
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            How should your {plan.label.toLowerCase()} be assigned?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "auto"
                  ? "bg-[var(--color-green)] text-white"
                  : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
              )}
            >
              Auto-assign next available
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "custom"
                  ? "bg-[var(--color-green)] text-white"
                  : "bg-[var(--color-ink)]/5 text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10"
              )}
            >
              Choose my own plots
            </button>
          </div>

          {mode === "custom" && (
            <div className="mt-4">
              <p className="mb-3 text-xs text-[var(--color-ink-soft)]">
                Click any available plot to start your block — we&apos;ll
                highlight the {plan.plots > 1 ? `${plan.plots} consecutive plots` : "plot"} that would be
                reserved for you.
              </p>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
                {grid.map((p) => {
                  const inSelection = selectedRange?.includes(p.plot_number);
                  const isStart = startPlot === p.plot_number;
                  return (
                    <button
                      key={p.plot_number}
                      type="button"
                      disabled={p.status === "filled"}
                      onClick={() => setStartPlot(p.plot_number)}
                      title={`Plot #${p.plot_number} — ${p.status}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-md font-mono-data text-[9px] font-semibold transition-colors sm:text-[10px]",
                        inSelection
                          ? "bg-[var(--color-brown)] text-white"
                          : p.status === "filled"
                          ? "cursor-not-allowed bg-[var(--color-ink)]/15 text-[var(--color-ink-soft)]"
                          : "bg-[var(--color-green)] text-white hover:bg-[var(--color-green-deep)]",
                        isStart && !inSelection && "ring-2 ring-[var(--color-live)]"
                      )}
                    >
                      {p.plot_number}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-ink-soft)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-green)]" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-ink)]/15" /> Filled
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brown)]" /> Your selection
                </span>
              </div>
              {startPlot && !selectedRange && (
                <p className="mt-2 text-xs text-[var(--color-live)]">
                  Not enough consecutive available plots starting there — try a different starting plot.
                </p>
              )}
              {selectedRange && (
                <p className="mt-2 text-xs text-[var(--color-green-deep)]">
                  Selected: Plot{selectedRange.length > 1 ? "s" : ""} #{selectedRange[0]}
                  {selectedRange.length > 1 ? `–#${selectedRange[selectedRange.length - 1]}` : ""}
                </p>
              )}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            disabled={state.step === "processing" || (mode === "custom" && !selectedRange)}
            onClick={handlePay}
          >
            {state.step === "processing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              `Pay ₹${plan.priceInr.toLocaleString("en-IN")} & Confirm`
            )}
          </Button>

          {state.step === "error" && (
            <p className="mt-3 text-center text-sm text-[var(--color-live)]">{state.message}</p>
          )}
        </Card>
      )}

      <p className="mt-4 text-center text-xs text-[var(--color-ink-soft)]">
        Secure checkout via Razorpay. Plot numbers are assigned automatically
        the moment payment is confirmed.
      </p>
    </div>
  );
}
