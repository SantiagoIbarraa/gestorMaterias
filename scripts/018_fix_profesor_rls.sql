-- Habilitar RLS en la tabla profesor
ALTER TABLE profesor ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON profesor;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON profesor;

-- Crear política permisiva para lectura (necesaria para el dropdown)
CREATE POLICY "Permitir lectura a autenticados" ON profesor
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política permisiva para inserción/actualización (si es necesario para admin)
CREATE POLICY "Permitir todo a admin" ON profesor
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
