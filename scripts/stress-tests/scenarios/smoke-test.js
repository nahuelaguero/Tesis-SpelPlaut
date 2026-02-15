// Smoke Test - SPELPLAUT
// Proposito: Verificar que todos los endpoints funcionan correctamente
// VUs: 1-5, Duracion: 1 minuto

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { BASE_URL, TEST_USER, THRESHOLDS } from "../config.js";
import { login } from "../helpers/auth.js";

const errorRate = new Rate("errors");
const canchaListTime = new Trend("cancha_list_duration", true);
const canchaDetailTime = new Trend("cancha_detail_duration", true);
const horariosTime = new Trend("horarios_duration", true);

export const options = {
  stages: [
    { duration: "15s", target: 3 },
    { duration: "30s", target: 5 },
    { duration: "15s", target: 0 },
  ],
  thresholds: THRESHOLDS.smoke,
};

export function setup() {
  // Login para obtener token y datos de canchas
  const loginRes = login(TEST_USER.email, TEST_USER.password, BASE_URL);

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

  return { canchaIds };
}

export default function (data) {
  const canchaIds = data.canchaIds;

  group("GET /api/canchas - Listar canchas", () => {
    const res = http.get(`${BASE_URL}/api/canchas`);
    canchaListTime.add(res.timings.duration);
    check(res, {
      "canchas status 200": (r) => r.status === 200,
      "canchas tiene datos": (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);

  if (canchaIds.length > 0) {
    group("GET /api/canchas/:id - Detalle cancha", () => {
      const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
      const res = http.get(`${BASE_URL}/api/canchas/${id}`);
      canchaDetailTime.add(res.timings.duration);
      check(res, {
        "detalle status 200": (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });

    sleep(1);

    group("GET /api/canchas/:id/horarios-disponibles", () => {
      const id = canchaIds[Math.floor(Math.random() * canchaIds.length)];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fecha = tomorrow.toISOString().split("T")[0];

      const res = http.get(
        `${BASE_URL}/api/canchas/${id}/horarios-disponibles?fecha=${fecha}`
      );
      horariosTime.add(res.timings.duration);
      check(res, {
        "horarios status 200": (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    });
  }

  sleep(1);
}
