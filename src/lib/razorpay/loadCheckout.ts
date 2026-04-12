import type { CircleRazorpayOrderPayload } from "@/lib/circle/types";

/**
 * Merge camelCase and snake_case Razorpay order fields from the API into the shape
 * the checkout helpers expect (`orderId`, `amount` as number, etc.).
 */
export function normalizeRazorpayOrderPayload(
  raw: CircleRazorpayOrderPayload | Record<string, unknown> | null | undefined,
): CircleRazorpayOrderPayload | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const orderIdRaw = r.orderId ?? r.order_id;
  const orderId =
    typeof orderIdRaw === "string" && orderIdRaw.length > 0
      ? orderIdRaw
      : undefined;

  let amount: number | undefined;
  if (typeof r.amount === "number" && Number.isFinite(r.amount)) {
    amount = r.amount;
  } else if (typeof r.amount === "string") {
    const n = Number.parseFloat(r.amount);
    if (Number.isFinite(n)) amount = n;
  }

  const currency =
    typeof r.currency === "string" && r.currency.length > 0
      ? r.currency
      : "INR";
  const key = typeof r.key === "string" ? r.key : undefined;

  let payment: CircleRazorpayOrderPayload["payment"];
  const pm = r.payment;
  if (pm && typeof pm === "object") {
    const id = (pm as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0) payment = { id };
  }

  const out: CircleRazorpayOrderPayload = {
    ...(raw as CircleRazorpayOrderPayload),
    ...(orderId !== undefined ? { orderId } : {}),
    ...(amount !== undefined ? { amount } : {}),
    currency,
    ...(key !== undefined ? { key } : {}),
    ...(payment !== undefined ? { payment } : {}),
  };
  return out;
}

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

function getPublicRazorpayKeyId(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  return raw || undefined;
}

/** Razorpay publishable key from payload or `NEXT_PUBLIC_RAZORPAY_KEY_ID`. */
export function resolveRazorpayKey(
  payload: CircleRazorpayOrderPayload,
): string | undefined {
  const fromPayload = payload.key?.trim();
  return fromPayload || getPublicRazorpayKeyId();
}

function asNormalizedPayload(
  payload: CircleRazorpayOrderPayload | Record<string, unknown> | null | undefined,
): CircleRazorpayOrderPayload | undefined {
  return normalizeRazorpayOrderPayload(payload);
}

/** Payment payload with required Razorpay order fields (key from payload or env). */
export type RazorpayReadyPayload = CircleRazorpayOrderPayload & {
  orderId: string;
  amount: number;
};

export type OpenRazorpayFromPayloadParams = {
  /** Raw order payload from the API (camelCase or snake_case). */
  payload: CircleRazorpayOrderPayload | Record<string, unknown>;
  /** Checkout title (usually merchant / product line). */
  title?: string;
  /** Subtitle shown in Razorpay modal (meet details, amount summary). */
  description?: string;
  /** Prefill payer details when available. */
  prefill?: { name?: string; email?: string; contact?: string };
  onPaid?: (response: RazorpayPaymentResponse) => void;
  onDismiss?: () => void;
};

/** Human-readable summary for the payment modal (keep short for Razorpay UI). */
export function buildMeetPaymentDescription(parts: {
  eventTitle: string;
  startsAtIso: string;
  venue?: string;
  priceLabel: string;
}): string {
  const when = new Date(parts.startsAtIso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const bits = [parts.eventTitle, when, parts.venue, parts.priceLabel].filter(
    Boolean,
  ) as string[];
  const line = bits.join(" · ");
  return line.length > 220 ? `${line.slice(0, 217)}…` : line;
}

export function canOpenRazorpayCheckout(
  payload: CircleRazorpayOrderPayload | Record<string, unknown> | null | undefined,
): payload is RazorpayReadyPayload {
  const n = asNormalizedPayload(payload);
  if (!n) return false;
  const key = resolveRazorpayKey(n);
  return Boolean(
    key &&
      typeof n.orderId === "string" &&
      n.orderId.length > 0 &&
      typeof n.amount === "number",
  );
}

/**
 * Opens Razorpay Checkout using order details returned by the Circle API.
 */
export async function openRazorpayFromPayload({
  payload: rawPayload,
  title = "GrowCircle",
  description,
  prefill,
  onPaid,
  onDismiss,
}: OpenRazorpayFromPayloadParams): Promise<void> {
  const normalized = asNormalizedPayload(rawPayload);
  if (!canOpenRazorpayCheckout(normalized)) {
    throw new Error("Incomplete payment details from server");
  }
  const payload = normalized;
  const key = resolveRazorpayKey(payload);
  const orderId = payload.orderId;
  const amount = payload.amount;
  const currency = payload.currency ?? "INR";
  if (!key || orderId == null || amount == null) {
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
      ...(description ? { description } : {}),
      ...(prefill && Object.keys(prefill).length > 0 ? { prefill } : {}),
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
