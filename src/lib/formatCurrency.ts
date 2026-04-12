/** Display mock prices as INR (stored as hundredths of a rupee, same as `priceCents` field name). */

export function formatInrFromCents(
  priceCents: number,
  opts?: { decimals?: number },
): string {
  const decimals = opts?.decimals ?? 0;
  const rupees = priceCents / 100;
  if (priceCents === 0) return "Free";
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatInrDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
