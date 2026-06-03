// ============================================================
// Modelo.tsx — Cómputo Cognitivo + Cómputo de Alto Rendimiento
// ============================================================
import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Brain, Zap, Play, RefreshCw, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend,
} from "recharts";
import api from "../services/api";

// ── Curva sigmoide precalculada ───────────────────────────────
const sigmoidData = Array.from({ length: 61 }, (_, i) => {
  const z = -6 + i * 0.2;
  return { z: parseFloat(z.toFixed(1)), sigma: parseFloat((1 / (1 + Math.exp(-z))).toFixed(4)) };
});

const FORM_INIT = {
  sistolica: 120, glucosa: 100, frecuencia_cardiaca: 75, edad: 40,
  tiene_diabetes: false, tiene_hipertension: false,
};

type BatchResult = {
  nucleos_cpu: number;
  total_pacientes: number;
  chunks: number;
  pacientes_por_chunk: number;
  tiempo_db_ms: number;
  speedup: number;
  tecnologias: string[];
  secuencial: {
    tiempo_ms: number; pacientes_por_seg: number; metodo: string;
    score_promedio: number; distribucion: { Bajo: number; Moderado: number; Alto: number };
  };
  paralelo: {
    tiempo_ms: number; pacientes_por_seg: number; metodo: string;
    score_promedio: number; distribucion: { Bajo: number; Moderado: number; Alto: number };
  };
};

type PrediccionResult = {
  score: number; nivel_riesgo: string; z: number;
  desglose: Record<string, number>;
};

const nivelColor = (n: string) =>
  n === "Alto"     ? "bg-red-100 text-red-700 border-red-200"
  : n === "Moderado" ? "bg-yellow-100 text-yellow-700 border-yellow-200"
  : "bg-green-100 text-green-700 border-green-200";

