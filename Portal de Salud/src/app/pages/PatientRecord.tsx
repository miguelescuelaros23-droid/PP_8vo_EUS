import { useState } from "react";
import { Link, useParams } from "react-router";
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Pill, 
  TestTube, 
  Calendar,
  AlertCircle,
  Activity,
  Edit,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { pacientes, consultas, recetas, estudios, citas } from "../data/mockData";

export function PatientRecord() {
  const { id } = useParams();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewReceta, setShowNewReceta] = useState(false);
  const [isAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticatedStaff') === 'true';
  });
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-red-100">
          <CardHeader className="text-center">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <CardTitle className="text-2xl text-red-700">Acceso Denegado</CardTitle>
             <CardDescription>Debe iniciar sesión en el portal médico para ver este expediente.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/personal">
              <Button className="bg-green-600 hover:bg-green-700">Ir al Portal Médico</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const paciente = pacientes.find(p => p.id === id);
  
  if (!paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Paciente no encontrado</CardTitle>
            <CardDescription>El ID de paciente no existe en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/personal">
              <Button>Volver al Portal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const consultasPaciente = consultas.filter(c => c.pacienteId === paciente.id);
  const recetasPaciente = recetas.filter(r => r.pacienteId === paciente.id);
  const estudiosPaciente = estudios.filter(e => e.pacienteId === paciente.id);
  const citasPaciente = citas.filter(c => c.pacienteId === paciente.id);

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Información del paciente actualizada");
    setShowEditDialog(false);
  };

  const handleNewReceta = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Receta registrada exitosamente");
    setShowNewReceta(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <Link to="/personal">
            <Button variant="ghost" className="text-white hover:bg-green-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Portal del Personal
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-700 p-4 rounded-full">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl">{paciente.nombre}</h1>
                <p className="text-green-100">Expediente {paciente.id}</p>
              </div>
            </div>
            
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50">
                  <Edit className="w-4 h-4 mr-2" />
                  Actualizar Información
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Actualizar Información del Paciente</DialogTitle>
                  <DialogDescription>
                    Modifique los datos del paciente
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" defaultValue={paciente.telefono} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={paciente.email} />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Textarea id="direccion" defaultValue={paciente.direccion} />
                  </div>
                  <div>
                    <Label htmlFor="alergias">Alergias (separadas por coma)</Label>
                    <Input id="alergias" defaultValue={paciente.alergias.join(", ")} />
                  </div>
                  <div>
                    <Label htmlFor="enfermedades">Enfermedades Crónicas (separadas por coma)</Label>
                    <Input id="enfermedades" defaultValue={paciente.enfermedadesCronicas.join(", ")} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Información del Paciente */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Paciente
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
                <p className="text-sm text-gray-500">Sexo</p>
                <p>{paciente.sexo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Sangre</p>
                <p>{paciente.tipoSangre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p>{paciente.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{paciente.email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Dirección</p>
                <p>{paciente.direccion}</p>
              </div>
            </div>

            {(paciente.alergias.length > 0 || paciente.enfermedadesCronicas.length > 0) && (
              <>
                <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-4">
                  {paciente.alergias.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Alergias Registradas</AlertTitle>
                      <AlertDescription>
                        {paciente.alergias.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                  {paciente.enfermedadesCronicas.length > 0 && (
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertTitle>Enfermedades Crónicas</AlertTitle>
                      <AlertDescription>
                        {paciente.enfermedadesCronicas.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Resumen Rápido */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{consultasPaciente.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recetas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{recetasPaciente.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Estudios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{estudiosPaciente.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{citasPaciente.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con expediente completo */}
        <Tabs defaultValue="consultas" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="citas">
              <Calendar className="w-4 h-4 mr-2" />
              Citas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Historial Completo de Consultas</CardTitle>
                    <CardDescription>
                      {consultasPaciente.length} consulta(s) registrada(s) en todas las instituciones
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {consultasPaciente.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(consulta => (
                    <div key={consulta.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-lg">{consulta.especialidad}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(consulta.fecha).toLocaleDateString('es-MX', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{consulta.institucion}</Badge>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-gray-500 font-medium">Médico:</span>
                            <p className="mt-1">{consulta.medico}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Especialidad:</span>
                            <p className="mt-1">{consulta.especialidad}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500 font-medium">Motivo de Consulta:</span>
                          <p className="mt-1">{consulta.motivoConsulta}</p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                          <span className="text-gray-700 font-medium">Diagnóstico:</span>
                          <p className="mt-1 text-gray-900">{consulta.diagnostico}</p>
                        </div>

                        <div>
                          <span className="text-gray-500 font-medium">Tratamiento:</span>
                          <p className="mt-1">{consulta.tratamiento}</p>
                        </div>

                        {consulta.notasAdicionales && (
                          <div>
                            <span className="text-gray-500 font-medium">Notas Adicionales:</span>
                            <p className="mt-1 italic text-gray-600">{consulta.notasAdicionales}</p>
                          </div>
                        )}
                        
                        <Separator className="my-3" />
                        
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="font-medium mb-2 text-gray-700">Signos Vitales</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Presión Arterial</p>
                              <p className="text-sm font-medium">{consulta.signos.presionArterial}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Frecuencia Cardiaca</p>
                              <p className="text-sm font-medium">{consulta.signos.frecuenciaCardiaca}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Temperatura</p>
                              <p className="text-sm font-medium">{consulta.signos.temperatura}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Peso</p>
                              <p className="text-sm font-medium">{consulta.signos.peso}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Altura</p>
                              <p className="text-sm font-medium">{consulta.signos.altura}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recetas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recetas Médicas</CardTitle>
                    <CardDescription>
                      {recetasPaciente.length} receta(s) registrada(s)
                    </CardDescription>
                  </div>
                  <Dialog open={showNewReceta} onOpenChange={setShowNewReceta}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Receta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Prescribir Nueva Receta</DialogTitle>
                        <DialogDescription>
                          Complete los datos de la receta médica
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleNewReceta} className="space-y-4">
                        <div>
                          <Label htmlFor="medicamento">Medicamento</Label>
                          <Input id="medicamento" placeholder="Nombre del medicamento" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="dosis">Dosis</Label>
                            <Input id="dosis" placeholder="500mg" />
                          </div>
                          <div>
                            <Label htmlFor="frecuencia">Frecuencia</Label>
                            <Input id="frecuencia" placeholder="Cada 8 horas" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="duracion">Duración del Tratamiento</Label>
                          <Input id="duracion" placeholder="7 días" />
                        </div>
                        <div>
                          <Label htmlFor="indicaciones">Indicaciones</Label>
                          <Textarea id="indicaciones" placeholder="Instrucciones especiales" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowNewReceta(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            Prescribir Receta
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recetasPaciente.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(receta => (
                    <div key={receta.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{receta.medico}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(receta.fecha).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {receta.medicamentos.map((med, idx) => (
                          <div key={idx} className="bg-green-50 p-4 rounded border-l-4 border-green-600">
                            <p className="font-medium text-green-900 text-lg">{med.nombre}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500 font-medium">Dosis:</span>
                                <p>{med.dosis}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">Frecuencia:</span>
                                <p>{med.frecuencia}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">Duración:</span>
                                <p>{med.duracion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {receta.indicaciones && (
                          <Alert>
                            <AlertTitle>Indicaciones Especiales</AlertTitle>
                            <AlertDescription>{receta.indicaciones}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estudios">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estudios y Resultados de Laboratorio</CardTitle>
                    <CardDescription>
                      {estudiosPaciente.length} estudio(s) registrado(s)
                    </CardDescription>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Estudio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estudiosPaciente.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(estudio => (
                    <div key={estudio.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-lg">{estudio.nombre}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(estudio.fecha).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge>{estudio.tipo}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Institución:</span> {estudio.institucion}
                      </p>
                      
                      <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-600">
                        <p className="font-medium text-blue-900 mb-2">Resultados:</p>
                        <p className="text-sm text-gray-700">{estudio.resultados}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Citas Médicas</CardTitle>
                    <CardDescription>
                      {citasPaciente.length} cita(s) programada(s)
                    </CardDescription>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {citasPaciente.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(cita => (
                    <div key={cita.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">{cita.especialidad}</h3>
                            <Badge variant={
                              cita.estado === 'confirmada' ? 'default' :
                              cita.estado === 'pendiente' ? 'secondary' :
                              cita.estado === 'completada' ? 'outline' :
                              'destructive'
                            }>
                              {cita.estado}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Médico:</span> {cita.medico}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Institución:</span> {cita.institucion}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(cita.fecha).toLocaleDateString('es-MX', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} a las {cita.hora}
                          </p>
                        </div>
                        
                        {cita.estado === 'pendiente' && (
                          <Button variant="outline" size="sm">
                            Confirmar
                          </Button>
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
