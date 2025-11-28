-- Agregar columna user_id a la tabla profesor
ALTER TABLE profesor ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Intentar vincular profesores existentes con usuarios por email
UPDATE profesor
SET user_id = au.id
FROM auth.users au
WHERE profesor.email = au.email;

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_profesor_user_id ON profesor(user_id);
