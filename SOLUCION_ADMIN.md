# Solución: Problema de Acceso Admin

## Problema Identificado

**Problema Principal:** Error 401 (Unauthorized) al intentar acceder a `user_roles` desde el cliente.

**Causa Raíz:** Las políticas RLS (Row Level Security) de Supabase bloquean el acceso directo desde el cliente a la tabla `user_roles`.

**Solución Implementada:** Usar el API route `/api/auth/get-role` que utiliza el service role para bypasear RLS.

## Confirmación de la Tabla Correcta

✅ **La aplicación SÍ está usando la tabla `user_roles`** correctamente:

- **Tabla:** `public.user_roles`
- **Columna:** `role`
- **Valor requerido para admin:** `'admin'`
- **Relación:** `id` (UUID) que referencia `auth.users(id)`

## Cambios Realizados

### 1. Rol por Defecto Cambiado
- ❌ Antes: `'alumno'`
- ✅ Ahora: `'usuario'`

### 2. Archivos Actualizados

#### Código TypeScript:
- `app/api/auth/get-role/route.ts` - Rol por defecto: `'usuario'` + logging mejorado
- `app/auth/login/page.tsx` - **CORREGIDO**: Ahora usa API route en lugar de query directa
- `app/admin/page.tsx` - **CORREGIDO**: Ahora usa API route en lugar de query directa
- `components/header-user.tsx` - Rol por defecto: `'usuario'` + logging mejorado

#### Scripts SQL:
- `scripts/003_create_user_roles_table.sql` - DEFAULT cambiado a `'usuario'`
- `scripts/003_cleanup_and_setup_roles.sql` - DEFAULT cambiado a `'usuario'`
- `scripts/004_fix_admin_role.sql` - **NUEVO** script para actualizar tu usuario
- `scripts/005_verify_rls_policies.sql` - **NUEVO** script para verificar políticas RLS

### 3. Logging Agregado

