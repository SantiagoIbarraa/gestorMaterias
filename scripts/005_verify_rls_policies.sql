-- Script para verificar y ajustar las políticas RLS de user_roles
-- Este script ayuda a diagnosticar problemas de autorización

-- 1. Ver las políticas actuales de user_roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- 2. Ver si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_roles';

-- 3. Verificar que las políticas existen y están correctas
-- Si no existen, crearlas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

-- Política para que los usuarios vean su propio rol
CREATE POLICY "Users can view their own role"
  ON public.user_roles 
  FOR SELECT
  USING (auth.uid() = id);

-- Política para que el service role pueda gestionar todos los roles
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles 
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Verificar que tu usuario tiene el rol admin
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    ur.role,
    ur.created_at as role_created,
    ur.updated_at as role_updated
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- 5. Si no existe el registro, insertarlo
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT 
    id, 
    'admin', 
    NOW(), 
    NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 6. Verificación final
SELECT 
    u.id,
    u.email,
    ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- 7. Verificar que auth.uid() funciona correctamente
-- Esta query debería devolver tu UUID si estás autenticado
SELECT auth.uid();

-- 8. Ver todos los usuarios y sus roles (para debug)
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
ORDER BY u.created_at DESC
LIMIT 10;
