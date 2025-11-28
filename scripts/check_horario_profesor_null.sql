SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'horario' AND column_name = 'id_profesor';
