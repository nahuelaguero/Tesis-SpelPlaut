// Configuracion compartida para los stress tests de SPELPLAUT
// Loma Plata, Paraguay - Poblacion ~18,000 habitantes

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Credenciales de prueba (creados por seed.ts)
export const TEST_USER = {
  email: "juan.perez@lomaplata.com",
  password: "user123",
};

export const ADMIN_USER = {
  email: "admin@lomaplata.com",
  password: "admin123",
};

// Calculo de carga basado en poblacion de Loma Plata
// Poblacion: 18,000
// Deportivamente activa (20%): 3,600
// Usuarios smartphone con app (40%): 1,440
// Registrados (50%): 720
// Activos diarios - DAU (15%): 108
// Concurrentes en hora pico (20%): 22
export const LOAD_LEVELS = {
  BASELINE: 5, // Smoke test
  NORMAL_PEAK: 22, // Hora pico tipica
  GROWTH_3X: 66, // Crecimiento 3x
  GROWTH_5X: 110, // Crecimiento 5x
  SPIKE: 220, // Evento deportivo (10x)
};

// Thresholds por escenario
export const THRESHOLDS = {
  smoke: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
  load: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.01"],
  },
  stress: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
  },
  spike: {
    http_req_duration: ["p(95)<5000"],
    http_req_failed: ["rate<0.10"],
  },
};
