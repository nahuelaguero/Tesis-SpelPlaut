export function safeText(value: unknown, fallback = "No disponible") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function toSafeNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function formatCurrencyPYG(value: unknown) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
  }).format(toSafeNumber(value));
}

export function formatDateSafe(
  value: unknown,
  fallback = "Fecha no disponible",
) {
  if (value == null || value === "") return fallback;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Fecha inválida";

  return date.toLocaleDateString("es-PY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
