// Stress Test - SPELPLAUT
// Proposito: Demostrar escalabilidad con crecimiento 3-5x sobre hora pico estimada
// VUs: 22 -> 66 -> 110 (crecimiento progresivo)
// Duracion: 12 minutos

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { BASE_URL, TEST_USER, THRESHOLDS, LOAD_LEVELS } from "../config.js";

// Metricas personalizadas
const errorRate = new Rate("errors");
const canchaListTime = new Trend("cancha_list_duration", true);
const canchaDetailTime = new Trend("cancha_detail_duration", true);
const horariosTime = new Trend("horarios_duration", true);
const reservaTime = new Trend("reserva_duration", true);
const totalRequests = new Counter("total_requests");

export const options = {
  stages: [
    { duration: "1m", target: LOAD_LEVELS.NORMAL_PEAK }, // Ramp up a 22 (pico normal)
    { duration: "2m", target: LOAD_LEVELS.NORMAL_PEAK }, // Sostener pico normal
    { duration: "1m", target: LOAD_LEVELS.GROWTH_3X }, // Crecer a 66 (3x)
    { duration: "3m", target: LOAD_LEVELS.GROWTH_3X }, // Sostener 3x
    { duration: "1m", target: LOAD_LEVELS.GROWTH_5X }, // Crecer a 110 (5x)
    { duration: "2m", target: LOAD_LEVELS.GROWTH_5X }, // Sostener 5x
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: THRESHOLDS.stress,
};

export function setup() {
  const canchasRes = http.get(`${BASE_URL}/api/canchas`);
  let canchaIds = [];
  try {
    const data = JSON.parse(canchasRes.body);
    if (data.success && data.data && data.data.canchas) {
      canchaIds = data.data.canchas.map((c) => c._id);
    }
  } catch (e) {
    console.error("Error parseando canchas:", e);
  }

  console.log(`Setup: ${canchaIds.length} canchas encontradas`);
  return { canchaIds };
}

export default function (data) {
  const canchaIds = data.canchaIds;

  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  totalRequests.add(1);

  if (loginRes.status !== 200) {
    errorRate.add(true);
    sleep(1);
    return;
  }

  // 1. Listar canchas
  group("1. Listar canchas", () => {
    const res = http.get(`${BASE_URL}/api/canchas`);
    canchaListTime.add(res.timings.duration);
    totalRequests.add(1);
    check(res, { "canchas OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(0.5 + Math.random());

  if (canchaIds.length > 0) {
    // 2. Detalle cancha
    group("2. Ver detalle cancha", () => {
      const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
      const res = http.get(`${BASE_URL}/api/canchas/${id}`);
      canchaDetailTime.add(res.timings.duration);
      totalRequests.add(1);
      check(res, { "detalle OK": (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    });

    sleep(0.5 + Math.random());

    // 3. Horarios disponibles
    group("3. Consultar horarios", () => {
      const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
      const dayOffset = Math.floor(Math.random() * 7) + 1;
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const fecha = date.toISOString().split("T")[0];

      const res = http.get(
        `${BASE_URL}/api/canchas/${id}/horarios-disponibles?fecha=${fecha}`
      );
      horariosTime.add(res.timings.duration);
      totalRequests.add(1);
      check(res, { "horarios OK": (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    });

    sleep(0.5 + Math.random());

    // 4. Reserva (5% de los usuarios bajo estres)
    if (Math.random() < 0.05) {
      group("4. Crear reserva", () => {
        const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
        const dayOffset = Math.floor(Math.random() * 30) + 1;
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const fecha = date.toISOString().split("T")[0];
        const hour = 7 + Math.floor(Math.random() * 14);

        const res = http.post(
          `${BASE_URL}/api/reservas`,
          JSON.stringify({
            cancha_id: id,
            fecha_reserva: fecha,
            hora_inicio: `${hour.toString().padStart(2, "0")}:00`,
            hora_fin: `${(hour + 1).toString().padStart(2, "0")}:00`,
            precio_total: 100000,
            metodo_pago: "efectivo",
          }),
          { headers: { "Content-Type": "application/json" } }
        );
        reservaTime.add(res.timings.duration);
        totalRequests.add(1);
        check(res, {
          "reserva procesada": (r) => r.status === 201 || r.status === 409,
        });
        errorRate.add(res.status >= 500);
      });
    }
  }

  sleep(Math.random());
}
