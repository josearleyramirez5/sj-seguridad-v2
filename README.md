# SJ Seguridad v2

Plataforma web de supervision de seguridad construida con Next.js, Express, TypeScript y PostgreSQL.

## Estado actual

- Frontend desplegado en Vercel
- Backend desplegado en Railway
- Base de datos PostgreSQL operativa
- Autenticacion JWT activa
- Sistema configurado por roles
- CRUD de reportes e incidencias activo
- Notificaciones con actualizacion automatica en la app

## Roles del sistema

- `SUPER_ADMIN`
- `SUPERVISOR`
- `GUARD`

## Documentacion principal

- [INICIALIZACION_PROYECTO.md](INICIALIZACION_PROYECTO.md): instalacion, configuracion, ejecucion y despliegue
- [PASO_A_PASO_DE_INSTALACION.md](PASO_A_PASO_DE_INSTALACION.md): guia completa desde GitHub hasta ejecutar la app en otro ordenador
- [DIAGRAMAS_FUNCIONALES_MERMAID.md](DIAGRAMAS_FUNCIONALES_MERMAID.md): MER, diagrama de clases y diagrama de casos de uso
- [database/schema.sql](database/schema.sql): esquema real de la base de datos

## URLs de produccion

- Frontend: https://sj-security-v2.vercel.app
- Backend: https://sj-seguridad-v2-production.up.railway.app

## Credenciales iniciales

- correo: admin@sjseguridad.com
- clave: Admin123!!

## Ejecucion rapida

```powershell
npm run dev:backend
npm run dev:frontend
```

La guia completa de instalacion y uso esta en [INICIALIZACION_PROYECTO.md](INICIALIZACION_PROYECTO.md).
