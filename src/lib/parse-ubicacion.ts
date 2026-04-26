/**
 * Parsea coordenadas GPS de un string de ubicación.
 * Soporta formatos:
 *  - "lat, lng" → "-22.3667, -59.85"
 *  - "lat lng"
 *  - "Lat: -22.3667, Lng: -59.85"
 *  - DMS: 22°21'42.7"S 59°51'39.8"W → convierte a decimal
 *
 * Retorna null si no encuentra coordenadas válidas.
 * Valida rango Paraguay (lat -27.5..-19.5, lng -62.5..-54.0).
 */
export function parseUbicacionACoords(
  ubicacion: string | undefined | null
): { latitude: number; longitude: number } | null {
  if (!ubicacion || typeof ubicacion !== "string") return null;
  const text = ubicacion.trim();
  if (!text) return null;

  // 1) DMS: 22°21'42.7"S 59°51'39.8"W
  const dmsRegex =
    /(\d+)°\s*(\d+)['′]\s*([\d.]+)["″]?\s*([NSns])\s+(\d+)°\s*(\d+)['′]\s*([\d.]+)["″]?\s*([EWew])/;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    const dmsToDec = (d: string, m: string, s: string, hem: string) => {
      const dec = Number(d) + Number(m) / 60 + Number(s) / 3600;
      return /[Ss]/.test(hem) || /[Ww]/.test(hem) ? -dec : dec;
    };
    const lat = dmsToDec(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4]);
    const lng = dmsToDec(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8]);
    if (validParaguay(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 2) Decimal: "lat,lng" o "Lat: x, Lng: y"
  const decimalRegex = /(-?\d{1,2}\.\d+)[\s,]+(-?\d{1,3}\.\d+)/;
  const decMatch = text.match(decimalRegex);
  if (decMatch) {
    const lat = parseFloat(decMatch[1]);
    const lng = parseFloat(decMatch[2]);
    if (validParaguay(lat, lng)) return { latitude: lat, longitude: lng };
  }

  return null;
}

function validParaguay(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -27.5 &&
    lat <= -19.5 &&
    lng >= -62.5 &&
    lng <= -54.0
  );
}
