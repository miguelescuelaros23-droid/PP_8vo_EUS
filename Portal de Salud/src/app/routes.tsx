import { createBrowserRouter } from "react-router";
import { Home }          from "./pages/Home";
import { PatientPortal } from "./pages/PatientPortal";
import { StaffPortal }   from "./pages/StaffPortal";
import { PatientRecord } from "./pages/PatientRecord";
import { Analitica }     from "./pages/Analitica";
import { Modelo }        from "./pages/Modelo";
import { NotFound }      from "./pages/NotFound";

export const router = createBrowserRouter([
  { path: "/",                         Component: Home          },
  { path: "/paciente",                 Component: PatientPortal },
  { path: "/personal",                 Component: StaffPortal   },
  { path: "/personal/paciente/:id",    Component: PatientRecord },
  { path: "/analitica",                Component: Analitica     },
  { path: "/modelo",                   Component: Modelo        },
  { path: "*",                         Component: NotFound      },
]);
