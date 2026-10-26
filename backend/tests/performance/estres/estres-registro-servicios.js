// PRUEBA DE ESTRÉS 2 – Registro de servicios (escritura)
// Sube por escalones (10 → 25 → 50 → 75 → 100 usuarios) registrando consumos de servicios,
// para saber a partir de qué carga se degradan las operaciones que ESCRIBEN en la base de datos.
// Complementa a estres-listado-contratos.js, que solo lee.
//
// Requisito: backend con .env.test y DISABLE_RATE_LIMIT=true (base reiniciada con npm test)
// Uso: k6 run tests/performance/estres/estres-registro-servicios.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const TIPOS = ['WATER', 'ELECTRICITY', 'INTERNET'];

// Etapas (índice → significado):
//   0-1: 10 VUs   2-3: 25 VUs   4-5: 50 VUs   6-7: 75 VUs   8-9: 100 VUs   10: bajada a 0
export const options = {
  scenarios: {
    estres_escritura: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '30s', target: 25 },
        { duration: '30s', target: 25 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 75 },
        { duration: '30s', target: 75 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'registrarServicio',
    },
  },
  // En estrés se ESPERA que algún escalón falle: el dato es en cuál ocurre.
  thresholds: {
    'http_req_duration{stage:1}': ['p(95)<500'], // 10 VUs
    'http_req_duration{stage:3}': ['p(95)<500'], // 25 VUs
    'http_req_duration{stage:5}': ['p(95)<500'], // 50 VUs
    'http_req_duration{stage:7}': ['p(95)<500'], // 75 VUs
    'http_req_duration{stage:9}': ['p(95)<500'], // 100 VUs
    'http_req_failed{stage:1}': ['rate<0.01'],
    'http_req_failed{stage:3}': ['rate<0.01'],
    'http_req_failed{stage:5}': ['rate<0.01'],
    'http_req_failed{stage:7}': ['rate<0.01'],
    'http_req_failed{stage:9}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

// Una sola vez: token del arrendador y un arrendatario de prueba
export function setup() {
  const login = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (login.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${login.status})`);
  const token = login.json('data.accessToken');

  const dni = String(Math.floor(10000000 + Math.random() * 89999999));
  const tenantRes = http.post(
    `${BASE}/tenants`,
    JSON.stringify({ fullName: 'Arrendatario K6 Estrés', dni, email: `k6.estres.${Date.now()}@test.com`, phone: '987654321' }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  if (tenantRes.status !== 201) throw new Error(`No se pudo crear el arrendatario (HTTP ${tenantRes.status})`);

  return { token, tenantId: tenantRes.json('data.tenant.id') };
}

export function registrarServicio(data) {
  tagWithCurrentStageIndex();
  const res = http.post(
    `${BASE}/services`,
    JSON.stringify({ tenantId: data.tenantId, type: TIPOS[__ITER % 3], period: '2026-10', consumption: 25, amount: 45.5 }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` } }
  );
  check(res, { 'servicio registrado (201)': (r) => r.status === 201 });
  sleep(1);
}
