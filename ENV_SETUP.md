# Configuración de Variables de Entorno

Para que el API route `/api/auth/get-role` funcione correctamente, necesitas configurar las variables de entorno.

## Crear archivo `.env.local`

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# IMPORTANTE: Service Role Key (necesaria para bypasear RLS)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
\`\`\`

## Dónde encontrar las keys

1. Ve a tu proyecto en **Supabase Dashboard**
2. Navega a **Settings** → **API**
3. Encontrarás:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRETO**

## ⚠️ IMPORTANTE

- **NUNCA** compartas el `SUPABASE_SERVICE_ROLE_KEY` públicamente
- **NUNCA** lo subas a GitHub
- El archivo `.env.local` ya está en `.gitignore` por defecto

## Verificar que funciona

Después de configurar el `.env.local`:

1. **Reinicia el servidor** de desarrollo:
   \`\`\`bash
   # Detén el servidor (Ctrl + C)
   # Vuelve a iniciarlo
   npm run dev
   \`\`\`

2. **Verifica en la consola del servidor** que no haya errores de variables de entorno

3. **Inicia sesión** en la aplicación y verifica los logs en la consola del navegador

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is undefined"

**Solución:**
1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
2. Verifica que la variable está escrita correctamente (sin espacios)
3. Reinicia el servidor de desarrollo

### Error: "Invalid API key"

**Solución:**
1. Verifica que copiaste la key completa (sin espacios al inicio/final)
2. Verifica que estás usando la **service_role key**, no la anon key
3. Verifica que el proyecto de Supabase está activo
