-- ============================================
-- INSTRUCCIONES PARA CONFIGURAR STORAGE
-- ============================================
-- 
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Navega a Storage en el menú lateral
-- 3. Haz clic en "Create a new bucket"
-- 4. Nombre del bucket: class-materials
-- 5. Public bucket: NO (desmarcado)
-- 6. Haz clic en "Create bucket"
-- 
-- Luego ejecuta las siguientes políticas RLS:
-- ============================================

-- Enable RLS on storage.objects (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Professors can upload files to their own subject folders
CREATE POLICY "Professors can upload to their subjects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'class-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT 'materia_' || m.id_materia::text
    FROM materia m
    JOIN profesor_materia pm ON m.id_materia = pm.id_materia
    JOIN profesor p ON pm.id_profesor = p.id_profesor
    WHERE p.user_id = auth.uid()
  )
);

-- Policy: Professors can view files from their subjects
CREATE POLICY "Professors can view their subject files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'class-materials' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT 'materia_' || m.id_materia::text
      FROM materia m
      JOIN profesor_materia pm ON m.id_materia = pm.id_materia
      JOIN profesor p ON pm.id_profesor = p.id_profesor
      WHERE p.user_id = auth.uid()
    )
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy: Professors can delete their own uploaded files
CREATE POLICY "Professors can delete their subject files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'class-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT 'materia_' || m.id_materia::text
    FROM materia m
    JOIN profesor_materia pm ON m.id_materia = pm.id_materia
    JOIN profesor p ON pm.id_profesor = p.id_profesor
    WHERE p.user_id = auth.uid()
  )
);

-- Policy: Admins have full access
CREATE POLICY "Admins have full access to class materials"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'class-materials' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'class-materials' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
