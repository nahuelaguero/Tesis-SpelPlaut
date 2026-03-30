import type { Cancha, DiaSemana, PrecioHorario } from "@/types";

export const DAY_NAMES: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function getDayName(date: string): DiaSemana {
  return DAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
}

export function sanitizeInterval(interval?: number): number {
  if (!interval || Number.isNaN(interval)) {
    return 60;
  }

  if (interval < 15 || interval > 180 || interval % 15 !== 0) {
    return 60;
  }

  return interval;
}

export function isTimeAligned(time: string, intervalMinutes: number): boolean {
  return timeToMinutes(time) % sanitizeInterval(intervalMinutes) === 0;
}

export function validatePricingRules(
  rules: PrecioHorario[] = [],
  intervalMinutes?: number
): string | null {
  const normalizedInterval = sanitizeInterval(intervalMinutes);

  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];

    if (!rule.dias_semana?.length) {
      return `La regla ${index + 1} debe incluir al menos un dia.`;
    }

    if (
      !rule.hora_inicio ||
      !rule.hora_fin ||
      timeToMinutes(rule.hora_inicio) >= timeToMinutes(rule.hora_fin)
    ) {
      return `La regla ${index + 1} tiene un rango horario invalido.`;
    }

    if (rule.precio_por_hora <= 0) {
      return `La regla ${index + 1} debe tener un precio mayor a 0.`;
    }

    if (
      !isTimeAligned(rule.hora_inicio, normalizedInterval) ||
      !isTimeAligned(rule.hora_fin, normalizedInterval)
    ) {
      return `La regla ${index + 1} debe respetar intervalos de ${normalizedInterval} minutos.`;
    }
  }

  for (const day of DAY_NAMES) {
    const dailyRules = rules
      .filter((rule) => rule.dias_semana.includes(day))
      .sort(
        (left, right) =>
          timeToMinutes(left.hora_inicio) - timeToMinutes(right.hora_inicio)
      );

    for (let index = 1; index < dailyRules.length; index += 1) {
      const previous = dailyRules[index - 1];
      const current = dailyRules[index];

      if (timeToMinutes(current.hora_inicio) < timeToMinutes(previous.hora_fin)) {
        return `Las reglas de precio se superponen el ${day}.`;
      }
    }
  }

  return null;
}

function getPricePerHourForMinute(
  basePrice: number,
  rules: PrecioHorario[] = [],
  dayName: DiaSemana,
  minute: number
): number {
  const match = rules.find((rule) => {
    if (!rule.dias_semana.includes(dayName)) {
      return false;
    }

    const startsAt = timeToMinutes(rule.hora_inicio);
    const endsAt = timeToMinutes(rule.hora_fin);
    return minute >= startsAt && minute < endsAt;
  });

  return match?.precio_por_hora ?? basePrice;
}

export function calculateReservationPrice(input: {
  cancha:
    | Pick<
        Cancha,
        "precio_por_hora" | "precios_por_horario" | "intervalo_reserva_minutos"
      >
    | null
    | undefined;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}) {
  if (!input.cancha) {
    return {
      total: 0,
      durationMinutes: 0,
      breakdown: [] as Array<{
        hora_inicio: string;
        hora_fin: string;
        precio_por_hora: number;
        subtotal: number;
      }>,
    };
  }

  const start = timeToMinutes(input.horaInicio);
  const end = timeToMinutes(input.horaFin);
  const dayName = getDayName(input.fecha);
  const breakdown: Array<{
    hora_inicio: string;
    hora_fin: string;
    precio_por_hora: number;
    subtotal: number;
  }> = [];

  if (end <= start) {
    return { total: 0, durationMinutes: 0, breakdown };
  }

  let total = 0;
  const chunkMinutes = 15;

  for (let minute = start; minute < end; minute += chunkMinutes) {
    const nextMinute = Math.min(minute + chunkMinutes, end);
    const pricePerHour = getPricePerHourForMinute(
      input.cancha.precio_por_hora,
      input.cancha.precios_por_horario,
      dayName,
      minute
    );
    const subtotal = pricePerHour * ((nextMinute - minute) / 60);

    total += subtotal;

    const previous = breakdown[breakdown.length - 1];
    if (
      previous &&
      previous.precio_por_hora === pricePerHour &&
      previous.hora_fin === minutesToTime(minute)
    ) {
      previous.hora_fin = minutesToTime(nextMinute);
      previous.subtotal = Math.round((previous.subtotal + subtotal) * 100) / 100;
    } else {
      breakdown.push({
        hora_inicio: minutesToTime(minute),
        hora_fin: minutesToTime(nextMinute),
        precio_por_hora: pricePerHour,
        subtotal: Math.round(subtotal * 100) / 100,
      });
    }
  }

  return {
    total: Math.round(total),
    durationMinutes: end - start,
    breakdown,
  };
}

export function getMinimumPrice(
  cancha: Pick<Cancha, "precio_por_hora" | "precios_por_horario">
): number {
  const dynamicPrices =
    cancha.precios_por_horario?.map((rule) => rule.precio_por_hora) ?? [];

  return Math.round(Math.min(cancha.precio_por_hora, ...dynamicPrices));
}
