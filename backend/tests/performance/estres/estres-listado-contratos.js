// PRUEBA DE ESTRÉS – Listado de contratos
// Sube los usuarios por escalones (20 → 50 → 100 → 150 → 200) para encontrar
// a partir de qué carga se degrada el sistema, y luego baja para ver si se recupera.
//
// Requisitos: backend con .env.test y DISABLE_RATE_LIMIT=true; datos sembrados con preparar-volumen.js
// Uso: k6 run tests/performance/estres/estres-listado-contratos.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };

// Cada escalón dura 30 s de subida + 30 s sostenido, para medir cada nivel con estabilidad.
// Etapas (índice → significado):
//   0-1: 20 VUs (carga normal)   2-3: 50 VUs   4-5: 100 VUs
//   6-7: 150 VUs                 8-9: 200 VUs  10: bajada a 0 (recuperación)
export const options = {
  scenarios: {
    estres: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 150 },
        { duration: '30s', target: 150 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'listarContratos',
    },
  },
  // En estrés se ESPERA que algún umbral falle: el objetivo es saber en qué escalón ocurre.
  // Se evalúa el tramo sostenido de cada escalón (etapas impares).
  thresholds: {
    'http_req_duration{stage:1}': ['p(95)<500'], // 20 VUs
    'http_req_duration{stage:3}': ['p(95)<500'], // 50 VUs
    'http_req_duration{stage:5}': ['p(95)<500'], // 100 VUs
    'http_req_duration{stage:7}': ['p(95)<500'], // 150 VUs
    'http_req_duration{stage:9}': ['p(95)<500'], // 200 VUs
    'http_req_failed{stage:1}': ['rate<0.01'],
    'http_req_failed{stage:3}': ['rate<0.01'],
    'http_req_failed{stage:5}': ['rate<0.01'],
    'http_req_failed{stage:7}': ['rate<0.01'],
    'http_req_failed{stage:9}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

// Una sola vez: token del arrendador (se evita medir bcrypt en esta prueba)
export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${res.status})`);
  return { token: res.json('data.accessToken') };
}

export function listarContratos(data) {
  tagWithCurrentStageIndex(); // etiqueta cada petición con su etapa (stage:0, stage:1, ...)
  const res = http.get(`${BASE}/contracts`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, { 'listado responde 200': (r) => r.status === 200 });
  sleep(1);
}
