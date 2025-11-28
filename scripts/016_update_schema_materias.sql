-- Agregar columna id_materia a la tabla horario
ALTER TABLE horario ADD COLUMN IF NOT EXISTS id_materia INTEGER REFERENCES materia(id_materia);

-- Crear tabla de contenido de clases
CREATE TABLE IF NOT EXISTS contenido_clase (
  id_contenido SERIAL PRIMARY KEY,
  id_materia INTEGER REFERENCES materia(id_materia) ON DELETE CASCADE,
  id_profesor INTEGER REFERENCES profesor(id_profesor),
  fecha DATE NOT NULL,
  descripcion TEXT,
  archivo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS para contenido_clase
ALTER TABLE contenido_clase ENABLE ROW LEVEL SECURITY;

-- Política permisiva para contenido_clase (por ahora, luego restringir)
CREATE POLICY "Permitir todo en contenido_clase" ON contenido_clase
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