export function Modelo() {
  const [form, setForm]             = useState(FORM_INIT);
  const [prediccion, setPrediccion] = useState<PrediccionResult | null>(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [batch, setBatch]           = useState<BatchResult | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  async function calcularRiesgo() {
    setLoadingPred(true);
    try {
      const res = await api.post("/modelo/predecir", form);
      setPrediccion(res.data);
    } catch { alert("Error al conectar con el backend (puerto 8000)."); }
    finally { setLoadingPred(false); }
  }

  async function correrBatch() {
    setLoadingBatch(true);
    try {
      const res = await api.get("/modelo/batch");
      setBatch(res.data);
    } catch { alert("Error al conectar con el backend."); }
    finally { setLoadingBatch(false); }
  }

  const tiemposChart = batch ? [
    { metodo: "Secuencial\n(for-loop)", tiempo_ms: batch.secuencial.tiempo_ms, fill: "#94a3b8" },
    { metodo: "Paralelo\n(asyncio+MP)", tiempo_ms: batch.paralelo.tiempo_ms,   fill: "#7c3aed" },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <Link to="/">
            <button className="flex items-center text-purple-200 hover:text-white mb-4 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Modelo de Riesgo Clínico</h1>
              <p className="text-purple-200 text-sm">
                Cómputo Cognitivo (regresión logística) + Cómputo de Alto Rendimiento (asyncio + multiprocessing)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">

        {/* ── COGNITIVO: Explicación ── */}
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-purple-900">Cómputo Cognitivo — Modelo Logístico</CardTitle>
            </div>
            <CardDescription>Predicción de riesgo cardiovascular basada en signos vitales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              El modelo calcula <strong>z</strong>, una combinación lineal ponderada de los signos
              vitales, y aplica la <strong>función sigmoide σ(z)</strong> para convertirlo en una
              probabilidad de riesgo entre 0 y 1.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 font-mono text-xs leading-relaxed">
              <p>z = −6.5 + 0.03·sistólica + 0.015·glucosa + 0.02·FC + 0.04·edad</p>
              <p className="mt-1 pl-4">+ 1.2·diabetes + 1.0·hipertensión</p>
              <p className="mt-2 text-purple-700 font-semibold">
                riesgo = σ(z) = 1 / (1 + e<sup>−z</sup>)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <p className="font-semibold text-green-700">Bajo</p><p className="text-gray-400">riesgo &lt; 0.30</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="font-semibold text-yellow-700">Moderado</p><p className="text-gray-400">0.30 – 0.60</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="font-semibold text-red-700">Alto</p><p className="text-gray-400">riesgo &gt; 0.60</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Curva sigmoide ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Curva Sigmoide σ(z)</CardTitle>
            <CardDescription>Transforma cualquier número real en una probabilidad 0–1</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sigmoidData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="z" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <ReferenceLine y={0.30} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={0.60} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sigma" stroke="#7c3aed" strokeWidth={2} dot={false} name="σ(z)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Calculadora interactiva ── */}
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-600" />
              <CardTitle>Calculadora Interactiva</CardTitle>
            </div>
            <CardDescription>Ingresa signos vitales y calcula el riesgo en tiempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  { key: "sistolica",           label: "Presión sistólica (mmHg)", min: 80,  max: 220 },
                  { key: "glucosa",              label: "Glucosa (mg/dL)",          min: 60,  max: 400 },
                  { key: "frecuencia_cardiaca",  label: "Frecuencia cardiaca (bpm)",min: 40,  max: 150 },
                  { key: "edad",                 label: "Edad (años)",              min: 18,  max: 100 },
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={min} max={max}
                        value={(form as Record<string, number | boolean>)[key] as number}
                        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                        className="flex-1 accent-purple-600"
                      />
                      <span className="text-sm font-mono w-10 text-right text-purple-700">
                        {(form as Record<string, number | boolean>)[key] as number}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 mt-1">
                  {[{ key: "tiene_diabetes", label: "Diabetes" }, { key: "tiene_hipertension", label: "Hipertensión" }].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox"
                        checked={(form as Record<string, boolean | number>)[key] as boolean}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="accent-purple-600 w-4 h-4"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Button onClick={calcularRiesgo} disabled={loadingPred} className="w-full bg-purple-600 hover:bg-purple-700 mt-1">
                  {loadingPred ? "Calculando..." : "Calcular Riesgo"}
                </Button>
              </div>

              <div className="flex flex-col justify-center">
                {prediccion ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-purple-700 mb-1">
                        {(prediccion.score * 100).toFixed(1)}%
                      </div>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${nivelColor(prediccion.nivel_riesgo)}`}>
                        Riesgo {prediccion.nivel_riesgo}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">z = {prediccion.z}</p>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all duration-500 ${prediccion.nivel_riesgo === "Alto" ? "bg-red-500" : prediccion.nivel_riesgo === "Moderado" ? "bg-yellow-400" : "bg-green-500"}`}
                        style={{ width: `${Math.min(prediccion.score * 100, 100)}%` }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Contribución por variable:</p>
                      <div className="space-y-1">
                        {Object.entries(prediccion.desglose).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-gray-500 capitalize">{k.replace("_", " ")}</span>
                            <span className={`font-mono ${v > 0 ? "text-red-600" : "text-blue-600"}`}>
                              {v > 0 ? "+" : ""}{v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    Ajusta los parámetros y presiona<br />"Calcular Riesgo"
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── ALTO RENDIMIENTO: asyncio + multiprocessing ── */}
        <Card className="border-yellow-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <CardTitle>Cómputo de Alto Rendimiento</CardTitle>
            </div>
            <CardDescription>
              Comparación: for-loop secuencial vs asyncio + ProcessPoolExecutor (multiprocessing)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Explicación técnica */}
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🐢</span>
                  <p className="font-semibold text-gray-700">Secuencial (for-loop)</p>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Procesa un paciente a la vez. El CPU tiene un solo núcleo ocupado.
                  Simple pero lento para grandes volúmenes.
                </p>
                <code className="text-xs bg-gray-200 rounded px-1 mt-2 block">for p in pacientes: calcular(p)</code>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚡</span>
                  <p className="font-semibold text-purple-700">Paralelo (asyncio + multiprocessing)</p>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Divide los pacientes en chunks (uno por núcleo CPU).
                  <strong> asyncio.gather</strong> lanza todos los chunks de forma no bloqueante.
                  Cada chunk corre en un <strong>proceso independiente</strong>.
                </p>
                <code className="text-xs bg-purple-100 rounded px-1 mt-2 block">await asyncio.gather(*tareas)</code>
              </div>
            </div>

            <Button onClick={correrBatch} disabled={loadingBatch}
              className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingBatch ? "animate-spin" : ""}`} />
              {loadingBatch ? "Procesando en paralelo..." : "Ejecutar comparación"}
            </Button>

            {batch && (
              <div className="space-y-5">

                {/* Hardware info */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 border rounded-full px-3 py-1">
                    <Cpu className="w-3 h-3 inline mr-1" />{batch.nucleos_cpu} núcleos CPU
                  </span>
                  <span className="bg-gray-100 border rounded-full px-3 py-1">
                    {batch.total_pacientes} pacientes
                  </span>
                  <span className="bg-gray-100 border rounded-full px-3 py-1">
                    {batch.chunks} chunks de ~{batch.pacientes_por_chunk} pacientes
                  </span>
                  <span className="bg-gray-100 border rounded-full px-3 py-1">
                    DB: {batch.tiempo_db_ms} ms
                  </span>
                  {batch.tecnologias.map(t => (
                    <span key={t} className="bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-3 py-1">{t}</span>
                  ))}
                </div>

                {/* Comparación de tiempos */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Tiempo de ejecución (ms) — menor es mejor</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: "Secuencial", ms: batch.secuencial.tiempo_ms, fill: "#94a3b8" },
                        { name: "Paralelo",   ms: batch.paralelo.tiempo_ms,   fill: "#7c3aed" },
                      ]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${v} ms`} />
                        <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
                          {[{ fill: "#94a3b8" }, { fill: "#7c3aed" }].map((entry, i) => (
                            <rect key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Secuencial", data: batch.secuencial, color: "border-gray-300 bg-gray-50" },
                      { label: "Paralelo",   data: batch.paralelo,   color: "border-purple-200 bg-purple-50" },
                    ].map(({ label, data, color }) => (
                      <div key={label} className={`border rounded-lg p-3 ${color}`}>
                        <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
                        <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600">
                          <span>Tiempo:</span>
                          <span className="font-mono font-semibold">{data.tiempo_ms} ms</span>
                          <span>Pac/seg:</span>
                          <span className="font-mono">{data.pacientes_por_seg.toLocaleString()}</span>
                          <span>Score prom:</span>
                          <span className="font-mono">{data.score_promedio}</span>
                        </div>
                      </div>
                    ))}

                    {/* Speedup */}
                    <div className={`border-2 rounded-lg p-3 text-center ${batch.speedup >= 1 ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"}`}>
                      <p className={`text-3xl font-bold ${batch.speedup >= 1 ? "text-green-700" : "text-yellow-700"}`}>
                        {batch.speedup}×
                      </p>
                      <p className="text-xs text-gray-500">
                        {batch.speedup >= 1 ? "más rápido con paralelismo" : "el overhead de crear procesos supera la ganancia (BD pequeña)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nota sobre overhead */}
                {batch.speedup < 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                    <strong>Nota académica:</strong> Con un número pequeño de pacientes, el overhead de
                    crear procesos hijos ({batch.nucleos_cpu} procesos) y serializar los datos (pickle)
                    puede ser mayor que el tiempo de cómputo. El paralelismo es más ventajoso cuando
                    el trabajo por proceso supera los ~50 ms. Con miles de registros adicionales la
                    diferencia sería notable.
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
