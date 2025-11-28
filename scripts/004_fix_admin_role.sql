-- Script para verificar y actualizar el rol de admin para santyibarra123@gmail.com
-- Este script debe ejecutarse en Supabase SQL Editor

-- 1. Primero, verificar qué usuarios existen en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com';

-- 2. Verificar si existe el registro en user_roles
SELECT * 
FROM public.user_roles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'santyibarra123@gmail.com');

-- 3. Si existe, actualizar el rol a 'admin'
UPDATE public.user_roles 
SET role = 'admin', updated_at = NOW()
WHERE id IN (SELECT id FROM auth.users WHERE email = 'santyibarra123@gmail.com');

-- 4. Si NO existe, insertar el registro con rol 'admin'
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- 5. Verificar que el cambio se aplicó correctamente
SELECT u.id, u.email, ur.role, ur.updated_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- 6. Opcional: Ver todos los roles actuales
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.id
ORDER BY ur.created_at DESC;
