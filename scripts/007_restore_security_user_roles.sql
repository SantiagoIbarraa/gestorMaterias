-- Script para RESTAURAR la seguridad de user_roles
-- Ejecutar este script solo si previamente ejecutaste 006_lower_security_user_roles.sql
-- y ahora quieres volver a tener RLS habilitado

-- ========================================
-- HABILITAR RLS NUEVAMENTE
-- ========================================

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RECREAR POLÍTICAS RLS
-- ========================================

-- Eliminar políticas existentes (por si acaso)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read all roles" ON public.user_roles;

-- Política 1: Los usuarios pueden ver su propio rol
CREATE POLICY "Users can view their own role"
  ON public.user_roles 
  FOR SELECT
  USING (auth.uid() = id);

-- Política 2: El service role puede gestionar todos los roles
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles 
  FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- Ver si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_roles';

-- ========================================
-- NOTA
-- ========================================
-- Con RLS habilitado:
-- - Los usuarios solo pueden ver su propio rol
-- - El service role (backend) puede ver y modificar todos los roles
-- - Esto es más seguro pero requiere usar el API route para obtener roles
