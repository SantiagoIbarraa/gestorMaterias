# Cambios: Fetch Directo a user_roles (Sin API Route)

## ✅ Cambios Realizados

Se eliminó el uso del API route `/api/auth/get-role` y ahora todos los componentes hacen **fetch directo** a la tabla `user_roles` de Supabase.

### Archivos Modificados

#### 1. **`components/header-user.tsx`**
**Antes:** Llamaba a `/api/auth/get-role` con token
**Ahora:** Fetch directo con `.from("user_roles").select("role")`

\`\`\`typescript
// Fetch directo a user_roles (RLS deshabilitado)
const { data: roleData, error: roleError } = await supabase
  .from("user_roles")
  .select("role")
  .eq("id", user.id)
  .single()

setRole(roleData?.role || "usuario")
\`\`\`

#### 2. **`app/auth/login/page.tsx`**
**Antes:** Llamaba a `/api/auth/get-role` con token
**Ahora:** Fetch directo después del login

\`\`\`typescript
// Fetch directo a user_roles (RLS deshabilitado)
const { data: roleData, error: roleError } = await supabase
  .from("user_roles")
  .select("role")
  .eq("id", user.id)
  .single()

const role = roleData?.role || "usuario"
\`\`\`

#### 3. **`app/admin/page.tsx`**
**Antes:** Llamaba a `/api/auth/get-role` con token
**Ahora:** Fetch directo para verificar acceso admin

\`\`\`typescript
// Fetch directo a user_roles (RLS deshabilitado)
const { data: roleData, error: roleError } = await supabase
  .from("user_roles")
  .select("role")
  .eq("id", user.id)
  .single()

if (roleData?.role !== "admin") {
  router.push("/dashboard")
}
\`\`\`

#### 4. **`app/page.tsx`**
**Antes:** Llamaba a `/api/auth/get-role`
**Ahora:** Fetch directo para redirección inicial

\`\`\`typescript
// Fetch directo a user_roles (RLS deshabilitado)
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("id", user.id)
  .single()

const role = roleData?.role || "usuario"
\`\`\`

## 🎯 Ventajas del Flujo Directo

### ✅ Pros
- **Más simple:** No necesita pasar tokens entre cliente y servidor
- **Menos código:** Elimina la capa intermedia del API route
- **Más rápido:** Una llamada menos (directo a Supabase)
- **Más fácil de debuggear:** Los errores se ven directamente en el cliente

### ⚠️ Requisitos
- **RLS debe estar deshabilitado** en `user_roles`
- Ejecutar: `scripts/006_lower_security_user_roles.sql`

## 🔍 Verificación

### Logs Esperados en la Consola del Navegador

**Login:**
\`\`\`
[Login] Role data: { userId: "...", email: "santyibarra123@gmail.com", role: "admin", roleError: null }
\`\`\`

**Header:**
\`\`\`
[Header] Role fetched: { role: "admin" }
\`\`\`

**Admin Page:**
\`\`\`
[Admin] Checking admin access: { userId: "...", email: "...", role: "admin", roleError: null }
\`\`\`

### Si Ves Errores

**Error 401 Unauthorized:**
- Significa que RLS sigue habilitado
- Ejecuta `scripts/006_lower_security_user_roles.sql`

**roleError: { code: "PGRST116", message: "..." }:**
- No existe el registro en `user_roles`
- Ejecuta `scripts/004_fix_admin_role.sql`

**role: null o role: "usuario":**
- El usuario no tiene rol asignado o es "usuario"
- Verifica en Supabase Table Editor → `user_roles`

## 🗑️ Archivos que Ya No Se Usan

El API route `/api/auth/get-role` ya no se usa, pero lo dejamos por si quieres volver a habilitar RLS en el futuro.

**Archivo:** `app/api/auth/get-role/route.ts`
- Puedes eliminarlo si estás seguro de mantener RLS deshabilitado
- O déjalo como backup para restaurar seguridad

## 🔄 Para Restaurar el Flujo con API Route

Si en el futuro quieres volver a usar el API route (con RLS habilitado):

1. Ejecuta `scripts/007_restore_security_user_roles.sql`
2. Revierte los cambios en los 4 archivos (usa git)
3. O contacta para revertir manualmente

## 📋 Checklist de Verificación

- [x] RLS deshabilitado en `user_roles`
- [x] `components/header-user.tsx` usa fetch directo
- [x] `app/auth/login/page.tsx` usa fetch directo
- [x] `app/admin/page.tsx` usa fetch directo
- [x] `app/page.tsx` usa fetch directo
- [ ] Probado: Login con admin muestra "admin" en header
- [ ] Probado: Acceso a `/admin` funciona sin errores
- [ ] Probado: No hay errores 401 en la consola

---

**Fecha:** 2024-11-07
**Cambio:** Simplificación del flujo de autenticación eliminando API route intermedio
