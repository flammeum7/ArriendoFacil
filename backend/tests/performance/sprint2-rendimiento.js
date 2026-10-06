import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const BASE = 'http://127.0.0.1:3001/api';
const ADMIN = {
  email: 'admin@arriendofacil.com',
  password: __ENV.ADMIN_PASS || 'Admin2026',
};
const TOTAL_CONTRATOS = 200;

export const options = {
  setupTimeout: '120s',
  scenarios: {
    registro: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: TOTAL_CONTRATOS,
      maxDuration: '60s',
      exec: 'registrarContrato',
    },
    listado: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'listarContratos',
    },
  },
  thresholds: {
    'http_req_duration{scenario:registro}': ['p(95)<800'],
    'http_req_duration{scenario:listado}': ['p(95)<500'],
    'http_req_failed{scenario:registro}': ['rate<0.01'],
    'http_req_failed{scenario:listado}': ['rate<0.01'],
  },
};

function conToken(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

// Se ejecuta una sola vez: inicia sesión y prepara los datos de prueba
export function setup() {
  const login = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (login.status !== 200) {
    throw new Error(`No se pudo iniciar sesión (HTTP ${login.status})`);
  }
  const token = login.json('data.accessToken');

  // Arrendatario de prueba (correo y DNI únicos)
  const dni = String(Math.floor(10000000 + Math.random() * 89999999));
  const tenantRes = http.post(
    `${BASE}/tenants`,
    JSON.stringify({
      fullName: 'Arrendatario K6',
      dni,
      email: `k6.${Date.now()}@test.com`,
      phone: '987654321',
    }),
    conToken(token)
  );
  if (tenantRes.status !== 201) {
    throw new Error(`No se pudo crear el arrendatario (HTTP ${tenantRes.status})`);
  }
  const tenantId = tenantRes.json('data.tenant.id');

  // Una propiedad por contrato (solo se permite 1 contrato vigente por propiedad)
  const propiedades = [];
  for (let i = 0; i < TOTAL_CONTRATOS; i += 20) {
    const lote = [];
    for (let j = i; j < Math.min(i + 20, TOTAL_CONTRATOS); j++) {
      lote.push([
        'POST',
        `${BASE}/properties`,
        JSON.stringify({
          address: `Propiedad K6 ${Date.now()}-${j}`,
          type: 'APARTMENT',
          referenceRent: 1000,
        }),
        conToken(token),
      ]);
    }
    http.batch(lote).forEach((r) => propiedades.push(r.json('data.property.id')));
  }

  return { token, tenantId, propiedades };
}

// Escenario 1: 10 usuarios registrando contratos simultáneamente
export function registrarContrato(data) {
  const idx = exec.scenario.iterationInTest;
  const res = http.post(
    `${BASE}/contracts`,
    JSON.stringify({
      tenantId: data.tenantId,
      propertyId: data.propiedades[idx],
      startDate: '2026-11-01',
      endDate: '2027-10-31',
      rent: 1000,
      deposit: 1000,
      dueDayOffset: 5,
    }),
    conToken(data.token)
  );
  check(res, {
    'contrato creado (201)': (r) => r.status === 201,
  });
  sleep(0.5);
}

// Escenario 2: 20 usuarios consultando el listado de contratos
export function listarContratos(data) {
  const res = http.get(`${BASE}/contracts`, conToken(data.token));
  check(res, { 'listado responde 200': (r) => r.status === 200 });
  sleep(1);
}