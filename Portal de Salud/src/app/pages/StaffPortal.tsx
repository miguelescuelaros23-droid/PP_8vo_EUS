import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft, Search, UserPlus, Stethoscope,
  Users, Calendar, Activity, BarChart2, Brain, Zap, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { pacientes as mockPacientes, consultas, citas,
  distribucionDiagnosticos, signosVitalesTendencia, distribucionRiesgo, pacientesPorSector,
} from "../data/mockData";
import { loginApi } from "../services/api";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────
// PANEL ANALÍTICA
// ─────────────────────────────────────────────────────────────
function PanelAnalitica() {
  const rol        = sessionStorage.getItem("eus_rol") ?? "";
  const personalId = sessionStorage.getItem("eus_personal_id") ?? "";
  const esAdmin    = ["administrativo", "admin", "secretaria"].includes(rol);
  const esMedico   = rol === "medico" || rol === "enfermero";

  const [datos, setDatos]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = esAdmin
      ? "/analitica/admin"
      : esMedico && personalId
        ? `/analitica/medico/${personalId}`
        : "/analitica/resumen";

    api.get(url)
      .then(r => setDatos(r.data))
      .catch(() => setDatos(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 p-4">Cargando analítica...</p>;
  if (!datos)  return <p className="text-red-400 p-4">No se pudieron cargar los datos.</p>;

  // ── Vista MÉDICO ──────────────────────────────────────────
  if (esMedico && datos.medico) {
    const d = datos;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <p className="font-semibold text-gray-800">{d.medico.nombre}</p>
            <p className="text-xs text-gray-400">{d.medico.tipo} · {d.medico.sector} ({d.medico.sector_tipo})</p>
          </div>
        </div>

        {/* KPIs propios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Mis consultas",   val: d.resumen.total_consultas,  color: "text-indigo-700" },
            { label: "Mis pacientes",   val: d.resumen.pacientes_unicos, color: "text-blue-700"   },
            { label: "Recetas emitidas",val: d.resumen.total_recetas,    color: "text-green-700"  },
            { label: "Estudios pedidos",val: d.resumen.total_estudios,   color: "text-orange-600" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-4">
                <p className={`text-3xl font-bold ${k.color}`}>{k.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Top diagnósticos */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Mis diagnósticos más frecuentes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.top_diagnosticos} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="diagnostico" type="category" tick={{ fontSize: 9 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="casos" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Consultas por mes */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Mis consultas por mes</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.consultas_por_mes} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="consultas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Especialidades */}
        {d.top_especialidades?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Especialidades que atiendo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {d.top_especialidades.map((e: any) => (
                  <span key={e.especialidad} className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-3 py-1 rounded-full">
                    {e.especialidad} · {e.consultas}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Vista ADMIN ───────────────────────────────────────────
  const d = datos;
  return (
    <div className="space-y-5">
      {/* KPIs generales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Pacientes",  val: d.resumen?.total_pacientes, color: "text-blue-700" },
          { label: "Consultas",  val: d.resumen?.total_consultas, color: "text-indigo-700" },
          { label: "Personal",   val: d.resumen?.total_personal,  color: "text-green-700" },
          { label: "Recetas",    val: d.resumen?.total_recetas,   color: "text-orange-600" },
          { label: "Estudios",   val: d.resumen?.total_estudios,  color: "text-purple-700" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <p className={`text-2xl font-bold ${k.color}`}>{(k.val ?? 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Consultas por sector */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Consultas por sector</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.consultas_por_sector} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="consultas" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top médicos */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 5 médicos por consultas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.top_medicos} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="medico" type="category" tick={{ fontSize: 9 }} width={120} />
                <Tooltip />
                <Bar dataKey="consultas" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personal por tipo */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Personal por tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 pt-1">
              {(d.personal_por_tipo ?? []).map((p: any) => (
                <div key={p.tipo} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-gray-500">{p.tipo}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div className="h-4 rounded-full bg-green-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min((p.cantidad / 40) * 100, 100)}%` }}>
                      <span className="text-white text-xs">{p.cantidad}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución de riesgo */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Riesgo cardiovascular — población</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 pt-1">
              {(d.distribucion_riesgo ?? []).map((r: any) => (
                <div key={r.nivel} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-gray-500">{r.nivel}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div className="h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.min((r.cantidad / 150) * 100, 100)}%`, background: r.color }}>
                      <span className="text-white text-xs">{r.cantidad}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top diagnósticos globales */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top diagnósticos globales</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.top_diagnosticos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="diagnostico" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="casos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL MODELO DE RIESGO
// ─────────────────────────────────────────────────────────────
function PanelModelo() {
  const [listaPacientes, setListaPacientes] = useState<{ id: string; label: string; curp: string }[] | null>(null);
  const [pacienteId, setPacienteId] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/modelo/pacientes")
      .then(r => setListaPacientes(r.data))
      .catch(() => {
        setListaPacientes(mockPacientes.map(p => ({
          id: p.id,
          label: `${p.nombre} ${p.apellido_paterno}`,
          curp: p.curp,
        })));
      });
  }, []);

  // Al cambiar de paciente limpiamos el resultado anterior
  function handleSeleccion(id: string) {
    setPacienteId(id);
    setResultado(null);
  }

  async function calcular() {
    if (!pacienteId) return;
    setLoading(true);
    setResultado(null);   // limpiar antes de la nueva llamada
    try {
      const res = await api.get(`/modelo/predecir/${pacienteId}`);
      setResultado(res.data);
    } catch { toast.error("Error al calcular el modelo"); }
    finally { setLoading(false); }
  }

  const nivelColor = (n: string) =>
    n === "Alto" ? "text-red-600 bg-red-50 border-red-200"
    : n === "Moderado" ? "text-yellow-600 bg-yellow-50 border-yellow-200"
    : "text-green-600 bg-green-50 border-green-200";

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle>Modelo de Riesgo Cardiovascular</CardTitle>
          </div>
          <CardDescription>
            Regresión logística sobre signos vitales reales del paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Seleccionar paciente</Label>
              {/* Renderizamos el Select SOLO cuando la lista ya está lista.
                  Esto evita el error removeChild que ocurre cuando Radix
                  intenta cerrar su portal mientras las opciones cambian. */}
              {listaPacientes === null ? (
                <div className="border rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                  Cargando pacientes...
                </div>
              ) : (
                <Select value={pacienteId} onValueChange={handleSeleccion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listaPacientes.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label} — {p.curp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-end">
              <Button onClick={calcular} disabled={!pacienteId || loading || listaPacientes === null}
                className="bg-purple-600 hover:bg-purple-700">
                {loading ? "Calculando..." : "Calcular"}
              </Button>
            </div>
          </div>

          {resultado && (
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              {/* Info del paciente */}
              <div className="bg-gray-50 border rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold text-gray-700 mb-2">{resultado.paciente.nombre}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="text-gray-400">CURP</span>
                  <span className="font-mono">{resultado.paciente.curp}</span>
                  <span className="text-gray-400">Edad</span>
                  <span>{resultado.paciente.edad} años</span>
                  <span className="text-gray-400">Sistólica</span>
                  <span>{resultado.signos.sistolica} mmHg</span>
                  <span className="text-gray-400">Glucosa</span>
                  <span>{resultado.signos.glucosa} mg/dL</span>
                  <span className="text-gray-400">FC</span>
                  <span>{resultado.signos.fc} bpm</span>
                  <span className="text-gray-400">Fecha signos</span>
                  <span>{resultado.signos.fecha}</span>
                  <span className="text-gray-400">Diabetes</span>
                  <span>{resultado.paciente.diabetes ? "Sí" : "No"}</span>
                  <span className="text-gray-400">Hipertensión</span>
                  <span>{resultado.paciente.hipertension ? "Sí" : "No"}</span>
                </div>
              </div>

              {/* Resultado */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`text-5xl font-bold ${resultado.resultado.nivel_riesgo === "Alto" ? "text-red-600" : resultado.resultado.nivel_riesgo === "Moderado" ? "text-yellow-600" : "text-green-600"}`}>
                  {(resultado.resultado.score * 100).toFixed(1)}%
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${nivelColor(resultado.resultado.nivel_riesgo)}`}>
                  Riesgo {resultado.resultado.nivel_riesgo}
                </span>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${resultado.resultado.nivel_riesgo === "Alto" ? "bg-red-500" : resultado.resultado.nivel_riesgo === "Moderado" ? "bg-yellow-400" : "bg-green-500"}`}
                    style={{ width: `${Math.min(resultado.resultado.score * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400">z = {resultado.resultado.z}</p>

                {/* Desglose */}
                <div className="w-full text-xs space-y-1 mt-1">
                  {Object.entries(resultado.resultado.desglose as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-gray-100 pb-0.5">
                      <span className="text-gray-400 capitalize">{k.replace("_", " ")}</span>
                      <span className={`font-mono ${v > 0 ? "text-red-500" : "text-blue-500"}`}>
                        {v > 0 ? "+" : ""}{v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Percentil poblacional — NumPy */}
                {resultado.poblacion && (
                  <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs">
                    <p className="font-semibold text-purple-700 mb-1">Posición en la población</p>
                    <p className="text-gray-600">
                      Percentil <strong>{resultado.poblacion.percentil}%</strong> —
                      supera en riesgo al {resultado.poblacion.percentil}% de los {resultado.poblacion.n_pacientes} pacientes.
                    </p>
                    <p className="text-gray-400 mt-0.5">
                      Score promedio poblacional: {resultado.poblacion.score_promedio} ·
                      calculado con NumPy en {resultado.poblacion.tiempo_numpy_ms} ms
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL CARGA CONCURRENTE
// ─────────────────────────────────────────────────────────────
function PanelCargaConcurrente() {
  const [nUsuarios, setNUsuarios] = useState(10);
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function simular() {
    setResultado(null);   // limpiar resultado anterior para forzar re-render
    setLoading(true);
    try {
      const res = await api.get(`/modelo/carga-concurrente?n_usuarios=${nUsuarios}`);
      setResultado(res.data);
    } catch { toast.error("Error al ejecutar la simulación"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="border-yellow-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <CardTitle>Simulación de Carga Concurrente</CardTitle>
          </div>
          <CardDescription>
            Cómputo de Alto Rendimiento — demuestra cómo FastAPI maneja múltiples usuarios
            simultáneos usando <strong>asyncio.gather</strong> en lugar de procesar
            uno por uno. Simula N usuarios accediendo al sistema al mismo tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Usuarios simultáneos a simular</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={50} value={nUsuarios}
                  onChange={e => setNUsuarios(Number(e.target.value))}
                  className="flex-1 accent-yellow-500" />
                <span className="font-mono font-bold text-yellow-700 w-8">{nUsuarios}</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={simular} disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Simulando..." : "Ejecutar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 border rounded-lg p-3">
            <div>
              <p className="font-semibold text-gray-600 mb-1">🐢 Secuencial</p>
              <p className="text-xs text-gray-400">Un usuario a la vez — for-loop</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-1">⚡ Concurrente</p>
              <p className="text-xs text-gray-400">Todos a la vez — asyncio.gather</p>
            </div>
          </div>

          {resultado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Secuencial", data: resultado.secuencial, color: "border-gray-200 bg-gray-50", textColor: "text-gray-700" },
                  { label: "Concurrente", data: resultado.concurrente, color: "border-purple-200 bg-purple-50", textColor: "text-purple-700" },
                ].map(({ label, data, color, textColor }) => (
                  <div key={label} className={`border rounded-lg p-4 ${color}`}>
                    <p className={`font-semibold mb-2 ${textColor}`}>{label}</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Tiempo total</span>
                        <span className="font-mono font-bold">{data.tiempo_total_ms} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Req/segundo</span>
                        <span className="font-mono">{data.requests_por_seg.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`border-2 rounded-lg p-4 text-center ${resultado.speedup >= 1 ? "border-green-300 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
                <p className={`text-4xl font-bold ${resultado.speedup >= 1 ? "text-green-700" : "text-blue-700"}`}>
                  {resultado.speedup}×
                </p>
                <p className="text-sm font-medium mt-1">
                  {resultado.speedup >= 1 ? "más rápido con concurrencia" : "speedup (overhead de conexiones)"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {resultado.n_usuarios_simulados} usuarios simultáneos · {resultado.tecnologia}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <strong>asyncio.gather</strong> lanza todas las {resultado.n_usuarios_simulados} corutinas
                simultáneamente. El event loop de FastAPI las intercala sin bloquear el servidor,
                permitiendo atender múltiples usuarios con un solo hilo de ejecución.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAFF PORTAL PRINCIPAL
// ─────────────────────────────────────────────────────────────
export function StaffPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem("isAuthenticatedStaff") === "true"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginApi(username, password);
      if (result.rol === "paciente") { toast.error("Esta sección es solo para personal médico"); return; }
      sessionStorage.setItem("eus_token",       result.token);
      sessionStorage.setItem("eus_rol",         result.rol);
      sessionStorage.setItem("eus_personal_id", result.personal_id ?? "");
      setIsAuthenticated(true);
      sessionStorage.setItem("isAuthenticatedStaff", "true");
      toast.success("Sesión iniciada correctamente");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  function cerrarSesion() {
    sessionStorage.clear();
    setIsAuthenticated(false);
    navigate("/");
  }

  const [searchTerm, setSearchTerm]       = useState("");
  const [showNewConsulta, setShowNewConsulta] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");

  const filteredPacientes = mockPacientes.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.curp.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPacientes = mockPacientes.length;
  const consultasHoy   = consultas.filter(c => c.fecha === "2026-03-25").length;
  const citasProximas  = citas.filter(c => c.estado === "pendiente" || c.estado === "confirmada").length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-green-100">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Stethoscope className="text-green-600 w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-green-900">Portal del Personal</CardTitle>
            <CardDescription>Accede con tu usuario y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input id="username" placeholder="ej. med.carrasco" value={username}
                  onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
        <Link to="/" className="mt-6 flex items-center text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-5">
          <button onClick={cerrarSesion}
            className="flex items-center text-green-200 hover:text-white mb-3 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Cerrar sesión y volver al inicio
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-green-700 p-3 rounded-full">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Portal del Personal Médico</h1>
              <p className="text-green-100 text-sm">Sistema de Gestión EUS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Pacientes", val: totalPacientes, icon: <Users className="h-4 w-4 text-gray-400" />, sub: "En el sistema" },
            { label: "Consultas Hoy",   val: consultasHoy,   icon: <Activity className="h-4 w-4 text-gray-400" />, sub: "25 mar 2026" },
            { label: "Citas Próximas",  val: citasProximas,  icon: <Calendar className="h-4 w-4 text-gray-400" />, sub: "Pendientes/confirmadas" },
          ].map(k => (
            <Card key={k.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-sm text-gray-600">{k.label}</CardTitle>
                {k.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{k.val}</div>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pacientes">
          <TabsList className="mb-4">
            <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
            <TabsTrigger value="analitica">Analítica</TabsTrigger>
            <TabsTrigger value="modelo">Modelo de Riesgo</TabsTrigger>
            <TabsTrigger value="carga">Carga Concurrente</TabsTrigger>
          </TabsList>

          {/* TAB: PACIENTES */}
          <TabsContent value="pacientes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pacientes</CardTitle>
                  <Dialog open={showNewConsulta} onOpenChange={setShowNewConsulta}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700" size="sm">
                        <UserPlus className="w-4 h-4 mr-2" /> Nueva Consulta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Registrar Nueva Consulta</DialogTitle>
                        <DialogDescription>Ingrese los datos de la consulta médica</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={e => { e.preventDefault(); toast.success("Consulta registrada"); setShowNewConsulta(false); }} className="space-y-4">
                        <div>
                          <Label>Paciente</Label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                            <SelectContent>
                              {mockPacientes.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido_paterno} — {p.curp}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div><Label>Especialidad</Label><Input placeholder="Medicina General" /></div>
                          <div><Label>Fecha</Label><Input type="date" defaultValue="2026-06-02" /></div>
                        </div>
                        <div><Label>Motivo</Label><Textarea placeholder="Motivo de consulta" /></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><Label>Presión</Label><Input placeholder="120/80 mmHg" /></div>
                          <div><Label>FC</Label><Input placeholder="72 bpm" /></div>
                          <div><Label>Temperatura</Label><Input placeholder="36.5°C" /></div>
                        </div>
                        <div><Label>Diagnóstico</Label><Textarea placeholder="Diagnóstico médico" /></div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowNewConsulta(false)}>Cancelar</Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">Guardar</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar por nombre o CURP..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPacientes.map(p => {
                    const ultima = consultas.filter(c => c.pacienteId === p.id)
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                    return (
                      <Link key={p.id} to={`/personal/paciente/${p.id}`}>
                        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium">{p.nombre} {p.apellido_paterno} {p.apellido_materno}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${p.nivel_riesgo === "Alto" ? "bg-red-50 text-red-600 border-red-200" : p.nivel_riesgo === "Moderado" ? "bg-yellow-50 text-yellow-600 border-yellow-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                              Riesgo {p.nivel_riesgo}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
                            <span>CURP: <span className="font-mono">{p.curp}</span></span>
                            <span>{p.edad} años · {p.sexo}</span>
                            <span>{p.estado_residencia}</span>
                            {ultima && <span>Última consulta: {ultima.fecha}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: ANALÍTICA */}
          <TabsContent value="analitica">
            <PanelAnalitica />
          </TabsContent>

          {/* TAB: MODELO */}
          <TabsContent value="modelo">
            <PanelModelo />
          </TabsContent>

          {/* TAB: CARGA CONCURRENTE */}
          <TabsContent value="carga">
            <PanelCargaConcurrente />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
