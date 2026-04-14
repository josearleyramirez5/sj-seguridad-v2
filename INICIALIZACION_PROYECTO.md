# Inicializacion del Proyecto

## Descripcion general

SJ Seguridad v2 es una plataforma web de supervision de seguridad construida con frontend en Next.js, backend en Express con TypeScript y base de datos PostgreSQL.

La aplicacion trabaja con autenticacion JWT y control de acceso por roles.

## Roles del sistema

El proyecto si esta configurado por roles y actualmente maneja estos perfiles:

- `SUPER_ADMIN`: administra usuarios, consulta todos los datos, elimina reportes y gestiona la operacion completa.
- `SUPERVISOR`: crea, consulta y actualiza rondas, reportes e incidencias propias.
- `GUARD`: puede autenticarse y consultar su perfil; no tiene permisos administrativos en las rutas actuales.

## Modulos funcionales actuales

- Gestion de usuarios por administrador.
- CRUD de reportes.
- CRUD de incidencias.
- Rondas con generacion de reporte.
- Bandeja de notificaciones con actualizacion automatica por polling.

## Tecnologias utilizadas

### Frontend

- Next.js 16
- React 19
- TypeScript
- Axios
- Tailwind CSS
- Radix UI

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- pg
- JWT
- bcryptjs
- cors
- morgan

### Infraestructura

- PostgreSQL local o PostgreSQL en Railway
- Backend desplegado en Railway
- Frontend desplegado en Vercel

## Requisitos para ejecutar el proyecto

Instalar en la maquina:

- Node.js 20 o superior
- npm
- PostgreSQL 15 o superior

Opcional para desarrollo local:

- Docker Desktop, si prefieres levantar PostgreSQL en contenedor

## Estructura del proyecto

```text
sj-security-v2/
|-- backend/
|-- database/
|-- frontend/
|-- README.md
|-- INICIALIZACION_PROYECTO.md
`-- DIAGRAMAS_FUNCIONALES_MERMAID.md
```

## Instalacion de dependencias

### Dependencias del backend

```powershell
cd backend
npm install
```

### Dependencias del frontend

```powershell
cd ..\frontend
npm install
```

## Configuracion de la base de datos

### Opcion A: PostgreSQL local

```powershell
psql -U postgres
CREATE DATABASE sj_security;
\q
```

### Opcion B: PostgreSQL con Docker

```powershell
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15
```

## Variables de entorno

### Backend

Crear el archivo `backend/.env` a partir de `backend/.env.example`.

Configuracion minima para desarrollo local:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
DATABASE_SSL=false
PORT=5000
JWT_SECRET=cambiar-antes-de-produccion
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend

Crear el archivo `frontend/.env.local` a partir de `frontend/.env.example`.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Inicializacion de la base de datos

Ejecutar el esquema SQL desde la carpeta `backend`:

```powershell
psql -U postgres -d sj_security -f ..\database\schema.sql
```

Ese script crea tablas, indices y el usuario administrador inicial.

### Credenciales iniciales

- correo: admin@sjseguridad.com
- clave: Admin123!!

## Ejecucion del proyecto en local

### Opcion por servicios

Terminal 1, backend:

```powershell
cd backend
npm run dev
```

Terminal 2, frontend:

```powershell
cd frontend
npm run dev
```

### Opcion usando scripts de la raiz

```powershell
npm run dev:backend
npm run dev:frontend
```

## Scripts principales

Desde la raiz del proyecto:

```powershell
npm run dev:backend
npm run dev:frontend
npm run build
npm run build:backend
npm run build:frontend
npm run start:backend
```

## Verificaciones basicas

### Health check del backend

```text
GET http://localhost:5000/health
GET http://localhost:5000/api/health
```

### Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sjseguridad.com",
  "password": "Admin123!!"
}
```

### Flujo funcional recomendado para prueba

1. Iniciar sesion con el usuario administrador.
2. Consultar el perfil.
3. Crear una ronda.
4. Completar una ronda y generar su reporte.
5. Consultar reportes y rondas creadas.

## Despliegue actual del proyecto

### Produccion

- Frontend: https://sj-security-v2.vercel.app
- Backend: https://sj-seguridad-v2-production.up.railway.app

### Variables en produccion

#### Railway

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=true
JWT_SECRET=valor-seguro
NODE_ENV=production
CORS_ORIGIN=https://sj-security-v2.vercel.app
ALLOW_MEMORY_FALLBACK=false
```

#### Vercel

```env
NEXT_PUBLIC_API_URL=https://sj-seguridad-v2-production.up.railway.app/api
```

## Archivos importantes

- [README.md](README.md): resumen general del proyecto
- [INICIALIZACION_PROYECTO.md](INICIALIZACION_PROYECTO.md): guia principal de instalacion y ejecucion
- [PASO_A_PASO_DE_INSTALACION.md](PASO_A_PASO_DE_INSTALACION.md): instalacion detallada desde GitHub hasta levantar el proyecto en otra maquina
- [DIAGRAMAS_FUNCIONALES_MERMAID.md](DIAGRAMAS_FUNCIONALES_MERMAID.md): diagramas funcionales para la entrega
- [database/schema.sql](database/schema.sql): esquema real de PostgreSQL

## Observaciones finales

- El backend ya trabaja con PostgreSQL real.
- El sistema esta desplegado y verificado en produccion.
- Los permisos dependen del rol autenticado y se controlan desde el backend con JWT.