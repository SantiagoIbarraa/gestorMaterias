-- Hacer que id_profesor sea opcional en la tabla horario
ALTER TABLE horario ALTER COLUMN id_profesor DROP NOT NULL;
