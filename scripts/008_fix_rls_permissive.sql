-- Script para crear política RLS permisiva
-- Esto permite que cualquier usuario autenticado pueda leer todos los roles
-- Más seguro que deshabilitar RLS completamente

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all authenticated users to read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated to read all roles" ON public.user_roles;

-- 3. Crear política permisiva para SELECT (lectura)
-- Permite que cualquier usuario autenticado lea TODOS los roles
CREATE POLICY "Allow authenticated to read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política para service role (para INSERT/UPDAT E/DELETE)
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 6. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_roles';

-- 7. Asegurar que tu usuario tiene rol admin
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- 8. Verificación final
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- 9. Ver todos los usuarios y roles (para debug)
SELECT 
    u.email,
    ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
ORDER BY u.created_at DESC
LIMIT 10;
