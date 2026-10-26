// PRUEBA DE VOLUMEN 1 – Pagos: ¿el listado de pagos escala con muchos registros?
// Se ejecuta la MISMA carga dos veces, sobre dos volúmenes de datos distintos,
// y se comparan los tiempos. Si crecen mucho, el listado no escala (falta paginación o índices).
//
// Procedimiento (desde la carpeta backend):
//   1) Volumen BAJO:
//      npm test
//      npx dotenv -e .env.test -v CONTRATOS=50 -v PAGOS=12 -- node tests/performance/datos/preparar-volumen.js
//      k6 run -e VOLUMEN=bajo tests/performance/volumen/volumen-pagos.js
//   2) Volumen ALTO:
//      npm test
//      npx dotenv -e .env.test -v CONTRATOS=500 -v PAGOS=24 -- node tests/performance/datos/preparar-volumen.js
//      k6 run -e VOLUMEN=alto tests/performance/volumen/volumen-pagos.js
//
// Requisito: backend con .env.test y DISABLE_RATE_LIMIT=true

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:3001/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: __ENV.ADMIN_PASS || 'Admin2026' };
const VOLUMEN = __ENV.VOLUMEN || 'sin-etiqueta';

export const options = {
  scenarios: {
    volumen: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'consultarListados',
    },
  },
  thresholds: {
    'http_req_duration{tipo:pagos_pagina}': ['p(95)<500'],
    'http_req_duration{tipo:pagos_100}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { volumen: VOLUMEN },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesión (HTTP ${res.status})`);
  return { token: res.json('data.accessToken') };
}

export function consultarListados(data) {
  const auth = { Authorization: `Bearer ${data.token}` };

  // Listado de pagos con la paginación por defecto
  const p1 = http.get(`${BASE}/payments`, { headers: auth, tags: { tipo: 'pagos_pagina' } });
  check(p1, { 'pagos (página por defecto) 200': (r) => r.status === 200 });

  // Listado de pagos pidiendo 100 registros
  const p2 = http.get(`${BASE}/payments?limit=100`, { headers: auth, tags: { tipo: 'pagos_100' } });
  check(p2, { 'pagos (100 registros) 200': (r) => r.status === 200 });

  sleep(1);
}
