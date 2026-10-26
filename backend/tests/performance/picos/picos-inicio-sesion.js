// PRUEBA DE PICOS 2 – Inicio de sesión ("inicio de la jornada")
// Simula que muchos usuarios inician sesión casi al mismo tiempo (por ejemplo, a primera hora),
// y comprueba si el sistema vuelve a la normalidad después del pico.
// Relacionada con INC-01: el login es la operación más costosa (bcrypt).
//
// Requisito: backend con .env.test y DISABLE_RATE_LIMIT=true
// Uso: k6 run tests/performance/picos/picos-inicio-sesion.js
//      k6 run -e PICO=30 tests/performance/picos/picos-inicio-sesion.js   (pico más pequeño)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const PICO = Number(__ENV.PICO) || 50; // usuarios en el pico (el login es costoso: pico moderado)

// Etapas (índice → significado):
//   0: subida a 3 VUs   1: carga normal (ANTES del pico)
//   2: salto brusco a PICO VUs en 5 s   3: pico sostenido
//   4: caída brusca a 3 VUs   5: carga normal (DESPUÉS del pico: ¿se recuperó?)
//   6: bajada a 0
export const options = {
  scenarios: {
    pico_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 3 },
        { duration: '30s', target: 3 },
        { duration: '5s', target: PICO },
        { duration: '30s', target: PICO },
        { duration: '5s', target: 3 },
        { duration: '30s', target: 3 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'iniciarSesion',
    },
  },
  thresholds: {
    'http_req_duration{stage:1}': ['p(95)<500'], // antes del pico
    'http_req_duration{stage:3}': ['p(95)<2000'], // durante el pico se tolera más
    'http_req_duration{stage:5}': ['p(95)<500'], // después: debe volver a la normalidad
    'http_req_failed{stage:1}': ['rate<0.01'],
    'http_req_failed{stage:3}': ['rate<0.05'],
    'http_req_failed{stage:5}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function iniciarSesion() {
  tagWithCurrentStageIndex();
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'login responde 200': (r) => r.status === 200,
    'login devuelve token': (r) => r.status === 200 && !!r.json('data.accessToken'),
  });
  sleep(1);
}
