-- Crear tabla de usuarios con roles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'alumno', 'profesor')),
  nombre VARCHAR(100) NOT NULL,
  genero VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de alumnos
CREATE TABLE IF NOT EXISTS alumno (
  id_alumno SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  genero VARCHAR(20),
  email VARCHAR(30) NOT NULL,
  direccion VARCHAR(50),
  telefono INTEGER,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla de profesores
CREATE TABLE IF NOT EXISTS profesor (
  id_profesor SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  genero VARCHAR(20),
  email VARCHAR(30) NOT NULL,
  direccion VARCHAR(50),
  telefono INTEGER
);

-- Crear tabla de cursos
CREATE TABLE IF NOT EXISTS curso (
  id_curso SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  nivel VARCHAR(30),
  año INTEGER
);

-- Crear tabla de materias
CREATE TABLE IF NOT EXISTS materia (
  id_materia SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  descripcion VARCHAR(30),
  carga_horaria VARCHAR(30),
  id_curso INTEGER REFERENCES curso(id_curso)
);

-- Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificacion (
  id_calificacion SERIAL PRIMARY KEY,
  nota VARCHAR(30),
  fecha DATE,
  tipo_evaluacion VARCHAR(30),
  id_alumno INTEGER REFERENCES alumno(id_alumno),
  id_profesor INTEGER REFERENCES profesor(id_profesor)
);

-- Crear tabla de asistencias
CREATE TABLE IF NOT EXISTS asistencia (
  id_asistencia SERIAL PRIMARY KEY,
  fecha DATE,
  presente BOOLEAN,
  justificacion VARCHAR(100),
  id_alumno INTEGER REFERENCES alumno(id_alumno),
  id_profesor INTEGER REFERENCES profesor(id_profesor)
);

-- Crear tabla de horarios
CREATE TABLE IF NOT EXISTS horario (
  id_horario SERIAL PRIMARY KEY,
  dia VARCHAR(30),
  hora_inicio TIME,
  hora_fin TIME,
  id_curso INTEGER REFERENCES curso(id_curso)
);

-- Crear tabla de relación alumno-curso
CREATE TABLE IF NOT EXISTS alumno_curso (
  id_alumno INTEGER REFERENCES alumno(id_alumno),
  id_curso INTEGER REFERENCES curso(id_curso),
  PRIMARY KEY (id_alumno, id_curso)
);

-- Crear tabla de relación profesor-materia
CREATE TABLE IF NOT EXISTS profesor_materia (
  id_profesor INTEGER REFERENCES profesor(id_profesor),
  id_materia INTEGER REFERENCES materia(id_materia),
  PRIMARY KEY (id_profesor, id_materia)
);

-- Insertar usuario admin
INSERT INTO users (email, password_hash, role, nombre, genero)
VALUES ('santyibarra123@gmail.com', '$2b$10$YXJkUW9yZGhJOktQT2RFCi9MNEJUaWVXM0dGQjBsUnp3UzZzbGQ2bS4', 'admin', 'Admin EEST1VL', 'M')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo - Cursos
INSERT INTO curso (nombre, nivel, año) VALUES
('1° Año - Electrónica', '1°', 2024),
('2° Año - Electrónica', '2°', 2024),
('1° Año - Informática', '1°', 2024),
('2° Año - Informática', '2°', 2024)
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo - Profesores
INSERT INTO profesor (nombre, genero, email, direccion, telefono) VALUES
('Prof. García', 'M', 'garcia@eest1.edu', 'Calle 1', 1234567),
('Prof. López', 'F', 'lopez@eest1.edu', 'Calle 2', 1234568),
('Prof. Martínez', 'M', 'martinez@eest1.edu', 'Calle 3', 1234569)
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo - Materias
INSERT INTO materia (nombre, descripcion, carga_horaria, id_curso) VALUES
('Matemática', 'Álgebra y Geometría', '4 hs', 1),
('Física', 'Mecánica y Energía', '4 hs', 1),
('Electrónica Básica', 'Componentes y Circuitos', '6 hs', 1)
ON CONFLICT DO NOTHING;
