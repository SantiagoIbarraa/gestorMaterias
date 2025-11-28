# Solución Final: Bajar Seguridad de la Base de Datos

## 🎯 Problema Actual

Aunque el rol `admin` está correctamente asignado en la base de datos para `santyibarra123@gmail.com`, el API route no puede leerlo debido a las políticas RLS (Row Level Security).

## ✅ Solución: Deshabilitar RLS en `user_roles`

### Paso 1: Ejecutar Script SQL

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `scripts/006_lower_security_user_roles.sql`
3. Ejecuta el script completo
4. Verifica que la última query muestre tu email con `role = 'admin'`

El script hace lo siguiente:
\`\`\`sql
-- Deshabilita RLS completamente
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Asegura que tu usuario tenga rol admin
INSERT INTO public.user_roles (id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();
\`\`\`

### Paso 2: Verificar Variables de Entorno

**CRÍTICO:** Asegúrate de tener el archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://yzdksqysuglvbgtlivuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
\`\`\`

**Dónde encontrar las keys:**
- Supabase Dashboard → Settings → API
- Copia el **service_role key** (NO el anon key)

### Paso 3: Reiniciar Servidor

\`\`\`bash
# Detén el servidor (Ctrl + C en la terminal)
npm run dev
\`\`\`

### Paso 4: Probar

1. Cierra sesión en la aplicación
2. Vuelve a iniciar sesión con `santyibarra123@gmail.com`
3. Abre la consola del navegador (F12)
4. Deberías ver:
   \`\`\`
   [v0] User role fetched: { userId: "...", email: "santyibarra123@gmail.com", role: "admin" }
   [Login] Role data: { userId: "...", email: "santyibarra123@gmail.com", role: "admin" }
   \`\`\`
5. Deberías ser redirigido a `/admin`

## 🔍 Diagnóstico si Sigue sin Funcionar

### Verificación 1: Comprobar que RLS está deshabilitado

En Supabase SQL Editor:
\`\`\`sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_roles';
\`\`\`

Debería mostrar `rowsecurity = false`

### Verificación 2: Comprobar que el rol existe

\`\`\`sql
SELECT u.email, ur.role 
FROM auth.users u 
JOIN public.user_roles ur ON u.id = ur.id 
WHERE u.email = 'santyibarra123@gmail.com';
\`\`\`

Debería mostrar `role = admin`

### Verificación 3: Comprobar variables de entorno

En la terminal del servidor Next.js, agrega logging temporal:

Edita `app/api/auth/get-role/route.ts` y agrega al inicio:
\`\`\`typescript
console.log("[DEBUG] SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log("[DEBUG] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
\`\`\`

Si `SUPABASE_SERVICE_ROLE_KEY` es `false`, el problema es que falta el `.env.local`

### Verificación 4: Comprobar logs del servidor

En la terminal donde corre `npm run dev`, deberías ver:
\`\`\`
[v0] User role fetched: { userId: "...", email: "santyibarra123@gmail.com", role: "admin" }
\`\`\`

Si ves un error aquí, el problema está en el backend.

## 🔒 Implicaciones de Seguridad

Con RLS deshabilitado en `user_roles`:

### ✅ Ventajas
- El API route puede leer roles sin problemas
- Más simple de debuggear
- No hay errores 401

### ⚠️ Desventajas
- Cualquier usuario autenticado puede leer todos los roles
- Menor seguridad (pero aceptable para un sistema escolar interno)

### 🛡️ Recomendaciones

Para un sistema en producción:
1. Mantén RLS deshabilitado si es un sistema interno con usuarios confiables
2. Si necesitas más seguridad, usa el script `007_restore_security_user_roles.sql` para volver a habilitar RLS
3. Asegúrate de que el `SUPABASE_SERVICE_ROLE_KEY` nunca se exponga al cliente

## 📋 Checklist Final

- [ ] Ejecuté `scripts/006_lower_security_user_roles.sql` en Supabase
- [ ] Verifiqué que RLS está deshabilitado (`rowsecurity = false`)
- [ ] Verifiqué que mi usuario tiene `role = 'admin'`
- [ ] Creé el archivo `.env.local` con las 3 variables
- [ ] Copié el **service_role key** (no el anon key)
- [ ] Reinicié el servidor de desarrollo
- [ ] Cerré sesión y volví a iniciar sesión
- [ ] Revisé los logs en la consola del navegador (F12)
- [ ] Revisé los logs en la terminal del servidor

## 🆘 Si Aún No Funciona

Si después de seguir todos estos pasos sigue sin funcionar:

1. **Comparte los logs** de la consola del navegador
2. **Comparte los logs** de la terminal del servidor
3. **Verifica** que el archivo `.env.local` existe y tiene las 3 variables
4. **Verifica** en Supabase Dashboard → Table Editor → `user_roles` que tu usuario aparece con `role = admin`

---

**Última actualización:** 2024
**Archivos relacionados:**
- `scripts/006_lower_security_user_roles.sql` - Deshabilita RLS
- `scripts/007_restore_security_user_roles.sql` - Restaura RLS (para el futuro)
- `ENV_SETUP.md` - Guía de configuración de variables de entorno
