-- Script para ELIMINAR políticas problemáticas y crear unas simples
-- El error "role admin does not exist" viene de políticas mal configuradas

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all authenticated users to read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated to read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_roles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_roles;

-- =====================================================
-- PASO 2: DESHABILITAR RLS COMPLETAMENTE (más simple)
-- =====================================================
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: FORZAR que tu usuario sea admin
-- =====================================================
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- =====================================================
-- PASO 4: Verificar que RLS está deshabilitado
-- =====================================================
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- Debe mostrar: rls_enabled = false

-- =====================================================
-- PASO 5: Verificar que no hay políticas
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'user_roles';

-- Debe mostrar: 0 rows (sin políticas)

-- =====================================================
-- PASO 6: Verificar tu rol
-- =====================================================
SELECT 
    u.id,
    u.email,
    ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- Debe mostrar: role = admin

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- 1. RLS deshabilitado (rls_enabled = false)
-- 2. Sin políticas (0 rows)
-- 3. Tu usuario con role = admin
