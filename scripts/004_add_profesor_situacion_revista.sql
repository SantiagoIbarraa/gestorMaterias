-- Agregar campo situacion_revista a la tabla profesor
-- Valores permitidos: Titular, Provisional, Suplente
ALTER TABLE profesor 
ADD COLUMN IF NOT EXISTS situacion_revista VARCHAR(20) 
DEFAULT 'Suplente' 
CHECK (situacion_revista IN ('Titular', 'Provisional', 'Suplente'));

-- Agregar campo activo para soft delete
ALTER TABLE profesor 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Agregar campo dni que faltaba en el esquema original
ALTER TABLE profesor 
ADD COLUMN IF NOT EXISTS dni VARCHAR(20);

-- Actualizar profesores existentes con situacion_revista por defecto
UPDATE profesor SET situacion_revista = 'Titular' WHERE situacion_revista IS NULL;
