-- ============================================================
-- schema.sql — Crea las tablas EUS alineadas con los CSVs
-- Base de datos: eum_db   Usuario: eus_user
--
-- Ejecutar:
--   psql -U eus_user -d eum_db -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS instituciones (
    id          UUID PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    sector      VARCHAR(30),
    tipo        VARCHAR(10),
    consultorio VARCHAR(20),
    estado      VARCHAR(50),
    activa      BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS personal (
    id                  UUID PRIMARY KEY,
    nombre_completo     VARCHAR(200) NOT NULL,
    genero              VARCHAR(20),
    fecha_nacimiento    DATE,
    fecha_contratacion  DATE,
    tipo                VARCHAR(20),
    cedula_profesional  VARCHAR(20),
    especialidad        VARCHAR(100),
    telefono            VARCHAR(20),
    email               VARCHAR(100),
    estado_residencia   VARCHAR(50),
    institucion_id      UUID REFERENCES instituciones(id),
    activo              BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pacientes (
    id                  UUID PRIMARY KEY,
    curp                VARCHAR(18) UNIQUE NOT NULL,
    nombre              VARCHAR(100),
    apellido_paterno    VARCHAR(80),
    apellido_materno    VARCHAR(80),
    fecha_nacimiento    DATE,
    edad                INTEGER,
    sexo                VARCHAR(5),
    tipo_sangre         VARCHAR(5),
    telefono            VARCHAR(25),
    email               VARCHAR(100),
    estado_residencia   VARCHAR(50),
    alergias            VARCHAR(300),
    enfermedades_cronicas VARCHAR(300),
    tiene_diabetes      BOOLEAN DEFAULT FALSE,
    tiene_hipertension  BOOLEAN DEFAULT FALSE,
    tiene_asma          BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID PRIMARY KEY,
    username        VARCHAR(60) UNIQUE NOT NULL,
    password_hash   VARCHAR(64) NOT NULL,
    tipo_usuario    VARCHAR(20) NOT NULL,
    paciente_id     UUID REFERENCES pacientes(id),
    personal_id     UUID REFERENCES personal(id),
    activo          BOOLEAN DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS consultas (
    id                  UUID PRIMARY KEY,
    paciente_id         UUID REFERENCES pacientes(id),
    medico_id           UUID REFERENCES personal(id),
    institucion_id      UUID REFERENCES instituciones(id),
    fecha               DATE,
    especialidad        VARCHAR(100),
    motivo_consulta     VARCHAR(300),
    diagnostico         VARCHAR(300),
    diagnostico_cie10   VARCHAR(10),
    tratamiento         TEXT,
    tipo_atencion       VARCHAR(50),
    notas_adicionales   TEXT
);

CREATE TABLE IF NOT EXISTS citas (
    id              UUID PRIMARY KEY,
    paciente_id     UUID REFERENCES pacientes(id),
    medico_id       UUID REFERENCES personal(id),
    institucion_id  UUID REFERENCES instituciones(id),
    fecha           DATE,
    hora            VARCHAR(10),
    especialidad    VARCHAR(100),
    estado          VARCHAR(20),
    motivo          VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS signos_vitales (
    id                  UUID PRIMARY KEY,
    paciente_id         UUID REFERENCES pacientes(id),
    consulta_id         UUID REFERENCES consultas(id),
    fecha               DATE,
    presion_sistolica   INTEGER,
    presion_diastolica  INTEGER,
    frecuencia_cardiaca INTEGER,
    temperatura         NUMERIC(4,1),
    peso                NUMERIC(5,1),
    altura              NUMERIC(4,2),
    imc                 NUMERIC(5,2),
    glucosa             NUMERIC(6,1),
    saturacion_oxigeno  INTEGER
);

-- Cómputo Cognitivo: scores de riesgo calculados con modelo logístico
CREATE TABLE IF NOT EXISTS riesgo_clinico (
    id                          UUID PRIMARY KEY,
    paciente_id                 UUID REFERENCES pacientes(id),
    fecha_calculo               DATE,
    modelo_version              VARCHAR(30),
    edad                        INTEGER,
    sexo                        VARCHAR(5),
    tiene_diabetes              BOOLEAN,
    tiene_hipertension          BOOLEAN,
    imc_promedio                NUMERIC(5,2),
    glucosa_promedio            NUMERIC(6,2),
    glucosa_maxima              NUMERIC(6,2),
    pa_sistolica_promedio       NUMERIC(5,2),
    pa_diastolica_promedio      NUMERIC(5,2),
    num_consultas               INTEGER,
    score_riesgo_cardiovascular NUMERIC(6,4),
    score_riesgo_complicacion_dm2 NUMERIC(6,4),
    nivel_riesgo                VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS recetas (
    id              UUID PRIMARY KEY,
    paciente_id     UUID REFERENCES pacientes(id),
    consulta_id     UUID REFERENCES consultas(id),
    medico_id       UUID REFERENCES personal(id),
    fecha           DATE,
    medicamento     VARCHAR(200),
    dosis           VARCHAR(50),
    frecuencia      VARCHAR(100),
    duracion        VARCHAR(50),
    indicaciones    TEXT
);

CREATE TABLE IF NOT EXISTS estudios (
    id              UUID PRIMARY KEY,
    paciente_id     UUID REFERENCES pacientes(id),
    consulta_id     UUID REFERENCES consultas(id),
    institucion_id  UUID REFERENCES instituciones(id),
    fecha           DATE,
    tipo            VARCHAR(50),
    nombre          VARCHAR(200),
    resultado       TEXT,
    unidades        VARCHAR(50)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_pacientes_curp       ON pacientes(curp);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente   ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_signos_consulta      ON signos_vitales(consulta_id);
CREATE INDEX IF NOT EXISTS idx_riesgo_paciente      ON riesgo_clinico(paciente_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_username    ON usuarios(username);

SELECT 'Schema EUS creado correctamente ✓' AS resultado;
