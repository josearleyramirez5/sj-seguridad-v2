# Guia de entrega para presentacion

## Arquitectura final

- Backend: Railway
- Base de datos: PostgreSQL de Railway
- Frontend: Vercel

Docker no es necesario para la presentacion. Solo queda como opcion de desarrollo local.

## Qué debe validar tu amigo

1. El backend responde 200 en /health.
2. El frontend abre en Vercel sin errores.
3. El login funciona con el admin inicial.
4. Crear una ronda genera datos visibles en reportes.

## Backend en Railway

El repositorio ya tiene [railway.json](railway.json) configurado para construir e iniciar el backend.

### Variables requeridas en Railway

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=false
JWT_SECRET=un-secreto-largo-y-seguro
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.vercel.app
```

Usar DATABASE_SSL=true solo si la conexion PostgreSQL lo exige.

### Comprobaciones

- https://tu-backend.railway.app/health
- https://tu-backend.railway.app/api/health

Ambas deben responder algo como:

```json
{
  "status": "ok"
}
```

Si responde 500, revisar en este orden:

1. DATABASE_URL
2. DATABASE_SSL
3. Que [database/schema.sql](database/schema.sql) haya sido aplicado

## Base de datos

Hay que cargar [database/schema.sql](database/schema.sql) en PostgreSQL de Railway.

Usuario inicial:

- Email: admin@sjseguridad.com
- Password: Admin123!!

## Frontend en Vercel

El repositorio ya tiene [vercel.json](vercel.json) configurado para desplegar la app Next.js desde la carpeta frontend.

### Variable requerida en Vercel

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

## Orden de entrega recomendado

1. Confirmar health del backend Railway.
2. Confirmar schema y usuario admin en PostgreSQL.
3. Confirmar CORS_ORIGIN en Railway.
4. Confirmar NEXT_PUBLIC_API_URL en Vercel.
5. Probar login.
6. Probar crear ronda.

## Estado observado en esta revision

La configuracion de despliegue existe y el frontend compila, pero el backend de Railway configurado actualmente estaba devolviendo 500 en health. Antes de la presentacion, ese punto debe quedar resuelto.