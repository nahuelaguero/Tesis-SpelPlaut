// Load Test - SPELPLAUT
// Proposito: Simular trafico normal en hora pico de Loma Plata
// VUs: 22 (usuarios concurrentes estimados en hora pico)
// Duracion: 5 minutos (ramp-up 1m, hold 3m, ramp-down 1m)

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { BASE_URL, TEST_USER, THRESHOLDS, LOAD_LEVELS } from "../config.js";
import { login, getAuthCookies } from "../helpers/auth.js";

// Metricas personalizadas
const errorRate = new Rate("errors");
const canchaListTime = new Trend("cancha_list_duration", true);
const canchaDetailTime = new Trend("cancha_detail_duration", true);
const horariosTime = new Trend("horarios_duration", true);
const reservaTime = new Trend("reserva_duration", true);
const totalRequests = new Counter("total_requests");
let authCookieHeader = null;

export const options = {
  stages: [
    { duration: "1m", target: LOAD_LEVELS.NORMAL_PEAK }, // Ramp up a 22 VUs
    { duration: "3m", target: LOAD_LEVELS.NORMAL_PEAK }, // Mantener 22 VUs
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: THRESHOLDS.load,
};

export function setup() {
  // Login para obtener cookies de autenticacion
  login(TEST_USER.email, TEST_USER.password, BASE_URL);

  // Obtener lista de canchas
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

  // Login una sola vez por VU y reusar cookie para todo el escenario.
  if (!authCookieHeader) {
    const loginRes = login(TEST_USER.email, TEST_USER.password, BASE_URL);
    const authCookies = getAuthCookies(loginRes);
    const authToken = authCookies["auth-token"];

    if (!authToken) {
      errorRate.add(true);
      return;
    }

    authCookieHeader = `auth-token=${authToken}`;
  }

  // Flujo tipico de usuario: navegar, ver, consultar, reservar

  // 1. Listar canchas disponibles
  group("1. Listar canchas", () => {
    const res = http.get(`${BASE_URL}/api/canchas`);
    canchaListTime.add(res.timings.duration);
    totalRequests.add(1);
    check(res, {
      "canchas OK": (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1 + Math.random() * 2); // Think time: 1-3 segundos

  // 2. Ver detalle de una cancha
  if (canchaIds.length > 0) {
    group("2. Ver detalle cancha", () => {
      const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
      const res = http.get(`${BASE_URL}/api/canchas/${id}`);
      canchaDetailTime.add(res.timings.duration);
      totalRequests.add(1);
      check(res, {
        "detalle OK": (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });

    sleep(1 + Math.random() * 2);

    // 3. Consultar horarios disponibles
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
      check(res, {
        "horarios OK": (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });

    sleep(1 + Math.random() * 2);

    // 4. Crear reserva (solo 10% de los usuarios)
    if (Math.random() < 0.1) {
      group("4. Crear reserva", () => {
        const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
        const dayOffset = Math.floor(Math.random() * 14) + 1;
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const fecha = date.toISOString().split("T")[0];
        const hour = 7 + Math.floor(Math.random() * 14); // 07:00 a 20:00

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
          {
            headers: {
              "Content-Type": "application/json",
              Cookie: authCookieHeader,
            },
            responseCallback: http.expectedStatuses(201, 409),
          }
        );
        reservaTime.add(res.timings.duration);
        totalRequests.add(1);

        // 201 = creada, 409 = slot ocupado (ambos son respuestas validas)
        check(res, {
          "reserva procesada": (r) => r.status === 201 || r.status === 409,
        });
        errorRate.add(res.status >= 500);
      });
    }
  }

  sleep(Math.random() * 2);
}
