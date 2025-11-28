-- Habilitar RLS en la tabla horario
ALTER TABLE horario ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva para ver horarios
CREATE POLICY "Permitir ver horarios a todos" ON horario
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política permisiva para insertar/modificar horarios (solo para admin/gestores en teoría, pero permisiva por ahora)
CREATE POLICY "Permitir modificar horarios a todos" ON horario
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
