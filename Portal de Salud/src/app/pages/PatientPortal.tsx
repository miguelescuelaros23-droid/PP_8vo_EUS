import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Home, 
  FileText, 
  Pill, 
  Calendar, 
  TestTube, 
  User,
  ArrowLeft,
  Activity,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { pacientes, consultas, recetas, estudios, citas } from "../data/mockData";

/**
 * La BD guarda alergias/enfermedades como string ("Penicilina, Ibuprofeno")
 * pero el mockData las tiene como string[].
 * Esta función normaliza ambos casos a string para mostrar en pantalla.
 */
function toStr(val: string | string[] | undefined | null): string {
  if (!val) return "Ninguna";
  if (Array.isArray(val)) return val.length === 0 ? "Ninguna" : val.join(", ");
  return val === "Ninguna" || val.trim() === "" ? "Ninguna" : val;
}

function hasItems(val: string | string[] | undefined | null): boolean {
  if (!val) return false;
  if (Array.isArray(val)) return val.length > 0;
  return val.trim() !== "" && val.trim().toLowerCase() !== "ninguna";
}
import type { Patient } from "../data/mockData";
import { loginApi, getPacienteById } from "../services/api";
import api from "../services/api";

export function PatientPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticatedPatient') === 'true';
  });
  const [pacienteActual, setPacienteActual] = useState<any | null>(() => {
    const id = sessionStorage.getItem('pacienteId');
    return pacientes.find(p => p.id === id) ?? null;
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Datos clínicos reales del backend
  const [misConsultasReal, setMisConsultasReal] = useState<any[]>([]);
  const [misCitasReal,     setMisCitasReal]     = useState<any[]>([]);
  const [misRecetasReal,   setMisRecetasReal]   = useState<any[]>([]);
  const [misEstudiosReal,  setMisEstudiosReal]  = useState<any[]>([]);
  const [loadingClinicos,  setLoadingClinicos]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginApi(username, password);
      if (result.rol !== "paciente") {
        toast.error("Esta sección es solo para pacientes");
        return;
      }
      // Guardar token para peticiones posteriores
      sessionStorage.setItem("eus_token", result.token);
      sessionStorage.setItem("eus_rol", result.rol);
      // Cargar perfil del paciente
      const pid = result.paciente_id;
      if (!pid) { toast.error("No se encontró el paciente"); return; }

      const pac = await getPacienteById(pid).catch(() => null);
      if (!pac) { toast.error("Error al cargar el expediente"); return; }

      setPacienteActual(pac);
      setIsAuthenticated(true);
      sessionStorage.setItem("isAuthenticatedPatient", "true");
      sessionStorage.setItem("pacienteId", pid);

      // Cargar datos clínicos en paralelo
      setLoadingClinicos(true);
      try {
        const [consultas, citas, recetas, estudios] = await Promise.all([
          api.get(`/pacientes/${pid}/consultas`).then(r => r.data).catch(() => []),
          api.get(`/pacientes/${pid}/citas`).then(r => r.data).catch(() => []),
          api.get(`/pacientes/${pid}/recetas`).then(r => r.data).catch(() => []),
          api.get(`/pacientes/${pid}/estudios`).then(r => r.data).catch(() => []),
        ]);
        setMisConsultasReal(consultas);
        setMisCitasReal(citas);
        setMisRecetasReal(recetas);
        setMisEstudiosReal(estudios);
      } finally {
        setLoadingClinicos(false);
      }

      toast.success(`Bienvenido/a, ${(pac as any).nombre}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  const navigate = useNavigate();

  function cerrarSesion() {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setPacienteActual(null);
    navigate("/");
  }

  // Mientras el paciente no haya cargado mostramos un indicador
  // Esto previene el error removeChild al intentar renderizar
  // propiedades de un objeto null/undefined
  if (isAuthenticated && !pacienteActual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Cargando expediente...</p>
      </div>
    );
  }

  const paciente = pacienteActual;

  // Usar datos reales del backend; si están vacíos usar mock como fallback
  const misConsultas  = misConsultasReal.length > 0
    ? misConsultasReal
    : consultas.filter(c => c.pacienteId === paciente?.id);

  const misRecetas    = misRecetasReal.length > 0
    ? misRecetasReal
    : recetas.filter(r => r.pacienteId === paciente?.id);

  const misEstudios   = misEstudiosReal.length > 0
    ? misEstudiosReal
    : estudios.filter(e => e.pacienteId === paciente?.id);

  const misCitas      = misCitasReal.length > 0
    ? misCitasReal
    : citas.filter(c => c.pacienteId === paciente?.id);

  const proximasCitas = misCitas.filter((c: any) =>
    c.estado !== 'completada' && c.estado !== 'cancelada'
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-blue-100">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <User className="text-blue-600 w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-blue-900">Portal del Paciente</CardTitle>
            <CardDescription>Ingresa para consultar tu expediente médico</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="ej. gorc850412hdfmrl"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                Ingresar al Expediente
              </Button>
            </form>
          </CardContent>
        </Card>
        <Link to="/" className="mt-6 flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={cerrarSesion}
            className="flex items-center text-blue-200 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cerrar sesión y volver al inicio
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-blue-700 p-4 rounded-full">
              <User className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl">Portal del Paciente</h1>
              <p className="text-blue-100">{paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Información del Paciente */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">CURP</p>
                <p>{paciente.curp}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Edad</p>
                <p>{paciente.edad} años</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Sangre</p>
                <p>{paciente.tipoSangre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p>{paciente.telefono}</p>
              </div>
            </div>

            {/* Riesgo Cardiovascular — solo si viene del mockData */}
            {(paciente as any).riesgo_cardiovascular != null && (
              <>
                <Separator className="my-4" />
                <div className="mb-2">
                  <p className="text-sm text-gray-500 mb-1">Riesgo Cardiovascular <span className="text-xs text-gray-400">(modelo logístico sobre signos vitales)</span></p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${paciente.nivel_riesgo === 'Alto' ? 'bg-red-500' : paciente.nivel_riesgo === 'Moderado' ? 'bg-yellow-400' : 'bg-green-500'}`}
                        style={{ width: `${((paciente as any).riesgo_cardiovascular * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${paciente.nivel_riesgo === 'Alto' ? 'bg-red-100 text-red-700' : paciente.nivel_riesgo === 'Moderado' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {paciente.nivel_riesgo} ({((paciente as any).riesgo_cardiovascular * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </>
            )}

            {(hasItems(paciente.alergias) || hasItems((paciente as any).enfermedadesCronicas ?? (paciente as any).enfermedades_cronicas)) && (
              <>
                <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-4">
                  {hasItems(paciente.alergias) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Alergias</AlertTitle>
                      <AlertDescription>
                        {toStr(paciente.alergias)}
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasItems((paciente as any).enfermedadesCronicas ?? (paciente as any).enfermedades_cronicas) && (
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertTitle>Enfermedades Crónicas</AlertTitle>
                      <AlertDescription>
                        {toStr((paciente as any).enfermedadesCronicas ?? (paciente as any).enfermedades_cronicas)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Próximas Citas */}
        {proximasCitas.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingClinicos ? (
                  <p className="text-sm text-gray-400">Cargando citas...</p>
                ) : (
                  proximasCitas.map((cita: any) => (
                    <div key={cita.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{cita.especialidad ?? "—"}{cita.medico ? ` — ${cita.medico}` : ""}</p>
                        {cita.motivo && <p className="text-sm text-gray-600">{cita.motivo}</p>}
                        <p className="text-sm text-gray-500 mt-1">
                          {cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-MX', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          }) : "—"}
                          {cita.hora ? ` a las ${cita.hora}` : ""}
                        </p>
                      </div>
                      <Badge variant={cita.estado === 'confirmada' ? 'default' : 'secondary'}>
                        {cita.estado ?? "—"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs con información médica */}
        <Tabs defaultValue="consultas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="consultas">
              <FileText className="w-4 h-4 mr-2" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="recetas">
              <Pill className="w-4 h-4 mr-2" />
              Recetas
            </TabsTrigger>
            <TabsTrigger value="estudios">
              <TestTube className="w-4 h-4 mr-2" />
              Estudios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultas">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Consultas</CardTitle>
                <CardDescription>
                  {misConsultas.length} consulta(s) registrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[...misConsultas].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((consulta: any) => {
                    // Normalizar campos: backend usa snake_case, mockData usa camelCase
                    const motivo   = consulta.motivo_consulta ?? consulta.motivoConsulta ?? "—";
                    const sv       = consulta.signos_vitales  ?? consulta.signos;
                    return (
                    <div key={consulta.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">{consulta.especialidad ?? "—"}</h3>
                          <p className="text-sm text-gray-500">
                            {consulta.fecha ? new Date(consulta.fecha).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            }) : "—"}
                          </p>
                        </div>
                        {consulta.diagnostico_cie10 && (
                          <Badge variant="outline">{consulta.diagnostico_cie10}</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Motivo:</span><span className="ml-2">{motivo}</span></div>
                        <div><span className="text-gray-500">Diagnóstico:</span><span className="ml-2">{consulta.diagnostico ?? "—"}</span></div>
                        <div><span className="text-gray-500">Tratamiento:</span><span className="ml-2">{consulta.tratamiento ?? "—"}</span></div>
                        {consulta.tipo_atencion && (
                          <div><span className="text-gray-500">Tipo:</span><span className="ml-2">{consulta.tipo_atencion}</span></div>
                        )}

                        {sv && (
                          <>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                              <div>
                                <p className="text-xs text-gray-500">Presión Arterial</p>
                                <p className="text-sm">
                                  {sv.presion_sistolica ?? sv.sistolica ?? "—"}/{sv.presion_diastolica ?? sv.diastolica ?? "—"} mmHg
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Frecuencia Cardiaca</p>
                                <p className="text-sm">{sv.frecuencia_cardiaca ?? sv.frecuenciaCardiaca ?? "—"} bpm</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Temperatura</p>
                                <p className="text-sm">{sv.temperatura ?? "—"} °C</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Peso</p>
                                <p className="text-sm">{sv.peso ?? sv.peso_kg ?? "—"} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Glucosa</p>
                                <p className="text-sm">{sv.glucosa ?? "—"} mg/dL</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">SpO₂</p>
                                <p className="text-sm">{sv.saturacion_oxigeno ?? "—"}%</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recetas">
            <Card>
              <CardHeader>
                <CardTitle>Recetas Médicas</CardTitle>
                <CardDescription>
                  {misRecetas.length} receta(s) activa(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[...misRecetas].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((receta: any) => {
                    // El backend devuelve una fila por medicamento; el mock devuelve array medicamentos[]
                    const esMock = Array.isArray(receta.medicamentos);
                    return (
                    <div key={receta.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">
                            {esMock ? receta.medico : (receta.medicamento ?? "Medicamento")}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {receta.fecha ? new Date(receta.fecha).toLocaleDateString('es-MX') : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {esMock ? (
                          receta.medicamentos.map((med: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 p-3 rounded">
                              <p className="font-medium text-blue-900">{med.nombre}</p>
                              <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                                <div><span className="text-gray-500">Dosis:</span> {med.dosis}</div>
                                <div><span className="text-gray-500">Frecuencia:</span> {med.frecuencia}</div>
                                <div><span className="text-gray-500">Duración:</span> {med.duracion}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="font-medium text-blue-900">{receta.medicamento}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                              <div><span className="text-gray-500">Dosis:</span> {receta.dosis ?? "—"}</div>
                              <div><span className="text-gray-500">Frecuencia:</span> {receta.frecuencia ?? "—"}</div>
                              <div><span className="text-gray-500">Duración:</span> {receta.duracion ?? "—"}</div>
                            </div>
                          </div>
                        )}

                        {receta.indicaciones && (
                          <Alert>
                            <AlertTitle>Indicaciones</AlertTitle>
                            <AlertDescription>{receta.indicaciones}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estudios">
            <Card>
              <CardHeader>
                <CardTitle>Estudios y Resultados</CardTitle>
                <CardDescription>
                  {misEstudios.length} estudio(s) registrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...misEstudios].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((estudio: any) => (
                    <div key={estudio.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{estudio.nombre ?? "—"}</h3>
                          <p className="text-sm text-gray-500">
                            {estudio.fecha ? new Date(estudio.fecha).toLocaleDateString('es-MX') : "—"}
                          </p>
                        </div>
                        <Badge>{estudio.tipo ?? "—"}</Badge>
                      </div>

                      {estudio.institucion && (
                        <p className="text-sm text-gray-600 mb-2">{estudio.institucion}</p>
                      )}

                      <div className="bg-gray-50 p-3 rounded">
                        {/* backend: resultado | mock: resultados */}
                        <p className="text-sm text-gray-700">
                          {estudio.resultado ?? estudio.resultados ?? "Sin resultado registrado"}
                        </p>
                        {estudio.unidades && (
                          <p className="text-xs text-gray-400 mt-1">Unidades: {estudio.unidades}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
