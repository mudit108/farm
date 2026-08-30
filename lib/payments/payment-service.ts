/**
 * PaymentService — provider-agnostic payment abstraction.
 *
 * Server-side only. Never call a provider SDK or trust a payment status
 * coming from the client — always verify with the provider's signature/
 * webhook server-side before marking a membership active.
 *
 * To go live with Razorpay:
 *   1. `npm install razorpay`
 *   2. Implement RazorpayPaymentProvider below (create order + verify signature)
 *   3. Set PAYMENT_PROVIDER=razorpay and the RAZORPAY_* env vars
 */

export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export interface CreateOrderInput {
  amount: number; // in paise (smallest currency unit)
  currency: "INR";
  membershipId: string;
  customerId: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
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
}

/**
 * Placeholder provider used until real payment credentials are configured.
 * Always returns "not configured" — never fake a successful payment.
 */
class UnconfiguredPaymentProvider implements PaymentProvider {
  name = "unconfigured";

  async createOrder(): Promise<CreateOrderResult> {
    throw new Error(
      "Payment provider is not configured. Set PAYMENT_PROVIDER and the corresponding credentials in your environment."
    );
  }

  async verifyPayment(): Promise<boolean> {
    return false;
  }
}

// --- Razorpay stub (implement when credentials are available) ---------
// class RazorpayPaymentProvider implements PaymentProvider {
//   name = "razorpay";
//   async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
//     // Use the razorpay SDK here with process.env.RAZORPAY_KEY_ID /
//     // process.env.RAZORPAY_KEY_SECRET (server-only).
//   }
//   async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
//     // Verify input.signature using HMAC-SHA256 with the Razorpay key secret.
//   }
// }

function resolveProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER;
  switch (provider) {
    // case "razorpay":
    //   return new RazorpayPaymentProvider();
    default:
      return new UnconfiguredPaymentProvider();
  }
}

export const PaymentService = resolveProvider();
