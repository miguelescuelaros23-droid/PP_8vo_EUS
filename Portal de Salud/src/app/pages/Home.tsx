import { Link } from "react-router";
import { User, Stethoscope, Heart, Target, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const OBJETIVOS_ESPECIFICOS = [
  "Analizar cómo funciona actualmente el manejo de expedientes clínicos en México y cuáles son sus principales problemas.",
  "Diseñar una plataforma digital que permita integrar información médica de distintas instituciones de salud.",
  "Desarrollar una API que ayude a conectar sistemas de salud públicos y privados.",
  "Permitir que tanto el personal médico como los pacientes puedan acceder a la información de forma segura.",
  "Proponer la creación de una Norma Oficial Mexicana (NOM) que haga obligatorio el uso de este sistema.",
];

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 text-blue-900">
            Expediente Único de Salud
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Sistema integrado para la gestión de información clínica en México.
          </p>
          <p className="text-sm text-gray-400">
            Proyecto Integrador · Licenciatura en Ciencia de Datos para Negocios · UNRC
          </p>
        </div>

        {/* Portales de acceso */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-14">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-blue-900">Portal del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">Consulta tu expediente, citas y recetas</p>
              <Link to="/paciente">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  Acceder como Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-green-900">Portal del Personal</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">Gestiona expedientes y registra consultas</p>
              <Link to="/personal">
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                  Acceder como Personal
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Objetivos del proyecto */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-blue-200 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Target className="w-6 h-6 text-blue-700" />
                </div>
                <CardTitle className="text-blue-900">Objetivos del Proyecto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Objetivo general */}
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
                  Objetivo General
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Desarrollar una página web con una API funcional que permita crear un expediente
                  clínico único en México, con el propósito de centralizar la información médica de
                  los pacientes y facilitar su acceso tanto para médicos como para los propios pacientes.
                </p>
              </div>

              {/* Objetivos específicos */}
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
                  Objetivos Específicos
                </p>
                <ul className="space-y-2">
                  {OBJETIVOS_ESPECIFICOS.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckSquare className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700 text-sm leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jira */}
        <div className="max-w-4xl mx-auto mb-10">
          <Card className="border-indigo-200 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                {/* Logo de Jira en SVG inline */}
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.89 2C8.77 2 3 7.77 3 14.89c0 5.18 3.08 9.65 7.56 11.73L15.89 32l5.33-5.38C25.7 24.54 28.78 20.07 28.78 14.89 28.78 7.77 23.01 2 15.89 2zm0 21.34l-5.16-5.16a7.28 7.28 0 010-10.32l5.16 5.16 5.16-5.16a7.28 7.28 0 010 10.32l-5.16 5.16z" fill="#2684FF"/>
                </svg>
                <CardTitle className="text-indigo-900">Gestión del Proyecto con Jira</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm leading-relaxed">
                Las actividades del proyecto fueron administradas mediante <strong>Jira Software</strong>,
                utilizando un tablero Scrum con sprints semanales. Se definieron épicas por área
                (Base de Datos, Backend, Frontend, Analítica y Seguridad), historias de usuario
                y tareas con criterios de aceptación. Esto permitió dar seguimiento al avance,
                detectar bloqueos a tiempo y documentar el progreso de cada entregable.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Imagen Admin */}
        <div className="max-w-4xl mx-auto mb-10">
          <img
            src="/Admin.png"
            alt="Administración del proyecto"
            className="w-full rounded-xl shadow-md border border-gray-200"
          />
        </div>

        <div className="text-center text-xs text-gray-400 pb-6">
          Sistema de demostración · datos sintéticos · no usar para información médica real
        </div>

      </div>
    </div>
  );
}
