import { createBrowserRouter, useRouteError } from "react-router";
import { Home }          from "./pages/Home";
import { PatientPortal } from "./pages/PatientPortal";
import { StaffPortal }   from "./pages/StaffPortal";
import { PatientRecord } from "./pages/PatientRecord";
import { Analitica }     from "./pages/Analitica";
import { Modelo }        from "./pages/Modelo";
import { NotFound }      from "./pages/NotFound";

// ── Error boundary global — evita pantalla blanca de React Router ──
function ErrorPage() {
  const error = useRouteError() as { message?: string; statusText?: string } | null;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-8 max-w-md w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h1>
        <p className="text-gray-400 text-sm mb-6">
          {error?.message || error?.statusText || "Error inesperado en la aplicación"}
        </p>
        <button
          onClick={() => window.location.href = "/"}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/",                         Component: Home,          errorElement: <ErrorPage /> },
  { path: "/paciente",                 Component: PatientPortal, errorElement: <ErrorPage /> },
  { path: "/personal",                 Component: StaffPortal,   errorElement: <ErrorPage /> },
  { path: "/personal/paciente/:id",    Component: PatientRecord, errorElement: <ErrorPage /> },
  { path: "/analitica",                Component: Analitica,     errorElement: <ErrorPage /> },
  { path: "/modelo",                   Component: Modelo,        errorElement: <ErrorPage /> },
  { path: "*",                         Component: NotFound      },
]);
