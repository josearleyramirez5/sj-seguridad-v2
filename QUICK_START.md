# Guia rapida

## Objetivo

Levantar backend, frontend y PostgreSQL en local con la configuracion correcta.

## 1. Levantar PostgreSQL

```powershell
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15
```

## 2. Configurar variables

backend/.env

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
PORT=5000
JWT_SECRET=cambiar-antes-de-produccion
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 3. Instalar dependencias

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

## 4. Crear tablas y usuario admin

Desde backend:

```powershell
psql -U postgres -d sj_security -f ..\database\schema.sql
```

Credenciales iniciales:

- admin@sjseguridad.com
- Admin123!!

## 5. Ejecutar backend y frontend

Terminal 1:

```powershell
cd backend
npm run dev
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

## 6. Validar

Health:

```text
http://localhost:5000/health
http://localhost:5000/api/health
```

Frontend:

```text
http://localhost:3000
```

## 7. Vercel

El frontend ya esta preparado para Vercel, pero necesitas definir en Vercel:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

No puedo confirmar desde este workspace que tu cuenta de Vercel ya este enlazada porque no hay carpeta .vercel ni CLI instalada.
