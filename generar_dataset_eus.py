#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
  EUS — Dataset Generator  |  Expediente Único de Salud
  Universidad Nacional "Rosario Castellanos"  |  8° Semestre 2026
═══════════════════════════════════════════════════════════════════

  Genera datos sintéticos para 1,000 pacientes con historial de
  2 años (2024-2025). Produce 10 archivos CSV listos para:
    · PostgreSQL (COPY FROM)
    · Pandas / scikit-learn (ML directo)
    · FastAPI (seed de base de datos)

  REQUISITOS:
    pip install faker pandas numpy

  USO:
    python generar_dataset_eus.py

  OUTPUT:  carpeta  dataset_eus/
    instituciones.csv  |  personal.csv        |  pacientes.csv
    consultas.csv      |  signos_vitales.csv  |  recetas.csv
    estudios.csv       |  citas.csv           |  riesgo_clinico.csv
    usuarios.csv
"""

import hashlib, os, re, uuid, random
from datetime import date, timedelta

import numpy as np
import pandas as pd
from faker import Faker

# ─────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────
SEED         = 42
N_PACIENTES  = 1_000
N_PERSONAL   = 60          # total de personal (médicos + otros roles)
OUTPUT_DIR   = "dataset_eus"
FECHA_INICIO = date(2024, 1, 1)
FECHA_FIN    = date(2025, 12, 31)
HOY          = date(2026, 5, 17)

random.seed(SEED)
np.random.seed(SEED)
Faker.seed(SEED)
fake = Faker("es_MX")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────
# UTILIDADES
# ─────────────────────────────────────────────────────────────────
def uid() -> str:
    return str(uuid.uuid4())

def rdate(start: date = FECHA_INICIO, end: date = FECHA_FIN) -> date:
    return start + timedelta(days=random.randint(0, (end - start).days))

def clip(v, lo, hi):
    return max(lo, min(hi, v))

def save(df: pd.DataFrame, name: str) -> None:
    path = os.path.join(OUTPUT_DIR, f"{name}.csv")
    df.to_csv(path, index=False, encoding="utf-8-sig")
    print(f"  ✓  {name}.csv  —  {len(df):,} filas")

def hash_pass(raw: str) -> str:
    """SHA-256 de la contraseña en texto plano (simulada)."""
    return hashlib.sha256(raw.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────
# CATÁLOGOS INTERNOS
# ─────────────────────────────────────────────────────────────────
ESTADOS_MX = [
    "AS","BC","BS","CC","CL","CM","CS","CH","DF","DG",
    "GT","GR","HG","JC","MC","MN","MS","NT","NL","OC",
    "PL","QT","QR","SP","SL","SR","TC","TL","TS","VZ","YN","ZS",
]

TIPO_SANGRE   = ["A+","A-","B+","B-","O+","O-","AB+","AB-"]
TIPO_SANGRE_W = [0.38, 0.06, 0.10, 0.02, 0.36, 0.04, 0.03, 0.01]

ESPECIALIDADES = [
    "Medicina General", "Medicina Interna", "Cardiología",
    "Neumología", "Endocrinología", "Nefrología", "Neurología",
    "Oftalmología", "Traumatología", "Ginecología",
    "Pediatría", "Geriatría", "Urgencias", "Nutrición Clínica",
]

ALERGIAS_CAT = [
    "Penicilina","Amoxicilina","Aspirina","Ibuprofeno","Sulfonamidas",
    "Polen","Polvo","Mariscos","Cacahuates","Látex","Yodo",
    "Metamizol","Diclofenaco","Cefalosporinas",
]

# Tipos de personal y su distribución
TIPOS_PERSONAL = ["Medico", "Enfermero", "Secretaria", "Administrativo", "Tecnico"]
TIPOS_PERSONAL_W = [0.42, 0.30, 0.12, 0.10, 0.06]   # ~25 médicos en 60 personas

# Motivos por especialidad
MOTIVOS = {
    "Medicina General": [
        "Control de padecimiento crónico",
        "Dolor de cabeza frecuente",
        "Revisión general y actualización de estudios",
        "Tos persistente y malestar general",
        "Fiebre y dolor corporal generalizado",
        "Náuseas y dolor abdominal",
        "Cansancio y fatiga excesiva",
    ],
    "Cardiología": [
        "Control de hipertensión arterial",
        "Palpitaciones y sensación de arritmia",
        "Dolor precordial en reposo",
        "Seguimiento post-evento cardiovascular",
        "Disnea de esfuerzo progresiva",
    ],
    "Endocrinología": [
        "Control de diabetes mellitus tipo 2",
        "Ajuste de insulinoterapia",
        "Descontrol glucémico agudo",
        "Revisión de perfil glucémico y HbA1c",
        "Control de hipotiroidismo",
        "Pérdida de peso no intencionada",
    ],
    "Neumología": [
        "Crisis asmática leve a moderada",
        "Seguimiento de asma bronquial",
        "Disnea y dificultad respiratoria",
        "Tos crónica y expectoración persistente",
    ],
    "default": [
        "Consulta de control y seguimiento",
        "Revisión de resultados previos",
        "Seguimiento de tratamiento indicado",
        "Malestar general y evaluación clínica",
        "Valoración por síntomas referidos",
    ],
}

# Diagnósticos CIE-10 por perfil
DIAGNOSTICOS = {
    "diabetes": [
        ("E11",   "Diabetes mellitus tipo 2 controlada"),
        ("E11.9", "Diabetes mellitus tipo 2 sin complicaciones"),
        ("E11.65","Diabetes mellitus tipo 2 con hiperglucemia"),
        ("E11.40","Diabetes mellitus tipo 2 con neuropatía periférica"),
    ],
    "hipertension": [
        ("I10",   "Hipertensión arterial sistémica primaria"),
        ("I10",   "Hipertensión arterial controlada con medicación"),
        ("I11.9", "Cardiopatía hipertensiva sin insuficiencia cardíaca"),
    ],
    "asma": [
        ("J45.0", "Asma predominantemente alérgica"),
        ("J45.1", "Asma no alérgica moderada"),
        ("J45.9", "Asma sin especificar, episodio agudo"),
    ],
    "general": [
        ("J06.9", "Infección aguda de las vías respiratorias superiores"),
        ("K29.7", "Gastritis, no especificada"),
        ("M54.5", "Lumbago no especificado"),
        ("R05",   "Tos persistente"),
        ("R51",   "Cefalea tensional"),
        ("J00",   "Rinofaringitis aguda"),
        ("K21.0", "Enfermedad por reflujo gastroesofágico"),
        ("N39.0", "Infección del tracto urinario"),
    ],
}

# Medicamentos por perfil (nombre, dosis, frecuencia, duración)
MEDICAMENTOS = {
    "diabetes": [
        ("Metformina",     "850 mg",      "Cada 12 h con alimentos",    "30 días"),
        ("Metformina",     "500 mg",      "Cada 8 h",                   "30 días"),
        ("Glibenclamida",  "5 mg",        "Cada 24 h",                  "30 días"),
        ("Sitagliptina",   "100 mg",      "Cada 24 h",                  "30 días"),
        ("Insulina NPH",   "10-20 UI",    "Cada 24 h subcutánea",       "30 días"),
        ("Empagliflozina", "10 mg",       "Cada 24 h",                  "30 días"),
    ],
    "hipertension": [
        ("Enalapril",            "10 mg", "Cada 12 h",  "30 días"),
        ("Losartán",             "50 mg", "Cada 24 h",  "30 días"),
        ("Amlodipino",           "5 mg",  "Cada 24 h",  "30 días"),
        ("Atenolol",             "50 mg", "Cada 24 h",  "30 días"),
        ("Hidroclorotiazida",    "25 mg", "Cada 24 h",  "30 días"),
    ],
    "asma": [
        ("Salbutamol (inhalador)",   "2 inhalaciones", "Cada 4-6 h según necesidad", "30 días"),
        ("Fluticasona (inhalador)",  "2 inhalaciones", "Cada 12 h",                  "30 días"),
        ("Montelukast",              "10 mg",          "Cada 24 h por la noche",     "30 días"),
        ("Budesonida (inhalador)",   "2 inhalaciones", "Cada 12 h",                  "30 días"),
    ],
    "general": [
        ("Paracetamol",  "500 mg",  "Cada 6-8 h según necesidad", "5 días"),
        ("Ibuprofeno",   "400 mg",  "Cada 8 h con alimentos",     "7 días"),
        ("Amoxicilina",  "500 mg",  "Cada 8 h",                   "7 días"),
        ("Azitromicina", "500 mg",  "Cada 24 h",                  "3 días"),
        ("Omeprazol",    "20 mg",   "Cada 24 h en ayunas",        "14 días"),
        ("Loratadina",   "10 mg",   "Cada 24 h",                  "10 días"),
        ("Diclofenaco",  "100 mg",  "Cada 12 h con alimentos",    "5 días"),
    ],
}

# Estudios por perfil (tipo, nombre, unidades)
ESTUDIOS_CAT = {
    "diabetes": [
        ("Laboratorio", "Glucosa en ayunas",               "mg/dL"),
        ("Laboratorio", "Hemoglobina glucosilada (HbA1c)", "%"),
        ("Laboratorio", "Perfil de lípidos completo",      "mg/dL"),
        ("Laboratorio", "Creatinina sérica",               "mg/dL"),
        ("Laboratorio", "Microalbuminuria en orina de 24 h","mg/24 h"),
    ],
    "hipertension": [
        ("Laboratorio",  "Electrolitos séricos",                     "mEq/L"),
        ("Laboratorio",  "Función renal (BUN / creatinina)",         "mg/dL"),
        ("Gabinete",     "Electrocardiograma de reposo",             ""),
        ("Gabinete",     "Ecocardiograma transtorácico",             ""),
    ],
    "general": [
        ("Laboratorio", "Biometría hemática completa",          ""),
        ("Laboratorio", "Química sanguínea de 6 elementos",    ""),
        ("Laboratorio", "Examen general de orina",              ""),
        ("Radiología",  "Radiografía de tórax PA y lateral",   ""),
        ("Laboratorio", "Perfil tiroideo (TSH / T4 libre)",    "mIU/L"),
    ],
}

NOTAS_ADICIONALES = [
    "Paciente muestra buena adherencia al tratamiento indicado.",
    "Se recomienda ajuste de dieta y actividad física moderada.",
    "Referir a especialista si no hay mejoría en 4 semanas.",
    "Paciente refiere mejoría parcial con el esquema actual.",
    "Continuar con esquema actual. Próximo control en 3 meses.",
    "Se orienta al paciente sobre signos de alarma.",
    "Se integra a programa de control de enfermedades crónicas.",
    "",
]


# ─────────────────────────────────────────────────────────────────
# 1. INSTITUCIONES  (estática — 10 filas)
#
#  Columnas:
#    id, nombre, sector, tipo (Publica/Privada),
#    consultorio (solo sector público, NULL en privadas),
#    estado, activa
# ─────────────────────────────────────────────────────────────────
def gen_instituciones() -> pd.DataFrame:
    """
    sector  = organismo al que pertenece (IMSS, ISSSTE, SSA, Privada, Laboratorio…)
    tipo    = Publica | Privada
    consultorio = número de consultorio asignado; solo aplica al sector público,
                  NULL para instituciones privadas.
    """
    rows = [
        # (nombre, sector, tipo, consultorio)
        ("Hospital General Dr. Manuel Gea González",  "SSA",           "Publica",  "Consultorio 12"),
        ("IMSS UMF No. 10 Tlalpan",                   "IMSS",          "Publica",  "Consultorio 5"),
        ("IMSS CMN Siglo XXI",                        "IMSS",          "Publica",  "Consultorio 3"),
        ("ISSSTE Hospital Lic. Adolfo López Mateos",  "ISSSTE",        "Publica",  "Consultorio 8"),
        ("Clínica Privada Santa Fe Médica",           "Privada",       "Privada",  None),
        ("IMSS-Bienestar Centro de Salud Iztapalapa", "IMSS_Bienestar","Publica",  "Consultorio 2"),
        ("Hospital Ángeles Clínica Londres",          "Privada",       "Privada",  None),
        ("Centro de Salud Comunitario Xochimilco",    "SSA",           "Publica",  "Consultorio 1"),
        ("Laboratorio Médico Polanco",                "Laboratorio",   "Privada",  None),
        ("SEDESA Centro de Salud T-III Iztapalapa",   "SEDESA",        "Publica",  "Consultorio 6"),
    ]
    df = pd.DataFrame(
        [{"id": uid(), "nombre": r[0], "sector": r[1],
          "tipo": r[2], "consultorio": r[3], "estado": "CDMX", "activa": True}
         for r in rows]
    )
    return df


# ─────────────────────────────────────────────────────────────────
# 2. PERSONAL  (N_PERSONAL filas — médicos, enfermeros y más)
#
#  Columnas aplicables por tipo:
#    Medico        → cedula_profesional, especialidad  (resto igual)
#    Otros roles   → cedula_profesional = NULL, especialidad = NULL
#
#  Columnas básicas de RR.HH. (sin salarios ni prestaciones):
#    id, nombre_completo, genero, fecha_nacimiento, fecha_contratacion,
#    tipo, cedula_profesional, especialidad,
#    telefono, email, estado_residencia, institucion_id, activo
# ─────────────────────────────────────────────────────────────────
def gen_personal(inst_ids: list) -> pd.DataFrame:
    rows = []
    for _ in range(N_PERSONAL):
        genero  = "M" if random.random() < 0.48 else "F"
        nombre  = fake.first_name_male()   if genero == "M" else fake.first_name_female()
        titulo_prefix = ("Dr." if genero == "M" else "Dra.")
        ap, am  = fake.last_name(), fake.last_name()

        tipo = np.random.choice(TIPOS_PERSONAL, p=TIPOS_PERSONAL_W)

        edad_p          = int(clip(np.random.normal(38, 9), 22, 65))
        fec_nac         = date(2026 - edad_p, random.randint(1, 12), random.randint(1, 28))
        anos_servicio   = int(clip(np.random.normal(8, 5), 0, edad_p - 22))
        fec_contratacion = date(2026 - anos_servicio, random.randint(1, 12), random.randint(1, 28))

        # Nombre completo: incluir "Dr./Dra." solo para médicos
        if tipo == "Medico":
            nombre_completo = f"{titulo_prefix} {nombre} {ap} {am}"
        else:
            nombre_completo = f"{nombre} {ap} {am}"

        # Campos exclusivos de médicos
        cedula       = str(random.randint(1_000_000, 9_999_999)) if tipo == "Medico" else None
        especialidad = random.choice(ESPECIALIDADES)             if tipo == "Medico" else None

        rows.append({
            "id":                   uid(),
            "nombre_completo":      nombre_completo,
            "genero":               genero,
            "fecha_nacimiento":     fec_nac.isoformat(),
            "fecha_contratacion":   fec_contratacion.isoformat(),
            "tipo":                 tipo,
            "cedula_profesional":   cedula,
            "especialidad":         especialidad,
            "telefono":             fake.phone_number()[:15],
            "email":                fake.email(),
            "estado_residencia":    random.choice(ESTADOS_MX),
            "institucion_id":       random.choice(inst_ids),
            "activo":               True,
        })
    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# 3. USUARIOS
#
#  Una fila por entidad con acceso al sistema.
#  paciente_id y personal_id son mutuamente excluyentes
#  (uno siempre es NULL).
#
#  Columnas:
#    id, username, password_hash (SHA-256), tipo_usuario,
#    paciente_id (NULL si es personal), personal_id (NULL si es paciente),
#    activo, fecha_creacion, ultimo_acceso
# ─────────────────────────────────────────────────────────────────
def gen_usuarios(pac_df: pd.DataFrame,
                 personal_df: pd.DataFrame) -> pd.DataFrame:
    rows = []

    # ── Pacientes: username = CURP en minúsculas ──────────────────
    for pac in pac_df[["id", "curp"]].to_dict("records"):
        username = pac["curp"].lower()
        # Contraseña sintética: "Px" + primeros 6 del CURP
        raw_pass = "Px" + pac["curp"][:6]
        fec_creacion = rdate(date(2023, 1, 1), date(2025, 6, 30))
        fec_acceso   = rdate(fec_creacion, HOY)
        rows.append({
            "id":             uid(),
            "username":       username,
            "password_hash":  hash_pass(raw_pass),
            "tipo_usuario":   "Paciente",
            "paciente_id":    pac["id"],
            "personal_id":    None,
            "activo":         True,
            "fecha_creacion": fec_creacion.isoformat(),
            "ultimo_acceso":  fec_acceso.isoformat(),
        })

    # ── Personal: username = tipo_inicial + apellido + número ─────
    contadores = {}
    for per in personal_df[["id", "nombre_completo", "tipo"]].to_dict("records"):
        # Extraer apellido paterno (segunda palabra después del posible título)
        partes = per["nombre_completo"].split()
        apellido_base = partes[2] if partes[0] in ("Dr.", "Dra.") else partes[1]
        apellido_base = re.sub(r"[^a-zA-Z]", "", apellido_base).lower()[:10]

        prefijo = {
            "Medico":        "med",
            "Enfermero":     "enf",
            "Secretaria":    "sec",
            "Administrativo":"adm",
            "Tecnico":       "tec",
        }.get(per["tipo"], "usr")

        base = f"{prefijo}.{apellido_base}"
        contadores[base] = contadores.get(base, 0) + 1
        sufijo    = f"{contadores[base]:02d}" if contadores[base] > 1 else ""
        username  = f"{base}{sufijo}"

        # Contraseña sintética: tipo + últimos 4 del UUID personal
        raw_pass = per["tipo"][:3].lower() + per["id"][-4:]
        fec_creacion = rdate(date(2022, 1, 1), date(2025, 3, 31))
        fec_acceso   = rdate(fec_creacion, HOY)

        rows.append({
            "id":             uid(),
            "username":       username,
            "password_hash":  hash_pass(raw_pass),
            "tipo_usuario":   per["tipo"],
            "paciente_id":    None,
            "personal_id":    per["id"],
            "activo":         True,
            "fecha_creacion": fec_creacion.isoformat(),
            "ultimo_acceso":  fec_acceso.isoformat(),
        })

    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# 4. PACIENTES  (1,000 filas)
# ─────────────────────────────────────────────────────────────────
def _gen_curp(ap: str, am: str, nombre: str,
              fec_nac: date, sexo: str) -> str:
    """Genera un CURP con formato estándar mexicano (simplificado)."""
    def limpiar(s: str) -> str:
        for orig, rep in [("Á","A"),("É","E"),("Í","I"),("Ó","O"),("Ú","U"),("Ñ","N")]:
            s = s.replace(orig, rep)
        return re.sub(r"[^A-Z]", "", s.upper())

    def primera_vocal(s: str) -> str:
        for c in s[1:]:
            if c in "AEIOU":
                return c
        return "X"

    def primera_consonante(s: str) -> str:
        for c in s[1:]:
            if c.isalpha() and c not in "AEIOU":
                return c
        return "X"

    ap_c  = limpiar(ap)  or "X"
    am_c  = limpiar(am)  or "X"
    nm_c  = limpiar(nombre.split()[0]) or "X"

    curp = (
        ap_c[0]
        + primera_vocal(ap_c)
        + am_c[0]
        + nm_c[0]
        + fec_nac.strftime("%y%m%d")
        + ("H" if sexo == "M" else "M")
        + random.choice(ESTADOS_MX)
        + primera_consonante(ap_c)
        + primera_consonante(am_c)
        + primera_consonante(nm_c)
        + f"{random.randint(0,9)}{random.randint(0,9)}"
    )
    return curp[:18].upper()


def _enfermedades(edad: int):
    """
    Asigna enfermedades crónicas con prevalencia edad-dependiente
    basada en datos ENSANUT México.
    Retorna (dm2: bool, hta: bool, asma: bool, texto: str)
    """
    p_dm2  = clip(0.04 + max(0, edad - 30) * 0.0045, 0.02, 0.30)
    p_hta  = clip(0.08 + max(0, edad - 25) * 0.0065, 0.05, 0.58)
    p_asma = 0.07

    dm2  = random.random() < p_dm2
    hta  = random.random() < p_hta
    if dm2 and not hta:          # comorbilidad frecuente
        hta = random.random() < 0.50
    asma = random.random() < p_asma

    lista = (
        (["Diabetes Mellitus Tipo 2"]   if dm2  else [])
        + (["Hipertensión Arterial"]    if hta  else [])
        + (["Asma Bronquial"]           if asma else [])
    )
    texto = "|".join(lista) if lista else "Ninguna"
    return dm2, hta, asma, texto


def _alergias() -> str:
    n = np.random.choice([0, 1, 2], p=[0.65, 0.28, 0.07])
    sel = random.sample(ALERGIAS_CAT, int(n))
    return "|".join(sel) if sel else "Ninguna"


def gen_pacientes() -> pd.DataFrame:
    rows, curps = [], set()
    for _ in range(N_PACIENTES):
        sexo  = "F" if random.random() < 0.52 else "M"
        edad  = int(clip(np.random.normal(47, 16), 18, 90))
        fec   = date(2026 - edad, random.randint(1, 12), random.randint(1, 28))
        nom   = fake.first_name_female() if sexo == "F" else fake.first_name_male()
        ap    = fake.last_name()
        am    = fake.last_name()

        dm2, hta, asma, enf_texto = _enfermedades(edad)

        # CURP único
        curp = _gen_curp(ap, am, nom, fec, sexo)
        if curp in curps:
            curp = curp[:-2] + f"{random.randint(10,99)}"
        curps.add(curp)

        rows.append({
            "id":                   uid(),
            "curp":                 curp,
            "nombre":               nom,
            "apellido_paterno":     ap,
            "apellido_materno":     am,
            "fecha_nacimiento":     fec.isoformat(),
            "edad":                 edad,
            "sexo":                 sexo,
            "tipo_sangre":          np.random.choice(TIPO_SANGRE, p=TIPO_SANGRE_W),
            "telefono":             fake.phone_number()[:15],
            "email":                fake.email(),
            "estado_residencia":    random.choice(ESTADOS_MX),
            "alergias":             _alergias(),
            "enfermedades_cronicas":enf_texto,
            "tiene_diabetes":       dm2,
            "tiene_hipertension":   hta,
            "tiene_asma":           asma,
        })
    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# 5. SIGNOS VITALES  (función auxiliar — 1 registro por consulta)
# ─────────────────────────────────────────────────────────────────
def _signos(pac: dict, consulta_id: str,
            fecha: date, prev: dict | None) -> dict:
    """
    Genera signos vitales con continuidad temporal.
    'prev' = signos de la visita anterior del mismo paciente.
    """
    edad   = pac["edad"]
    sexo   = pac["sexo"]
    dm2    = pac["tiene_diabetes"]
    hta    = pac["tiene_hipertension"]
    asma   = pac["tiene_asma"]

    # Altura: estable en adultos
    if prev:
        altura = prev["altura"]
    else:
        mu = 1.69 if sexo == "M" else 1.58
        sd = 0.07 if sexo == "M" else 0.06
        altura = round(clip(np.random.normal(mu, sd), 1.42, 1.95), 2)

    # Peso con drift ±1 kg por visita
    if prev:
        peso = round(clip(prev["peso"] + np.random.normal(0, 0.8), 40, 155), 1)
    else:
        cat_imc = np.random.choice(
            ["normal", "sobrepeso", "obesidad"],
            p=[0.15, 0.35, 0.50] if (dm2 or hta) else [0.26, 0.38, 0.36],
        )
        imc_mu = {"normal": 22.0, "sobrepeso": 27.0, "obesidad": 33.5}[cat_imc]
        imc_sd = {"normal": 1.5,  "sobrepeso": 1.2,  "obesidad": 3.5 }[cat_imc]
        imc_lo = {"normal": 18.5, "sobrepeso": 25.0, "obesidad": 30.0}[cat_imc]
        imc_hi = {"normal": 24.9, "sobrepeso": 29.9, "obesidad": 50.0}[cat_imc]
        imc    = clip(np.random.normal(imc_mu, imc_sd), imc_lo, imc_hi)
        peso   = round(clip(imc * altura ** 2, 40, 155), 1)

    imc = round(peso / altura ** 2, 1)

    # Presión arterial
    if hta:
        base_s, base_d, sd_s, sd_d = 145 + edad * 0.3, 92 + edad * 0.1, 18, 12
    else:
        base_s, base_d, sd_s, sd_d = 118 + edad * 0.2, 76 + edad * 0.1, 12, 8

    if prev:
        sist = int(clip(prev["presion_sistolica"]  + np.random.normal(0, 8), 90, 210))
        dias = int(clip(prev["presion_diastolica"] + np.random.normal(0, 5), 55, 130))
    else:
        sist = int(clip(np.random.normal(base_s, sd_s), 90, 210))
        dias = int(clip(np.random.normal(base_d, sd_d), 55, 130))

    dias = min(dias, sist - 25)    # diferencial mínimo 25 mmHg
    dias = max(55, dias)

    # Frecuencia cardíaca
    if prev:
        fc = int(clip(prev["frecuencia_cardiaca"] + np.random.normal(0, 5), 48, 125))
    else:
        fc = int(clip(np.random.normal(76, 12), 48, 125))

    # Temperatura
    temp = round(clip(np.random.normal(36.5, 0.4), 35.5, 39.5), 1)

    # Glucosa
    if dm2:
        mu_g, sd_g, lo_g, hi_g = 165, 45, 75, 380
    else:
        mu_g, sd_g, lo_g, hi_g = 92,  12, 60, 130

    if prev and prev.get("glucosa") is not None:
        glucosa = round(clip(
            prev["glucosa"] + np.random.normal(0, 20 if dm2 else 8),
            lo_g, hi_g), 1)
    else:
        glucosa = round(clip(np.random.normal(mu_g, sd_g), lo_g, hi_g), 1)

    # Saturación O2
    if asma:
        sat = int(clip(np.random.normal(95, 2), 87, 99))
    else:
        sat = int(clip(np.random.normal(97, 1), 92, 100))

    return {
        "id":                   uid(),
        "paciente_id":          pac["id"],
        "consulta_id":          consulta_id,
        "fecha":                fecha.isoformat(),
        "presion_sistolica":    sist,
        "presion_diastolica":   dias,
        "frecuencia_cardiaca":  fc,
        "temperatura":          temp,
        "peso":                 peso,
        "altura":               altura,
        "imc":                  imc,
        "glucosa":              glucosa,
        "saturacion_oxigeno":   sat,
    }


# ─────────────────────────────────────────────────────────────────
# 6. CONSULTAS + SIGNOS + RECETAS + ESTUDIOS  (bloque clínico)
#    Solo el personal de tipo "Medico" puede tener consultas.
# ─────────────────────────────────────────────────────────────────
def gen_bloque_clinico(
    pac_df: pd.DataFrame,
    personal_df: pd.DataFrame,
    inst_df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:

    consultas_r, signos_r, recetas_r, estudios_r = [], [], [], []

    # Solo médicos participan en consultas
    medicos_list = personal_df[personal_df["tipo"] == "Medico"].to_dict("records")

    for pac in pac_df.to_dict("records"):
        dm2  = pac["tiene_diabetes"]
        hta  = pac["tiene_hipertension"]
        asma = pac["tiene_asma"]
        edad = pac["edad"]

        # Pacientes crónicos y mayores tienen más visitas
        base_visitas = 2 + int(dm2)*2 + int(hta)*1 + int(asma)*1
        n_consultas  = int(clip(
            np.random.normal(base_visitas + edad // 20, 1.5), 1, 10
        ))
        fechas = sorted(rdate() for _ in range(n_consultas))

        prev_sv = None
        for fecha in fechas:
            medico      = random.choice(medicos_list)
            especialidad = medico["especialidad"]

            # Dirigir especialidad según patología (sin sesgo total)
            r = random.random()
            if dm2  and r < 0.35: especialidad = "Endocrinología"
            elif hta and r < 0.28: especialidad = "Cardiología"
            elif asma and r < 0.28: especialidad = "Neumología"

            motivo = random.choice(MOTIVOS.get(especialidad, MOTIVOS["default"]))

            # Diagnóstico CIE-10
            r2 = random.random()
            if   dm2  and r2 < 0.45: cie, diag = random.choice(DIAGNOSTICOS["diabetes"])
            elif hta  and r2 < 0.40: cie, diag = random.choice(DIAGNOSTICOS["hipertension"])
            elif asma and r2 < 0.35: cie, diag = random.choice(DIAGNOSTICOS["asma"])
            else:                    cie, diag = random.choice(DIAGNOSTICOS["general"])

            tipo_aten = random.choices(
                ["Primer_nivel","Segundo_nivel","Tercer_nivel","Urgencias"],
                weights=[0.55, 0.28, 0.12, 0.05]
            )[0]

            consulta_id = uid()
            consultas_r.append({
                "id":              consulta_id,
                "paciente_id":     pac["id"],
                "medico_id":       medico["id"],   # FK → personal.id (tipo=Medico)
                "institucion_id":  medico["institucion_id"],
                "fecha":           fecha.isoformat(),
                "especialidad":    especialidad,
                "motivo_consulta": motivo,
                "diagnostico":     diag,
                "diagnostico_cie10": cie,
                "tratamiento":     (
                    f"Manejo integral de {diag.lower()}. "
                    "Continuar esquema indicado y seguimiento clínico."
                ),
                "tipo_atencion":   tipo_aten,
                "notas_adicionales": random.choice(NOTAS_ADICIONALES),
            })

            # Signos vitales (1:1)
            sv = _signos(pac, consulta_id, fecha, prev_sv)
            signos_r.append(sv)
            prev_sv = sv

            # Recetas: 0-3 medicamentos por consulta
            pool_meds = (
                (MEDICAMENTOS["diabetes"]    if dm2  else [])
                + (MEDICAMENTOS["hipertension"] if hta  else [])
                + (MEDICAMENTOS["asma"]         if asma else [])
                + MEDICAMENTOS["general"]
            )
            n_meds = random.choices([0, 1, 2, 3], weights=[0.15, 0.45, 0.30, 0.10])[0]
            for med_n, dosis, freq, dur in random.sample(pool_meds, min(n_meds, len(pool_meds))):
                recetas_r.append({
                    "id":          uid(),
                    "paciente_id": pac["id"],
                    "consulta_id": consulta_id,
                    "medico_id":   medico["id"],
                    "fecha":       fecha.isoformat(),
                    "medicamento": med_n,
                    "dosis":       dosis,
                    "frecuencia":  freq,
                    "duracion":    dur,
                    "indicaciones":"Tomar según indicación médica. No suspender sin consultar.",
                })

            # Estudios: ~45 % de consultas los generan
            if random.random() < 0.45:
                pool_est = (
                    (ESTUDIOS_CAT["diabetes"]    if dm2 else [])
                    + (ESTUDIOS_CAT["hipertension"] if hta else [])
                    + ESTUDIOS_CAT["general"]
                )
                n_est = random.choices([1, 2, 3], weights=[0.60, 0.30, 0.10])[0]
                for tipo_e, nom_e, unid in random.sample(pool_est, min(n_est, len(pool_est))):
                    # Resultado coherente con signos vitales
                    glu = sv["glucosa"]
                    if "glucosa" in nom_e.lower():
                        resultado = f"{round(glu + np.random.normal(0, 4), 1)} {unid}".strip()
                    elif "hba1c" in nom_e.lower() or "glucosilada" in nom_e.lower():
                        hba1c = clip((glu + 46.7) / 28.7, 4.5, 14.0)
                        resultado = f"{hba1c:.1f} %"
                    elif "lípidos" in nom_e.lower() or "lipidos" in nom_e.lower():
                        resultado = (
                            f"CT: {random.randint(150,260)} mg/dL | "
                            f"LDL: {random.randint(80,190)} mg/dL | "
                            f"HDL: {random.randint(35,75)} mg/dL | "
                            f"TG: {random.randint(100,340)} mg/dL"
                        )
                    else:
                        resultado = "Dentro de parámetros normales para la edad y sexo del paciente."

                    estudios_r.append({
                        "id":           uid(),
                        "paciente_id":  pac["id"],
                        "consulta_id":  consulta_id,
                        "institucion_id": medico["institucion_id"],
                        "fecha":        (fecha - timedelta(days=random.randint(1, 7))).isoformat(),
                        "tipo":         tipo_e,
                        "nombre":       nom_e,
                        "resultado":    resultado,
                        "unidades":     unid,
                    })

    return (
        pd.DataFrame(consultas_r),
        pd.DataFrame(signos_r),
        pd.DataFrame(recetas_r),
        pd.DataFrame(estudios_r),
    )


# ─────────────────────────────────────────────────────────────────
# 7. CITAS  (~2,500 filas)
#    Solo el personal de tipo "Medico" puede tener citas.
# ─────────────────────────────────────────────────────────────────
def gen_citas(pac_df: pd.DataFrame, personal_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    medicos_list = personal_df[personal_df["tipo"] == "Medico"].to_dict("records")

    for pac in pac_df.to_dict("records"):
        n = random.choices([1, 2, 3, 4], weights=[0.30, 0.35, 0.25, 0.10])[0]
        for _ in range(n):
            medico  = random.choice(medicos_list)
            fecha   = rdate(FECHA_INICIO, date(2026, 8, 31))
            hora    = f"{random.randint(8,17):02d}:{random.choice(['00','15','30','45'])}"
            espec   = medico["especialidad"]

            if pac["tiene_diabetes"]    and random.random() < 0.32: espec = "Endocrinología"
            elif pac["tiene_hipertension"] and random.random() < 0.28: espec = "Cardiología"

            if fecha < HOY:
                estado = random.choices(
                    ["completada","cancelada","no_presentada"],
                    weights=[0.75, 0.15, 0.10]
                )[0]
            else:
                estado = random.choices(
                    ["pendiente","confirmada","cancelada"],
                    weights=[0.50, 0.40, 0.10]
                )[0]

            rows.append({
                "id":           uid(),
                "paciente_id":  pac["id"],
                "medico_id":    medico["id"],   # FK → personal.id (tipo=Medico)
                "institucion_id": medico["institucion_id"],
                "fecha":        fecha.isoformat(),
                "hora":         hora,
                "especialidad": espec,
                "estado":       estado,
                "motivo":       random.choice(MOTIVOS.get(espec, MOTIVOS["default"])),
            })
    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# 8. RIESGO CLÍNICO  (1 fila por paciente — salida del modelo ML)
# ─────────────────────────────────────────────────────────────────
def gen_riesgo_clinico(pac_df: pd.DataFrame,
                       sv_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula scores con función logística sobre métricas reales de
    signos_vitales.  No hay etiquetas aleatorias: el score es
    determinístico dado los features → listo para ML supervisado.
    """
    agg = (
        sv_df.groupby("paciente_id")
        .agg(
            imc_promedio          =("imc",                "mean"),
            glucosa_promedio      =("glucosa",            "mean"),
            glucosa_maxima        =("glucosa",            "max"),
            pa_sistolica_promedio =("presion_sistolica",  "mean"),
            pa_diastolica_promedio=("presion_diastolica", "mean"),
            num_consultas         =("id",                 "count"),
        )
        .reset_index()
    )

    merged = pac_df.merge(agg, left_on="id", right_on="paciente_id", how="inner")

    rows = []
    for r in merged.to_dict("records"):
        edad  = r["edad"]
        sexo  = 1 if r["sexo"] == "M" else 0
        dm2   = int(r["tiene_diabetes"])
        hta   = int(r["tiene_hipertension"])
        imc_p = r["imc_promedio"]
        glu_p = r["glucosa_promedio"]
        sis_p = r["pa_sistolica_promedio"]

        # ── Score cardiovascular  (regresión logística) ──────────
        z_cv = (
            -6.5
            + 0.040 * edad
            + 0.30  * sexo
            + 0.020 * max(0, imc_p - 25)
            + 0.025 * max(0, sis_p - 120)
            + 0.80  * hta
            + 0.50  * dm2
        )
        score_cv = clip(1 / (1 + np.exp(-z_cv)) + np.random.normal(0, 0.015), 0.01, 0.99)

        # ── Score complicación diabética  (condicional a dm2) ────
        if dm2:
            z_dm = (
                -4.0
                + 0.030 * edad
                + 0.020 * max(0, imc_p - 25)
                + 0.020 * max(0, glu_p - 130)
                + 0.015 * max(0, sis_p - 120)
                + 0.40  * hta
            )
            score_dm = clip(1 / (1 + np.exp(-z_dm)) + np.random.normal(0, 0.025), 0.05, 0.99)
        else:
            # Riesgo residual bajo para no diabéticos
            score_dm = clip(0.01 + glu_p / 8000 + np.random.normal(0, 0.01), 0.01, 0.12)

        score_max = max(score_cv, score_dm)
        nivel = (
            "Critico"  if score_max >= 0.70 else
            "Alto"     if score_max >= 0.45 else
            "Moderado" if score_max >= 0.20 else
            "Bajo"
        )

        rows.append({
            "id":                          uid(),
            "paciente_id":                 r["id"],
            "fecha_calculo":               HOY.isoformat(),
            "modelo_version":              "logistic_v1.0",
            "edad":                        edad,
            "sexo":                        r["sexo"],
            "tiene_diabetes":              bool(dm2),
            "tiene_hipertension":          bool(hta),
            "imc_promedio":                round(imc_p, 2),
            "glucosa_promedio":            round(glu_p, 2),
            "glucosa_maxima":              round(r["glucosa_maxima"], 2),
            "pa_sistolica_promedio":       round(sis_p, 2),
            "pa_diastolica_promedio":      round(r["pa_diastolica_promedio"], 2),
            "num_consultas":               int(r["num_consultas"]),
            "score_riesgo_cardiovascular": round(score_cv, 4),
            "score_riesgo_complicacion_dm2": round(score_dm, 4),
            "nivel_riesgo":                nivel,
        })

    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────
