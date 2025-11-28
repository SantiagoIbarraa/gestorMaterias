-- Deshabilitar RLS en la tabla horario
ALTER TABLE horario DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en la tabla asistencia_profesor (para evitar problemas similares)
ALTER TABLE asistencia_profesor DISABLE ROW LEVEL SECURITY;
