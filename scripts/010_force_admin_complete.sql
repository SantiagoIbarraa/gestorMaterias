-- Script DEFINITIVO para forzar que santyibarra123@gmail.com sea admin
-- Este script verifica TODO y fuerza el rol admin

-- =====================================================
-- PASO 1: Verificar que el usuario existe en auth.users
-- =====================================================
SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com';

-- Si no aparece nada aquí, el usuario NO EXISTE en Supabase Auth
-- Debes registrarte primero en la aplicación

-- =====================================================
-- PASO 2: Ver si existe en user_roles
-- =====================================================
SELECT 
    ur.id,
    ur.role,
    ur.created_at,
    ur.updated_at,
    u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- =====================================================
-- PASO 3: FORZAR el rol admin (INSERT o UPDATE)
-- =====================================================
-- Esto inserta si no existe, o actualiza si ya existe
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT 
    id, 
    'admin', 
    NOW(), 
    NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin', 
    updated_at = NOW();

-- =====================================================
-- PASO 4: Verificar que se aplicó correctamente
-- =====================================================
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at as role_created,
    ur.updated_at as role_updated
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- RESULTADO ESPERADO:
-- id: (UUID del usuario)
-- email: santyibarra123@gmail.com
-- role: admin  ← DEBE SER 'admin'
-- role_created: (fecha)
-- role_updated: (fecha reciente)

-- =====================================================
-- PASO 5: Ver TODAS las políticas RLS actuales
-- =====================================================
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
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- =====================================================
-- PASO 6: Ver si RLS está habilitado
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- =====================================================
-- PASO 7: Ver TODOS los usuarios y sus roles (debug)
-- =====================================================
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- DIAGNÓSTICO
-- =====================================================
-- Si después de ejecutar este script:
-- 
-- 1. PASO 1 no muestra nada:
--    → El usuario NO existe en Supabase Auth
--    → Debes registrarte en la aplicación primero
--
-- 2. PASO 4 muestra role = NULL:
--    → El INSERT/UPDATE falló
--    → Puede haber un problema de permisos
--
-- 3. PASO 4 muestra role = 'admin':
--    → ✅ El rol está correcto en la BD
--    → El problema está en el código de la aplicación
--
-- 4. PASO 5 muestra políticas restrictivas:
--    → RLS puede estar bloqueando el acceso
--    → Ejecuta el script 008_fix_rls_permissive.sql
