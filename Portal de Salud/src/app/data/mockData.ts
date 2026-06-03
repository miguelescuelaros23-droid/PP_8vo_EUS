// ============================================================
// mockData.ts — Datos de prueba alineados con la BD EUS
// ============================================================

export interface Patient {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  edad: number;
  sexo: string;
  curp: string;
  telefono: string;
  email: string;
  direccion: string;
  estado_residencia: string;
  fecha_nacimiento: string;
  tipoSangre: string;
  alergias: string[];
  enfermedadesCronicas: string[];
  riesgo_cardiovascular: number; // 0.0–1.0  (modelo logístico — Cómputo Cognitivo)
  nivel_riesgo: 'Bajo' | 'Moderado' | 'Alto';
}

export interface Consulta {
  id: string;
  pacienteId: string;
  fecha: string;
  institucion: string;
  sector: string;
  medico: string;
  especialidad: string;
  motivoConsulta: string;
  diagnostico: string;
  tratamiento: string;
  notasAdicionales: string;
  signos: {
    presionArterial: string;
    sistolica: number;
    diastolica: number;
    frecuenciaCardiaca: number;
    temperatura: number;
    peso: number;
    altura: number;
    saturacion_oxigeno: number;
  };
}

export interface Receta {
  id: string;
  pacienteId: string;
  consultaId: string;
  fecha: string;
  medico: string;
  medicamentos: { nombre: string; dosis: string; frecuencia: string; duracion: string }[];
  indicaciones: string;
}

export interface Estudio {
  id: string;
  pacienteId: string;
  consultaId: string;
  fecha: string;
  tipo: string;
  nombre: string;
  institucion: string;
  resultados: string;
  archivo?: string;
}

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  institucion: string;
  medico: string;
  especialidad: string;
  estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
}

export interface Personal {
  id: string;
  nombre: string;
  tipo: 'Medico' | 'Enfermero' | 'Secretaria' | 'Administrativo' | 'Tecnico';
  cedula?: string;
  especialidad?: string;
  email: string;
  institucion: string;
}

export interface Usuario {
  username: string;
  password: string;
  rol: 'paciente' | 'medico' | 'enfermero' | 'admin';
  paciente_id?: string;
  personal_id?: string;
}

// ── Usuarios ──────────────────────────────────────────────────
export const usuarios: Usuario[] = [
  { username: 'gorc850412hdfmrl', password: 'Pxgorc85', rol: 'paciente', paciente_id: 'P001' },
  { username: 'pelm920715mdfrnr', password: 'Pxpelm92', rol: 'paciente', paciente_id: 'P002' },
  { username: 'tovl780301mdfrrc', password: 'Pxtovl78', rol: 'paciente', paciente_id: 'P003' },
  { username: 'med.garcia',       password: 'med.garcia.pass',     rol: 'medico', personal_id: 'MED001' },
  { username: 'med.hernandez',    password: 'med.hernandez.pass',  rol: 'medico', personal_id: 'MED002' },
  { username: 'adm.reyes',        password: 'adm.reyes.pass',      rol: 'admin',  personal_id: 'ADM001' },
];

// ── Personal ──────────────────────────────────────────────────
export const personalMedico: Personal[] = [
  { id: 'MED001', nombre: 'Dr. Roberto García Mendoza',  tipo: 'Medico', cedula: '1234567', especialidad: 'Medicina Interna',  email: 'r.garcia@imss.gob.mx',            institucion: 'IMSS — Hospital General Zona 1' },
  { id: 'MED002', nombre: 'Dr. Luis Hernández Vega',     tipo: 'Medico', cedula: '2345678', especialidad: 'Medicina General',  email: 'l.hernandez@ssa.gob.mx',          institucion: 'Centro de Salud SSA' },
  { id: 'MED003', nombre: 'Dra. Carmen Ruiz Torres',     tipo: 'Medico', cedula: '3456789', especialidad: 'Neumología',        email: 'c.ruiz@hospitalsantamaria.mx',    institucion: 'Hospital Privado Santa María' },
];

