import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'http://127.0.0.1:3000/api';
const ADMIN = { email: 'admin@arriendofacil.com', password: 'Admin2026' };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    login: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'login',
    },
    listado: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'listarArrendatarios',
    },
  },
  thresholds: {
    'http_req_duration{scenario:login}': ['p(95)<500'],
    'http_req_duration{scenario:listado}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// Se ejecuta una sola vez: obtiene el token del arrendador
export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), { headers: JSON_HEADERS });
  return { token: res.json('data.accessToken') };
}

// Escenario 1: varios usuarios iniciando sesión a la vez
export function login() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify(ADMIN), { headers: JSON_HEADERS });
  check(res, {
    'login responde 200': (r) => r.status === 200,
    'login devuelve token': (r) => !!r.json('data.accessToken'),
  });
  sleep(1);
}

// Escenario 2: listado de arrendatarios con sesión iniciada
export function listarArrendatarios(data) {
  const res = http.get(`${BASE}/tenants`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, { 'listado responde 200': (r) => r.status === 200 });
  sleep(1);
}