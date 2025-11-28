-- Check constraints and columns for horario and profesor
SELECT 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_name IN ('horario', 'profesor');

-- Check columns data types
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('horario', 'profesor');

-- Check RLS policies
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('horario', 'profesor');