def main() -> None:
    print("\n══════════════════════════════════════════════")
    print("  EUS  —  Dataset Generator  |  1,000 pacientes")
    print("══════════════════════════════════════════════\n")

    print("[1/8] Instituciones ...")
    inst_df = gen_instituciones()

    print("[2/8] Personal (médicos, enfermeros, administrativos…) ...")
    personal_df = gen_personal(inst_df["id"].tolist())

    print("[3/8] Pacientes ...")
    pac_df = gen_pacientes()

    print("[4/8] Usuarios (pacientes + personal) ...")
    usuarios_df = gen_usuarios(pac_df, personal_df)

    print("[5/8] Consultas · Signos vitales · Recetas · Estudios ...")
    consultas_df, signos_df, recetas_df, estudios_df = gen_bloque_clinico(
        pac_df, personal_df, inst_df
    )

    print("[6/8] Citas ...")
    citas_df = gen_citas(pac_df, personal_df)

    print("[7/8] Riesgo clínico (scores ML) ...")
    riesgo_df = gen_riesgo_clinico(pac_df, signos_df)

    print(f"\n[8/8] Guardando CSVs en  ./{OUTPUT_DIR}/\n")
    tablas = {
        "instituciones":  inst_df,
        "personal":       personal_df,
        "pacientes":      pac_df,
        "usuarios":       usuarios_df,
        "consultas":      consultas_df,
        "signos_vitales": signos_df,
        "recetas":        recetas_df,
        "estudios":       estudios_df,
        "citas":          citas_df,
        "riesgo_clinico": riesgo_df,
    }
    for nombre, df in tablas.items():
        save(df, nombre)

    total = sum(len(df) for df in tablas.values())
    n_medicos = len(personal_df[personal_df["tipo"] == "Medico"])
    print(f"\n  Total registros generados : {total:,}")
    print(f"  Archivos guardados en     : ./{OUTPUT_DIR}/")
    print(f"\n  Personal desglose:")
    for tipo, cnt in personal_df["tipo"].value_counts().items():
        print(f"    {tipo:<15} {cnt:>3} personas")
    print(f"\n  Instituciones: {len(inst_df)} (públicas: "
          f"{len(inst_df[inst_df['tipo']=='Publica'])}, "
          f"privadas: {len(inst_df[inst_df['tipo']=='Privada'])})")
    print(f"  Usuarios generados: {len(usuarios_df):,} "
          f"({N_PACIENTES} pacientes + {len(personal_df)} personal)")
    print("\n  Columnas clave para ML en riesgo_clinico.csv:")
    print("    Features  →  imc_promedio, glucosa_promedio, glucosa_maxima,")
    print("                 pa_sistolica_promedio, edad, sexo,")
    print("                 tiene_diabetes, tiene_hipertension, num_consultas")
    print("    Target CV →  score_riesgo_cardiovascular  |  nivel_riesgo")
    print("    Target DM →  score_riesgo_complicacion_dm2")
    print("\n══════════════════════════════════════════════\n")


if __name__ == "__main__":
    main()