// ── Pacientes ─────────────────────────────────────────────────
export const pacientes: Patient[] = [
  {
    id: 'P001', nombre: 'Carlos', apellido_paterno: 'Gómez', apellido_materno: 'Ruiz',
    edad: 40, sexo: 'Masculino', curp: 'GORC850412HDFMRLA3', fecha_nacimiento: '1985-04-12',
    telefono: '55 5123-4567', email: 'carlos.gomez@mail.com',
    direccion: 'Av. Insurgentes 342, Col. Roma Norte', estado_residencia: 'Ciudad de México',
    tipoSangre: 'O+', alergias: ['Penicilina'],
    enfermedadesCronicas: ['Hipertensión arterial', 'Diabetes mellitus tipo 2'],
    riesgo_cardiovascular: 0.74, nivel_riesgo: 'Alto',
  },
  {
    id: 'P002', nombre: 'María', apellido_paterno: 'Pérez', apellido_materno: 'Luna',
    edad: 33, sexo: 'Femenino', curp: 'PELM920715MDFRNRA8', fecha_nacimiento: '1992-07-15',
    telefono: '33 9876-5432', email: 'maria.perez@mail.com',
    direccion: 'Calle Hidalgo 89, Col. Centro', estado_residencia: 'Jalisco',
    tipoSangre: 'A+', alergias: [],
    enfermedadesCronicas: [],
    riesgo_cardiovascular: 0.18, nivel_riesgo: 'Bajo',
  },
  {
    id: 'P003', nombre: 'Lucía', apellido_paterno: 'Torres', apellido_materno: 'Vega',
    edad: 47, sexo: 'Femenino', curp: 'TOVL780301MDFRRCA2', fecha_nacimiento: '1978-03-01',
    telefono: '81 4443-3221', email: 'lucia.torres@mail.com',
    direccion: 'Blvd. Constitución 1200, Col. Obispado', estado_residencia: 'Nuevo León',
    tipoSangre: 'B+', alergias: ['Ibuprofeno', 'Sulfas'],
    enfermedadesCronicas: ['Asma bronquial'],
    riesgo_cardiovascular: 0.42, nivel_riesgo: 'Moderado',
  },
  {
    id: 'P004', nombre: 'Jorge', apellido_paterno: 'Martínez', apellido_materno: 'Flores',
    edad: 55, sexo: 'Masculino', curp: 'MAFJ700615HDFRLRA5', fecha_nacimiento: '1970-06-15',
    telefono: '55 6677-8899', email: 'jorge.martinez@mail.com',
    direccion: 'Calle Morelos 45, Col. Doctores', estado_residencia: 'Ciudad de México',
    tipoSangre: 'AB+', alergias: [],
    enfermedadesCronicas: ['Diabetes mellitus tipo 2', 'Dislipidemia'],
    riesgo_cardiovascular: 0.81, nivel_riesgo: 'Alto',
  },
];

