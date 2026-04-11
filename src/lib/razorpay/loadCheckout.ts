import type { CircleRazorpayOrderPayload } from "@/lib/circle/types";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayConstructorOptions) => {
      open: () => void;
      on: (event: string, fn: (response: RazorpayPaymentResponse) => void) => void;
    };
  }
}

type RazorpayConstructorOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
};

export type RazorpayPaymentResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay runs in the browser only"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
  return loadPromise;
}

export type OpenRazorpayFromPayloadParams = {
  payload: CircleRazorpayOrderPayload;
  title?: string;
  onPaid?: (response: RazorpayPaymentResponse) => void;
  onDismiss?: () => void;
};

/**
 * Opens Razorpay Checkout using order details returned by the Circle API.
 */
export async function openRazorpayFromPayload({
  payload,
  title = "GrowCircle",
  onPaid,
  onDismiss,
}: OpenRazorpayFromPayloadParams): Promise<void> {
  const key = payload.key;
  const orderId = payload.orderId;
  const amount = payload.amount;
  const currency = payload.currency ?? "INR";
  if (!key || !orderId || amount == null) {
    throw new Error("Incomplete payment details from server");
  }
  await loadRazorpayScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay failed to initialize");

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key,
      amount,
      currency,
      order_id: orderId,
      name: title,
      handler: (response) => {
        onPaid?.(response);
        resolve();
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          resolve();
        },
      },
    });
    try {
      rzp.open();
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}
