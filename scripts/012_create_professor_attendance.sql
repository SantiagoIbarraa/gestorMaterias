-- Crear tabla de asistencias de profesores
CREATE TABLE IF NOT EXISTS asistencia_profesor (
  id_asistencia_profesor SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN DEFAULT TRUE,
  observacion VARCHAR(255),
  id_profesor INTEGER REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  id_materia INTEGER REFERENCES materia(id_materia) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS
ALTER TABLE asistencia_profesor ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (Permissive por ahora para facilitar desarrollo)
CREATE POLICY "Permitir todo a autenticados" ON asistencia_profesor
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
