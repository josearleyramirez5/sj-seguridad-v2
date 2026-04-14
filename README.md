# SJ Seguridad v2

Plataforma de supervision de seguridad con frontend Next.js, backend Express/TypeScript y PostgreSQL.

## Estado actual

- Frontend y backend compilan correctamente en local.
- El frontend ya consume la API real; no depende de Firebase.
- Existe el flujo POST /api/rounds/complete para guardar ronda y reporte en una sola operacion.
- La vista de reportes reconstruye el detalle desde la descripcion serializada del reporte.
- El despliegue en Vercel esta preparado para el frontend, pero este repositorio no esta enlazado localmente con una cuenta/proyecto de Vercel.

## Estructura

```text
sj-security-v2/
|-- backend/
|-- database/
|-- frontend/
|-- README.md
|-- QUICK_START.md
`-- vercel.json
```

## Arranque local

### 1. Base de datos

Opcion local con PostgreSQL instalado:

```powershell
psql -U postgres
CREATE DATABASE sj_security;
\q
```

Opcion con Docker:

```powershell
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15
```

### 2. Variables del backend

Crear backend/.env a partir de backend/.env.example.

Valores minimos de desarrollo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
PORT=5000
JWT_SECRET=cambiar-antes-de-produccion
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Variables del frontend

Crear frontend/.env.local a partir de frontend/.env.example.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Instalar dependencias

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 5. Aplicar schema

Desde la carpeta backend:

```powershell
psql -U postgres -d sj_security -f ..\database\schema.sql
```

El schema habilita pgcrypto y crea un usuario inicial:

- email: admin@sjseguridad.com
- password: Admin123!!

### 6. Ejecutar la app

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

## Scripts utiles en la raiz

```powershell
npm run dev:backend
npm run dev:frontend
npm run build
npm run build:backend
npm run build:frontend
```

## Verificaciones minimas

Health check backend:

```text
GET http://localhost:5000/health
GET http://localhost:5000/api/health
```

Login:

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sjseguridad.com",
  "password": "Admin123!!"
}
```

Flujo principal esperado:

1. Iniciar sesion en el frontend.
2. Crear una ronda desde el formulario.
3. Confirmar que aparecen registros en rondas y reportes.
4. Verificar dashboard y vista de reportes.

## Despliegue

### Backend

El backend esta pensado para desplegarse en Railway u otro host Node.js con PostgreSQL.

Variables minimas de produccion:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Frontend en Vercel

El archivo vercel.json ya esta ajustado para desplegar el frontend desde la raiz del repositorio.

Variables minimas en Vercel:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

Estado real de Vercel en este workspace:

- No existe carpeta .vercel en la raiz.
- La CLI vercel no esta instalada en esta maquina.
- Por eso no puedo confirmar que el proyecto este enlazado a tu cuenta desde aqui.

Lo que si esta confirmado:

- vercel.json es valido para este repo.
- El build del frontend pasa localmente.
- La salida esperada de Vercel es frontend/.next.

## Notas tecnicas

- El frontend normaliza roles y payloads del backend en frontend/lib/api.service.ts.
- Los reportes con alertas se marcan como attention; los demas como completed.
- La informacion detallada de inspeccion hoy se almacena dentro de descripcion; si luego quieres, eso se puede normalizar en tablas adicionales.

## Siguiente validacion recomendada

1. Levantar PostgreSQL.
2. Aplicar database/schema.sql.
3. Ejecutar backend y frontend.
4. Probar login y creacion de ronda.
5. Configurar en Vercel la variable NEXT_PUBLIC_API_URL apuntando al backend productivo.
- Ver schema.sql línea de INSERT

---

## 🎯 Próximos Pasos

1. ✅ Backend funcionando (HOY)
2. ⬜ Frontend Next.js conectado a APIs
3. ⬜ Deploy a Railway (Backend + DB)
4. ⬜ Deploy Frontend a Vercel
5. ⬜ Testing en producción

---

**¿Tienes preguntas? Lee README.md en la carpeta backend/**
