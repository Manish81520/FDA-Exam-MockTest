export const LETTERS = "ABCD";

/** Seconds -> HH:MM:SS */
export function clock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return [h, m, total % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

/** "-0.25" -> "-0.25", "1" -> "+1.00" (display only; the server computes marks). */
export function signed(value: string): string {
  const n = parseFloat(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}`;
}
