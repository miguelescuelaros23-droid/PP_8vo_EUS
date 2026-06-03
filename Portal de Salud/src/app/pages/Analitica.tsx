// ============================================================
// Analitica.tsx — Analítica de Datos
// Visualiza distribuciones, tendencias y riesgo cardiovascular
// usando recharts sobre los datos de la BD EUS.
// ============================================================
import { Link } from "react-router";
import { ArrowLeft, BarChart2, TrendingUp, PieChart, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPie, Pie, Cell,
} from "recharts";
import {
  distribucionDiagnosticos,
  signosVitalesTendencia,
  distribucionRiesgo,
  pacientesPorSector,
  pacientes,
} from "../data/mockData";

export function Analitica() {
  const totalPacientes = pacientesPorSector.reduce((s, x) => s + x.pacientes, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <Link to="/">
            <button className="flex items-center text-indigo-200 hover:text-white mb-4 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <BarChart2 className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">Analítica de Datos</h1>
              <p className="text-indigo-200 text-sm">Visualización sobre la base de datos EUS — {totalPacientes} pacientes registrados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Fila 1: Diagnósticos + Riesgo */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Diagnósticos más frecuentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Diagnósticos más frecuentes
              </CardTitle>
              <CardDescription>Distribución de diagnósticos en la BD EUS</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distribucionDiagnosticos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="diagnostico" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="casos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución de riesgo cardiovascular */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="w-5 h-5 text-red-500" />
                Distribución de Riesgo Cardiovascular
              </CardTitle>
              <CardDescription>Clasificación por modelo logístico (Cómputo Cognitivo)</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-8">
              <ResponsiveContainer width="55%" height={220}>
                <RechartsPie>
                  <Pie data={distribucionRiesgo} dataKey="cantidad" nameKey="nivel" cx="50%" cy="50%" outerRadius={90} label={({ nivel, percent }) => `${nivel} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {distribucionRiesgo.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm">
                {distribucionRiesgo.map(r => (
                  <div key={r.nivel} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                    <span>{r.nivel}: <strong>{r.cantidad}</strong></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fila 2: Tendencia signos vitales + Pacientes por sector */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Tendencia de signos vitales — P001 (Carlos) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Tendencia de Signos Vitales
              </CardTitle>
              <CardDescription>Evolución de presión arterial y FC — Carlos Gómez (Oct 25 – Mar 26)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={signosVitalesTendencia} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[60, 160]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="sistolica"  stroke="#ef4444" strokeWidth={2} dot={false} name="Sistólica" />
                  <Line type="monotone" dataKey="diastolica" stroke="#f97316" strokeWidth={2} dot={false} name="Diastólica" />
                  <Line type="monotone" dataKey="fc"         stroke="#3b82f6" strokeWidth={2} dot={false} name="F. Cardiaca" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pacientes por sector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-green-600" />
                Pacientes por Sector
              </CardTitle>
              <CardDescription>Distribución por tipo de institución</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pacientesPorSector} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="pacientes" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabla resumen de pacientes con score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Pacientes — Score de Riesgo</CardTitle>
            <CardDescription>Score calculado con σ(β₀ + β₁·sistólica + β₂·FC + β₃·edad)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Paciente</th>
                    <th className="pb-2 pr-4">CURP</th>
                    <th className="pb-2 pr-4">Edad</th>
                    <th className="pb-2 pr-4">Enf. Crónicas</th>
                    <th className="pb-2">Riesgo CV</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{p.nombre} {p.apellido_paterno}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-500">{p.curp}</td>
                      <td className="py-2 pr-4">{p.edad} años</td>
                      <td className="py-2 pr-4 text-gray-600">{p.enfermedadesCronicas.join(', ') || '—'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.nivel_riesgo === 'Alto' ? 'bg-red-100 text-red-700' : p.nivel_riesgo === 'Moderado' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {p.nivel_riesgo} ({(p.riesgo_cardiovascular * 100).toFixed(0)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