// ── Consultas ─────────────────────────────────────────────────
export const consultas: Consulta[] = [
  {
    id: 'C001', pacienteId: 'P001', fecha: '2026-03-20',
    institucion: 'IMSS — Hospital General Zona 1', sector: 'IMSS',
    medico: 'Dr. Roberto García', especialidad: 'Medicina Interna',
    motivoConsulta: 'Control mensual de hipertensión y diabetes',
    diagnostico: 'Hipertensión arterial controlada, Diabetes mellitus tipo 2',
    tratamiento: 'Continuar Metformina 850mg c/12h + Enalapril 10mg c/24h',
    notasAdicionales: 'Reducción de 3kg desde última consulta.',
    signos: { presionArterial: '132/86 mmHg', sistolica: 132, diastolica: 86, frecuenciaCardiaca: 78, temperatura: 36.5, peso: 82.5, altura: 1.74, saturacion_oxigeno: 97 },
  },
  {
    id: 'C002', pacienteId: 'P001', fecha: '2026-01-15',
    institucion: 'IMSS — Hospital General Zona 1', sector: 'IMSS',
    medico: 'Dr. Roberto García', especialidad: 'Medicina Interna',
    motivoConsulta: 'Control mensual',
    diagnostico: 'Hipertensión arterial, ajuste de medicamento',
    tratamiento: 'Ajuste de dosis de Enalapril a 10mg',
    notasAdicionales: 'Presión ligeramente elevada.',
    signos: { presionArterial: '145/92 mmHg', sistolica: 145, diastolica: 92, frecuenciaCardiaca: 82, temperatura: 36.6, peso: 85.5, altura: 1.74, saturacion_oxigeno: 96 },
  },
  {
    id: 'C003', pacienteId: 'P002', fecha: '2026-03-18',
    institucion: 'Centro de Salud SSA — Colonia Centro', sector: 'SSA',
    medico: 'Dr. Luis Hernández', especialidad: 'Medicina General',
    motivoConsulta: 'Fiebre y dolor de garganta desde hace 3 días',
    diagnostico: 'Faringoamigdalitis bacteriana',
    tratamiento: 'Amoxicilina 500mg c/8h por 7 días',
    notasAdicionales: 'Cultivo positivo a Streptococcus.',
    signos: { presionArterial: '115/72 mmHg', sistolica: 115, diastolica: 72, frecuenciaCardiaca: 88, temperatura: 38.4, peso: 62.0, altura: 1.63, saturacion_oxigeno: 98 },
  },
  {
    id: 'C004', pacienteId: 'P003', fecha: '2026-03-10',
    institucion: 'Hospital Privado Santa María', sector: 'Privada',
    medico: 'Dra. Carmen Ruiz', especialidad: 'Neumología',
    motivoConsulta: 'Crisis asmática leve, disnea de esfuerzo',
    diagnostico: 'Asma bronquial moderada',
    tratamiento: 'Ajuste de inhalador y corticosteroides',
    notasAdicionales: 'SpO₂ mejoró a 97% post-broncodilatador.',
    signos: { presionArterial: '118/74 mmHg', sistolica: 118, diastolica: 74, frecuenciaCardiaca: 91, temperatura: 36.8, peso: 68.0, altura: 1.65, saturacion_oxigeno: 94 },
  },
  {
    id: 'C005', pacienteId: 'P004', fecha: '2026-03-25',
    institucion: 'IMSS — Hospital General Zona 1', sector: 'IMSS',
    medico: 'Dr. Roberto García', especialidad: 'Medicina Interna',
    motivoConsulta: 'Control trimestral de diabetes y dislipidemia',
    diagnostico: 'Diabetes mellitus tipo 2 descontrolada, Dislipidemia',
    tratamiento: 'Aumentar dosis Metformina 1000mg. Iniciar Atorvastatina 20mg',
    notasAdicionales: 'HbA1c de 8.2%. Requiere mayor control dietético.',
    signos: { presionArterial: '148/95 mmHg', sistolica: 148, diastolica: 95, frecuenciaCardiaca: 86, temperatura: 36.9, peso: 95.0, altura: 1.72, saturacion_oxigeno: 96 },
  },
];

// ── Recetas ───────────────────────────────────────────────────
export const recetas: Receta[] = [
  {
    id: 'R001', pacienteId: 'P001', consultaId: 'C001', fecha: '2026-03-20', medico: 'Dr. Roberto García',
    medicamentos: [
      { nombre: 'Metformina', dosis: '850mg', frecuencia: 'Cada 12 horas', duracion: '30 días' },
      { nombre: 'Enalapril',  dosis: '10mg',  frecuencia: 'Cada 24 horas', duracion: '30 días' },
    ],
    indicaciones: 'Tomar con alimentos. No suspender sin consultar al médico.',
  },
  {
    id: 'R002', pacienteId: 'P002', consultaId: 'C003', fecha: '2026-03-18', medico: 'Dr. Luis Hernández',
    medicamentos: [
      { nombre: 'Amoxicilina', dosis: '500mg', frecuencia: 'Cada 8 horas',           duracion: '7 días' },
      { nombre: 'Paracetamol', dosis: '500mg', frecuencia: 'Cada 6-8h si hay fiebre', duracion: '5 días' },
    ],
    indicaciones: 'Completar el tratamiento antibiótico aunque mejore.',
  },
  {
    id: 'R003', pacienteId: 'P003', consultaId: 'C004', fecha: '2026-03-10', medico: 'Dra. Carmen Ruiz',
    medicamentos: [
      { nombre: 'Salbutamol (inhalador)',  dosis: '2 inh', frecuencia: 'Cada 4-6h según necesidad', duracion: '30 días' },
      { nombre: 'Fluticasona (inhalador)', dosis: '2 inh', frecuencia: 'Cada 12 horas',             duracion: '30 días' },
    ],
    indicaciones: 'Enjuagar boca después del inhalador de corticosteroides.',
  },
];

