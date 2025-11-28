-- Eliminar tabla anterior y recrear con estructura correcta
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'alumno', 'profesor')),
  nombre VARCHAR(100) NOT NULL,
  genero VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario admin con contraseña hasheada con bcrypt
-- Contraseña: admin123
INSERT INTO users (email, password_hash, role, nombre, genero)
VALUES ('santyibarra123@gmail.com', '$2b$10$YXJkUW9yZGhJOktQT2RFCi9MNEJUaWVXM0dGQjBsUnp3UzZzbGQ2bS4', 'admin', 'Admin EEST1VL', 'M');
