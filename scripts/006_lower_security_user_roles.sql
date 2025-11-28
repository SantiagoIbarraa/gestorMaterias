-- Script para BAJAR el nivel de seguridad de user_roles
-- ADVERTENCIA: Esto hace que la tabla sea más permisiva
-- Solo ejecutar si entiendes las implicaciones de seguridad

-- ========================================
-- OPCIÓN 1: DESHABILITAR RLS COMPLETAMENTE (MÁS PERMISIVO)
-- ========================================
-- Esto permite que cualquier cliente autenticado pueda leer user_roles

-- Deshabilitar RLS en user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_roles';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- 1. Verificar que tu usuario tiene el rol admin
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- 2. Si no existe o no es admin, actualizar
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

-- 3. Verificación final
SELECT 
    u.email,
    ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- ========================================
-- NOTA IMPORTANTE
-- ========================================
-- Con RLS deshabilitado, cualquier usuario autenticado puede:
-- - Leer todos los roles de todos los usuarios
-- - Potencialmente modificar roles (dependiendo de otras políticas)
--
-- Si quieres más seguridad en el futuro, ejecuta el script 007_restore_security.sql
