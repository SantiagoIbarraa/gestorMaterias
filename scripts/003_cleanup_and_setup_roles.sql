-- Eliminar tabla users antigua si existe
DROP TABLE IF EXISTS public.users CASCADE;

-- Crear tabla user_roles limpia que referencia auth.users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario', 'profesor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean su propio rol
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = id);

-- Política para service role pueda gestionar todos los roles
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger que asigna admin a santyibarra123@gmail.com automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (id, role)
  VALUES (
    new.id,
    CASE 
      WHEN new.email = 'santyibarra123@gmail.com' THEN 'admin'
      ELSE 'usuario'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Crear trigger para ejecutar función cuando se registra usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
