-- Habilitar RLS en la tabla horario
ALTER TABLE horario ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON horario;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON horario;

-- Crear política permisiva para lectura
CREATE POLICY "Permitir lectura a autenticados" ON horario
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política permisiva para inserción/actualización/eliminación
CREATE POLICY "Permitir todo a autenticados" ON horario
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
