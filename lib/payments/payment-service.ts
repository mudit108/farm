import "server-only";
import crypto from "crypto";

/**
 * PaymentService — provider-agnostic payment abstraction.
 *
 * Server-side only. Never call a provider SDK or trust a payment status
 * coming from the client — always verify with the provider's signature/
 * webhook server-side before marking a membership active (see
 * app/actions/payment.ts and app/api/webhooks/razorpay/route.ts).
 */

export interface CreateOrderInput {
  amount: number; // in paise (smallest currency unit)
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  keyId: string; // public key_id — safe to send to the client checkout widget
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentProvider {
  name: string;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

/**
 * Placeholder provider used until real payment credentials are configured.
 * Always returns "not configured" — never fake a successful payment.
 */
class UnconfiguredPaymentProvider implements PaymentProvider {
  name = "unconfigured";

  async createOrder(): Promise<CreateOrderResult> {
    throw new Error(
      "Payment provider is not configured. Set PAYMENT_PROVIDER=razorpay and RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in your environment."
    );
  }

  async verifyPayment(): Promise<boolean> {
    return false;
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}

class RazorpayPaymentProvider implements PaymentProvider {
  name = "razorpay";
  private keyId = process.env.RAZORPAY_KEY_ID!;
  private keySecret = process.env.RAZORPAY_KEY_SECRET!;

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // Lazy import: keeps the Razorpay SDK out of the client bundle and
    // avoids initializing it when running unconfigured.
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });

    const order = await razorpay.orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      provider: this.name,
      keyId: this.keyId,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(input.signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }
}

function resolveProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER;
  switch (provider) {
    case "razorpay":
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn(
          "PAYMENT_PROVIDER=razorpay but RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are missing — falling back to unconfigured."
        );
        return new UnconfiguredPaymentProvider();
      }
      return new RazorpayPaymentProvider();
    default:
      return new UnconfiguredPaymentProvider();
  }
}

export const PaymentService = resolveProvider();
