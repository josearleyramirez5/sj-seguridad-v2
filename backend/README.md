# SJ Seguridad v2 - Backend + PostgreSQL

Backend moderno con Express, PostgreSQL y JWT.

## 📋 Requisitos

- Node.js 16+
- PostgreSQL 12+ (local o en Railway)
- npm o yarn

---

## 🚀 INSTALACIÓN PASO A PASO

### PASO 1: Instalar Dependencias

```bash
cd backend
npm install
```

### PASO 2: Crear Base de Datos PostgreSQL Local

#### **En Windows (PowerShell):**

```bash
# Instalar PostgreSQL si no lo tienes
# Descargar de: https://www.postgresql.org/download/windows/
# Luego ejecutar el instalador

# Abrir psql (línea de comandos de PostgreSQL)
psql -U postgres

# Dentro de psql:
CREATE DATABASE sj_security;
\q

# Salir de psql
```

#### **Alternativa: Usar Docker (Recomendado)**

```bash
# Instalar Docker Desktop: https://www.docker.com/products/docker-desktop

# Ejecutar PostgreSQL en Docker
docker run --name sj-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sj_security \
  -p 5432:5432 \
  -d postgres:15
```

### PASO 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
# DATABASE_SSL=false
# JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
# PORT=5000
```

### PASO 4: Ejecutar Schema SQL

```bash
# Aplicar el schema a la base de datos
psql -U postgres -d sj_security -f ../database/schema.sql
```

### PASO 5: Iniciar el Servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# O build + start
npm run build
npm start
```

**Debe mostrar:**
```
🚀 Server running on http://localhost:5000
📊 Database: postgresql://...
```

El backend expone ambos health checks:

```text
GET /health
GET /api/health
```

---

## 🔌 ENDPOINTS API

### **Auth (Sin Token Requerido)**

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sjseguridad.com",
  "password": "Admin123!!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "nombre": "Administrador",
    "email": "admin@sjseguridad.com",
    "role": "SUPER_ADMIN"
  }
}

# Register (Solo SUPER_ADMIN)
POST /api/auth/register
Authorization: Bearer <token>
X-User-Id: <admin_id>
Content-Type: application/json

{
  "email": "supervisor@sjseguridad.com",
  "password": "TempPass123!!",
  "nombre": "Juan Supervisor",
  "role": "SUPERVISOR"
}
```

### **Usuarios (Token Requerido)**

```bash
# Obtener todos los usuarios (Solo SUPER_ADMIN)
GET /api/users
Authorization: Bearer <token>

# Obtener usuarios por rol
GET /api/users/by-role/SUPERVISOR
Authorization: Bearer <token>

# Mi perfil
GET /api/users/profile/me
Authorization: Bearer <token>

# Actualizar usuario (Solo SUPER_ADMIN)
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Nuevo Nombre",
  "role": "SUPERVISOR",
  "is_active": true
}

# Desactivar usuario (Solo SUPER_ADMIN)
DELETE /api/users/:id
Authorization: Bearer <token>
```

### **Reportes**

```bash
# Crear reporte (SUPERVISOR o SUPER_ADMIN)
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Reporte de Ronda",
  "descripcion": "Detalles del reporte",
  "locacion": "Zona A",
  "fecha": "2026-04-09T15:30:00Z"
}

# Obtener reportes (Ve todos si es ADMIN, solo suyos si SUPERVISOR)
GET /api/reports
Authorization: Bearer <token>

# Actualizar reporte
PUT /api/reports/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Nuevo título",
  "descripcion": "Nueva descripción",
  "locacion": "Nueva ubicación"
}

# Eliminar reporte (Solo SUPER_ADMIN)
DELETE /api/reports/:id
Authorization: Bearer <token>
```

### **Rondas**

```bash
# Crear ronda
POST /api/rounds
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Ronda Nocturna",
  "descripcion": "Supervisión",
  "locacion": "Zona B",
  "fecha": "2026-04-10T22:00:00Z"
}

# Crear ronda y reporte en una sola operacion
POST /api/rounds/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Banco Principal - Puesto Norte",
  "descripcion": "Cliente: Banco Principal\nPuesto: Norte\n...",
  "locacion": "Banco Principal / Norte",
  "fecha": "2026-04-10T22:00:00Z"
}

# Obtener rondas
GET /api/rounds
Authorization: Bearer <token>

# Actualizar ronda
PUT /api/rounds/:id
Authorization: Bearer <token>

{
  "titulo": "Nuevo título",
  "descripcion": "Nueva descripción",
  "locacion": "Nueva ubicación"
}
```

---

## 💰 DEPLOYMENT A RAILWAY

### PASO 1: Crear Cuenta en Railway

1. Ir a https://railway.app
2. Crear cuenta (gratis)
3. Conectar GitHub

### PASO 2: Crear Proyecto

1. Dashboard → New Project
2. Deploy from GitHub
3. Seleccionar tu repositorio (sj-security-v2)

### PASO 3: Agregar PostgreSQL

1. En Railway Dashboard: + Add Service
2. Seleccionar PostgreSQL
3. Copiar DATABASE_URL

### PASO 4: Configurar Variables

En Railway Project Settings:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_SSL=false
JWT_SECRET=tu_secreto_muy_seguro_aqui
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://tu_frontend_vercel.com
```

Si tu proveedor PostgreSQL requiere SSL, cambia DATABASE_SSL a true.

### PASO 5: Deploy

```bash
# Push a GitHub
git push origin main

# Railway detecta cambios automáticamente y hace deploy
```

---

## 🔒 Seguridad

- ✅ Contraseñas con bcryptjs (hash salted)
- ✅ JWT tokens con expiración 24h
- ✅ Validación de roles en cada endpoint
- ✅ CORS configurado
- ✅ Protección contra SQL injection (prepared statements)

---

## 📊 Tecnología

- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **TypeScript** - Type safety
- **JWT** - Autenticación stateless
- **bcryptjs** - Hashing de contraseñas
- **Morgan** - HTTP request logger

---

## 🆘 Troubleshooting

### "Cannot connect to database"

```bash
# Verificar que PostgreSQL está corriendo
# Windows: Services → PostgreSQL

# Si usas Docker:
docker ps  # Ver contenedores activos

# Si PostgreSQL no está, iniciar:
docker start sj-postgres
```

### "Invalid token"

- Verificar que el token en Authorization header tenga "Bearer " al inicio
- Verificar que JWT_SECRET coincide en .env
- Tokens expiran después de 24h

### Puerto 5000 en uso

```bash
# Cambiar puerto en .env
PORT=5001
```

---

**¡Backend listo para producción!**
