-- Script final para asegurar que el usuario admin funcione
-- Este script es simple y directo

-- 1. Verificar que el usuario existe en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com';

-- 2. Insertar o actualizar el rol a admin
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 3. Verificación final
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at,
    ur.updated_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- RESULTADO ESPERADO:
-- email: santyibarra123@gmail.com
-- role: admin
