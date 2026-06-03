// ============================================================
// api.ts — Conexión al backend FastAPI
//
// Cambia USE_MOCK:
//   true  → usa los datos de mockData.ts (sin backend)
//   false → llama al backend real en localhost:8000
//
// La URL del backend se lee de la variable de entorno
// VITE_API_URL (archivo .env en la raíz del proyecto).
// Si no existe, usa http://localhost:8000 por defecto.
// ============================================================
import axios from "axios";
import {
  usuarios, pacientes, consultas, citas,
  distribucionDiagnosticos, distribucionRiesgo, pacientesPorSector,
} from "../data/mockData";
import type { Patient } from "../data/mockData";

export const USE_MOCK = false; // ← pon true si el backend no está corriendo

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

// Adjunta el JWT a cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("eus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401 → limpiar sesión
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export interface LoginResult {
  token: string;
  rol: string;
  username: string;
  paciente_id: string | null;
  personal_id: string | null;
}

export async function loginApi(username: string, password: string): Promise<LoginResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const user = usuarios.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error("Usuario o contraseña incorrectos");
    return {
      token: "mock-token-" + username,
      rol: user.rol,
      username: user.username,
      paciente_id: user.paciente_id ?? null,
      personal_id: user.personal_id ?? null,
    };
  }
  // Backend real: OAuth2 requiere form-data
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const res = await api.post("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return {
    token: res.data.access_token,
    rol: res.data.rol,
    username: res.data.username,
    paciente_id: res.data.paciente_id ?? null,
    personal_id: res.data.personal_id ?? null,
  };
}

// ── Pacientes ─────────────────────────────────────────────────
export async function getPacientes(q?: string): Promise<Patient[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    if (!q) return pacientes;
    const lq = q.toLowerCase();
    return pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lq) ||
        p.apellido_paterno.toLowerCase().includes(lq) ||
        p.curp.toLowerCase().includes(lq)
    );
  }
  const res = await api.get("/pacientes", { params: { q } });
  return res.data;
}

export async function getPacienteById(id: string): Promise<Patient> {
  if (USE_MOCK) {
    const p = pacientes.find((p) => p.id === id);
    if (!p) throw new Error("Paciente no encontrado");
    return p;
  }
  const res = await api.get(`/pacientes/${id}`);
  return res.data;
}

export async function getCitasByPaciente(pacienteId: string) {
  if (USE_MOCK) {
    return consultas.filter((c) => c.pacienteId === pacienteId);
  }
  const res = await api.get(`/pacientes/${pacienteId}/citas`);
  return res.data;
}

// ── Analítica ─────────────────────────────────────────────────
export async function getAnalitica() {
  if (USE_MOCK) {
    return {
      total_pacientes: pacientes.length,
      distribucion_diagnosticos: distribucionDiagnosticos,
      distribucion_riesgo: distribucionRiesgo,
      pacientes_por_sector: pacientesPorSector,
    };
  }
  const res = await api.get("/analitica/resumen");
  return res.data;
}

export default api;
