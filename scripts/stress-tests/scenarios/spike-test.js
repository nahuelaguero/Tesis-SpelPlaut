// Spike Test - SPELPLAUT
// Proposito: Simular un pico repentino (ej: torneo deportivo local en Loma Plata)
// VUs: 10 -> 220 (spike) -> 10
// Duracion: ~3.5 minutos

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { BASE_URL, TEST_USER, THRESHOLDS, LOAD_LEVELS } from "../config.js";

// Metricas personalizadas
const errorRate = new Rate("errors");
const canchaListTime = new Trend("cancha_list_duration", true);
const canchaDetailTime = new Trend("cancha_detail_duration", true);
const horariosTime = new Trend("horarios_duration", true);
const totalRequests = new Counter("total_requests");

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Trafico base
    { duration: "15s", target: LOAD_LEVELS.SPIKE }, // Spike a 220!
    { duration: "1m", target: LOAD_LEVELS.SPIKE }, // Sostener spike
    { duration: "15s", target: 10 }, // Caida rapida
    { duration: "1m", target: 10 }, // Recuperacion
    { duration: "15s", target: 0 }, // Cierre
  ],
  thresholds: THRESHOLDS.spike,
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

  // Flujo simplificado para spike (mas lecturas, menos escrituras)

  // 1. Listar canchas
  group("1. Listar canchas", () => {
    const res = http.get(`${BASE_URL}/api/canchas`);
    canchaListTime.add(res.timings.duration);
    totalRequests.add(1);
    check(res, { "canchas OK": (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(0.3 + Math.random() * 0.7);

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

    sleep(0.3 + Math.random() * 0.7);

    // 3. Horarios
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
  }

  sleep(0.2 + Math.random() * 0.5);
}