Ahora verás en la consola del navegador (F12):
\`\`\`
[Login] Role data: { userId: "...", email: "...", role: "..." }
[Admin] Checking admin access: { userId: "...", email: "...", role: "..." }
[Header] Role fetched: { role: "..." }
\`\`\`

Y en el servidor (terminal donde corre Next.js):
\`\`\`
[v0] User role fetched: { userId: "...", email: "...", role: "..." }
\`\`\`

## Pasos para Solucionar

### Opción 1: Ejecutar Script SQL en Supabase (RECOMENDADO)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor**
3. Abre el archivo `scripts/004_fix_admin_role.sql`
4. Copia y pega el contenido completo en el editor SQL
5. Ejecuta el script (botón "Run")
6. Verifica que la última query muestre tu email con `role = 'admin'`

### Opción 2: Actualización Manual

Si prefieres hacerlo manualmente en Supabase:

1. Ve a **Table Editor** → `user_roles`
2. Busca tu usuario por el `id` (UUID de auth.users)
3. Si existe:
   - Edita el campo `role` y cambia a `'admin'`
4. Si NO existe:
   - Inserta un nuevo registro:
     - `id`: el UUID de tu usuario en `auth.users`
     - `role`: `'admin'`

### Opción 3: Verificar desde SQL Editor

Ejecuta estas queries para diagnosticar:

\`\`\`sql
-- Ver tu usuario en auth.users
SELECT id, email FROM auth.users WHERE email = 'santyibarra123@gmail.com';

-- Ver tu rol actual
SELECT ur.* 
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.id
WHERE u.email = 'santyibarra123@gmail.com';

-- Si no existe, insertar
INSERT INTO public.user_roles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'santyibarra123@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
\`\`\`

## Verificación

Después de ejecutar el script:

1. **Cierra sesión** en la aplicación
2. **Vuelve a iniciar sesión** con `santyibarra123@gmail.com`
3. Abre la **consola del navegador** (F12)
4. Deberías ver:
   \`\`\`
   [Login] Role data: { ..., roleData: { role: "admin" }, roleError: null }
   \`\`\`
5. Deberías ser redirigido a `/admin` automáticamente
6. En el header debería aparecer **"admin"** en lugar de "alumno" o "usuario"

## Explicación del Error 401 (Unauthorized)

### ¿Por qué ocurría?

El error que viste:
\`\`\`
GET https://yzdksqysuglvbgtlivuz.supabase.co/rest/v1/user_roles?select=role&id=eq.f4a03990-ece8-4f80-84ad-0c433bc48aba 401 (Unauthorized)
\`\`\`

Ocurría porque:

1. **El cliente de Supabase** intentaba hacer una query directa a `user_roles`
2. **Las políticas RLS** requieren que `auth.uid() = id` para leer
3. **El contexto de autenticación** no se estaba pasando correctamente en la query

### ¿Cómo se solucionó?

✅ **Solución implementada:**
- Ahora usamos el **API route** `/api/auth/get-role`
- Este endpoint usa el **service role** de Supabase (bypasea RLS)
- El cliente solo necesita pasar el **access token** en el header `Authorization`

### Flujo Correcto

\`\`\`
Cliente → fetch("/api/auth/get-role", { headers: { Authorization: "Bearer <token>" } })
         ↓
API Route → createAdminClient() (usa service role)
         ↓
Supabase → SELECT role FROM user_roles WHERE id = <user_id>
         ↓
Respuesta → { role: "admin" }
\`\`\`

## Posibles Problemas y Soluciones

### Problema: "No tengo acceso al SQL Editor"
**Solución:** Verifica que tienes permisos de administrador en tu proyecto de Supabase.

### Problema: "El script dice que no existe el usuario"
**Solución:** 
1. Verifica que te hayas registrado correctamente en la aplicación
2. Revisa la tabla `auth.users` para confirmar que tu email existe
3. Si no existe, regístrate nuevamente desde `/auth/sign-up`

### Problema: "Sigo viendo 'alumno' o 'usuario'"
**Solución:**
1. Limpia la caché del navegador (Ctrl + Shift + Delete)
2. Cierra todas las pestañas de la aplicación
3. Vuelve a abrir e iniciar sesión
4. Revisa los logs en la consola del navegador

### Problema: "Me redirige a /dashboard en lugar de /admin"
**Solución:**
1. Verifica en la consola qué rol está detectando
2. Ejecuta la query de verificación en Supabase:
   \`\`\`sql
   SELECT u.email, ur.role 
   FROM auth.users u 
   LEFT JOIN public.user_roles ur ON u.id = ur.id 
   WHERE u.email = 'santyibarra123@gmail.com';
   \`\`\`
3. Si el rol NO es 'admin', ejecuta el UPDATE manualmente

## Seguridad de la Base de Datos

### Row Level Security (RLS)

La tabla `user_roles` tiene RLS habilitado con estas políticas:

1. **"Users can view their own role"** - Los usuarios solo pueden ver su propio rol
2. **"Service role can manage all roles"** - Solo el service role puede modificar roles

### Recomendaciones de Seguridad

✅ **Buenas prácticas implementadas:**
- RLS habilitado en `user_roles`
- Los usuarios no pueden modificar su propio rol
- Solo el backend con service role puede cambiar roles

⚠️ **Mejoras sugeridas:**
1. Crear una tabla de auditoría para cambios de roles
2. Implementar un panel de administración para gestionar roles
3. Agregar validación de permisos en todas las rutas API
4. Considerar usar middleware de Next.js para proteger rutas

## Contacto

Si después de seguir estos pasos sigues teniendo problemas:

1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs en Supabase Dashboard → Logs
3. Verifica que las políticas RLS no estén bloqueando el acceso
4. Confirma que estás usando el service role key en el backend

---

**Última actualización:** 2024
**Versión:** 1.0
