"""
cargar_datos.py — Carga los CSVs de dataset_eus/ a PostgreSQL.
Lee credenciales del archivo .env del mismo directorio.

Uso:
    python cargar_datos.py
"""
import os, sys, time
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌  No se encontró DATABASE_URL en .env")
    sys.exit(1)

# Carpeta con los CSVs — sube un nivel desde eus-backend/
CSV_DIR = Path(__file__).parent.parent / "dataset_eus"

# Orden respetando claves foráneas
TABLAS = [
    ("instituciones", "id,nombre,sector,tipo,consultorio,estado,activa"),
    ("personal",      "id,nombre_completo,genero,fecha_nacimiento,fecha_contratacion,"
                      "tipo,cedula_profesional,especialidad,telefono,email,"
                      "estado_residencia,institucion_id,activo"),
    ("pacientes",     "id,curp,nombre,apellido_paterno,apellido_materno,fecha_nacimiento,"
                      "edad,sexo,tipo_sangre,telefono,email,estado_residencia,"
                      "alergias,enfermedades_cronicas,tiene_diabetes,tiene_hipertension,tiene_asma"),
    ("usuarios",      "id,username,password_hash,tipo_usuario,paciente_id,personal_id,"
                      "activo,fecha_creacion,ultimo_acceso"),
    ("consultas",     "id,paciente_id,medico_id,institucion_id,fecha,especialidad,"
                      "motivo_consulta,diagnostico,diagnostico_cie10,tratamiento,"
                      "tipo_atencion,notas_adicionales"),
    ("citas",         "id,paciente_id,medico_id,institucion_id,fecha,hora,"
                      "especialidad,estado,motivo"),
    ("signos_vitales","id,paciente_id,consulta_id,fecha,presion_sistolica,"
                      "presion_diastolica,frecuencia_cardiaca,temperatura,"
                      "peso,altura,imc,glucosa,saturacion_oxigeno"),
    ("riesgo_clinico","id,paciente_id,fecha_calculo,modelo_version,edad,sexo,"
                      "tiene_diabetes,tiene_hipertension,imc_promedio,glucosa_promedio,"
                      "glucosa_maxima,pa_sistolica_promedio,pa_diastolica_promedio,"
                      "num_consultas,score_riesgo_cardiovascular,"
                      "score_riesgo_complicacion_dm2,nivel_riesgo"),
    ("recetas",       "id,paciente_id,consulta_id,medico_id,fecha,medicamento,"
                      "dosis,frecuencia,duracion,indicaciones"),
    ("estudios",      "id,paciente_id,consulta_id,institucion_id,fecha,tipo,"
                      "nombre,resultado,unidades"),
]


def main():
    print(f"\n🚀  Cargando CSVs desde: {CSV_DIR}\n")
    t0 = time.time()

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    for tabla, columnas in TABLAS:
        csv_path = CSV_DIR / f"{tabla}.csv"
        if not csv_path.exists():
            print(f"  ⚠️   {tabla}.csv no encontrado — omitiendo")
            continue

        cur.execute(f"TRUNCATE TABLE {tabla} CASCADE;")
        sql = f"COPY {tabla} ({columnas}) FROM STDIN WITH CSV HEADER NULL ''"
        with open(csv_path, encoding="utf-8-sig") as f:   # utf-8-sig elimina el BOM
            cur.copy_expert(sql, f)

        cur.execute(f"SELECT COUNT(*) FROM {tabla};")
        count = cur.fetchone()[0]
        print(f"  ✓  {tabla:<22} {count:>6} filas")

    cur.close()
    conn.close()
    print(f"\n✅  Carga completada en {time.time()-t0:.2f}s\n")


if __name__ == "__main__":
    main()
