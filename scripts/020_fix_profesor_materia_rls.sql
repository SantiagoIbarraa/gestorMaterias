-- Asegurar que profesor_materia también tenga RLS configurado
ALTER TABLE profesor_materia ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON profesor_materia;
DROP POLICY IF EXISTS "Permitir todo a autenticados" ON profesor_materia;

-- Crear políticas permisivas
CREATE POLICY "Permitir lectura a autenticados" ON profesor_materia
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Permitir todo a autenticados" ON profesor_materia
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