// ── Estudios ──────────────────────────────────────────────────
export const estudios: Estudio[] = [
  { id: 'E001', pacienteId: 'P001', consultaId: 'C001', fecha: '2026-03-15', tipo: 'Laboratorio', nombre: 'Glucosa en ayunas',  institucion: 'Lab. Central IMSS',         resultados: '128 mg/dL — Dentro del rango meta' },
  { id: 'E002', pacienteId: 'P001', consultaId: 'C001', fecha: '2026-03-15', tipo: 'Laboratorio', nombre: 'HbA1c',              institucion: 'Lab. Central IMSS',         resultados: '7.1% — Control adecuado de diabetes' },
  { id: 'E003', pacienteId: 'P003', consultaId: 'C004', fecha: '2026-03-09', tipo: 'Radiología',  nombre: 'Radiografía tórax',  institucion: 'Hospital Privado Santa María', resultados: 'Hiperinsuflación leve. Sin focos de condensación.' },
  { id: 'E004', pacienteId: 'P004', consultaId: 'C005', fecha: '2026-03-24', tipo: 'Laboratorio', nombre: 'Perfil lipídico',     institucion: 'Lab. Central IMSS',         resultados: 'LDL: 165 mg/dL ↑  HDL: 38 mg/dL ↓' },
];

// ── Citas ─────────────────────────────────────────────────────
export const citas: Cita[] = [
  { id: 'CI001', pacienteId: 'P001', fecha: '2026-07-10', hora: '10:00', institucion: 'IMSS — Hospital General Zona 1', medico: 'Dr. Roberto García', especialidad: 'Medicina Interna',  estado: 'confirmada' },
  { id: 'CI002', pacienteId: 'P002', fecha: '2026-06-28', hora: '15:30', institucion: 'Centro de Salud SSA',           medico: 'Dr. Luis Hernández',  especialidad: 'Medicina General', estado: 'pendiente'  },
  { id: 'CI003', pacienteId: 'P003', fecha: '2026-07-05', hora: '11:00', institucion: 'Hospital Privado Santa María',  medico: 'Dra. Carmen Ruiz',    especialidad: 'Neumología',       estado: 'confirmada' },
  { id: 'CI004', pacienteId: 'P004', fecha: '2026-06-30', hora: '09:00', institucion: 'IMSS — Hospital General Zona 1', medico: 'Dr. Roberto García', especialidad: 'Medicina Interna',  estado: 'pendiente'  },
];

// ── Datos para Analítica (gráficas con recharts) ──────────────
export const distribucionDiagnosticos = [
  { diagnostico: 'Hipertensión', casos: 28 },
  { diagnostico: 'Diabetes T2',  casos: 22 },
  { diagnostico: 'Dislipidemia', casos: 18 },
  { diagnostico: 'Asma',         casos: 14 },
  { diagnostico: 'Faringitis',   casos: 11 },
  { diagnostico: 'Otros',        casos: 27 },
];

export const signosVitalesTendencia = [
  { mes: 'Oct', sistolica: 148, diastolica: 94, fc: 84 },
  { mes: 'Nov', sistolica: 145, diastolica: 91, fc: 82 },
  { mes: 'Dic', sistolica: 143, diastolica: 90, fc: 80 },
  { mes: 'Ene', sistolica: 141, diastolica: 88, fc: 81 },
  { mes: 'Feb', sistolica: 137, diastolica: 87, fc: 79 },
  { mes: 'Mar', sistolica: 132, diastolica: 86, fc: 78 },
];

export const distribucionRiesgo = [
  { nivel: 'Bajo',     cantidad: 42, color: '#22c55e' },
  { nivel: 'Moderado', cantidad: 31, color: '#f59e0b' },
  { nivel: 'Alto',     cantidad: 27, color: '#ef4444' },
];

export const pacientesPorSector = [
  { sector: 'IMSS',    pacientes: 38 },
  { sector: 'SSA',     pacientes: 24 },
  { sector: 'ISSSTE',  pacientes: 18 },
  { sector: 'Privada', pacientes: 20 },
];

export const currentPatient = pacientes[0];
