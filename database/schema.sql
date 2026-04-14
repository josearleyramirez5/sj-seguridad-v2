CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SUPERVISOR', 'GUARD')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reportes
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  locacion VARCHAR(255),
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  fecha TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rondas
CREATE TABLE IF NOT EXISTS rondas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  locacion VARCHAR(255),
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  fecha TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incidencias
CREATE TABLE IF NOT EXISTS incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  locacion VARCHAR(255),
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  severidad VARCHAR(20) CHECK (severidad IN ('BAJA', 'MEDIA', 'ALTA')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ubicaciones
CREATE TABLE IF NOT EXISTS ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  titulo VARCHAR(255),
  descripcion TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_reportes_supervisor_id ON reportes(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_rondas_supervisor_id ON rondas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_supervisor_id ON incidencias(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_usuario_id ON ubicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);

-- Usuario admin de ejemplo (contraseña: Admin123!!)
INSERT INTO usuarios (email, password_hash, nombre, role, is_active)
VALUES (
  'admin@sjseguridad.com',
  '$2a$10$kFq1HAw5hlhnd31dDF9LZeM70Jp3GvUUR/wRMF3/47He8IYXROrMm',
  'Administrador',
  'SUPER_ADMIN',
  TRUE
) ON CONFLICT (email) DO NOTHING;
