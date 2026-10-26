// PRUEBA DE PICOS – "Día de pago"
// Simula un salto repentino de usuarios consultando pagos y contratos
// (como el día 1 del mes, cuando todos revisan lo que deben pagar),
// y comprueba si el sistema vuelve a la normalidad después del pico.
//
// Requisitos: backend con .env.test y DISABLE_RATE_LIMIT=true; datos sembrados con preparar-volumen.js
// Uso: k6 run tests/performance/picos/picos-dia-de-pago.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const PICO = Number(__ENV.PICO) || 150; // usuarios en el pico

// Etapas (índice → significado):
//   0: subida a 10 VUs   1: carga normal (ANTES del pico)
//   2: salto brusco a PICO VUs en 5 s   3: pico sostenido
//   4: caída brusca a 10 VUs   5: carga normal (DESPUÉS del pico: ¿se recuperó?)
//   6: bajada a 0
export const options = {
  scenarios: {
    picos: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '5s', target: PICO },
        { duration: '30s', target: PICO },
        { duration: '5s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'consultarDiaDePago',
    },
  },
  thresholds: {
    'http_req_duration{stage:1}': ['p(95)<500'], // antes del pico
    'http_req_duration{stage:3}': ['p(95)<1000'], // durante el pico se tolera más
    'http_req_duration{stage:5}': ['p(95)<500'], // después: debe volver a la normalidad
    'http_req_failed{stage:1}': ['rate<0.01'],
    'http_req_failed{stage:3}': ['rate<0.05'],
    'http_req_failed{stage:5}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${res.status})`);
  return { token: res.json('data.accessToken') };
}

export function consultarDiaDePago(data) {
  tagWithCurrentStageIndex();
  const h = { headers: { Authorization: `Bearer ${data.token}` } };

  const pagos = http.get(`${BASE}/payments?limit=20`, h);
  check(pagos, { 'listado de pagos 200': (r) => r.status === 200 });

  const contratos = http.get(`${BASE}/contracts`, h);
  check(contratos, { 'listado de contratos 200': (r) => r.status === 200 });

  sleep(1);
}
