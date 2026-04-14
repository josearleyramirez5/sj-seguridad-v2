# Changelog

## v2.1.0 - 2026-04-14

### Funcionalidades agregadas

- CRUD completo de incidencias en backend y frontend.
- Bandeja de notificaciones con marcado individual, marcado masivo y actualizacion automatica por polling.
- Gestion de usuarios desde la interfaz para administradores.
- Mejoras en CRUD de reportes con creacion, edicion y eliminacion visible en la app.

### Mejoras de seguridad y backend

- Registro de usuarios protegido con JWT y restriccion real para SUPER_ADMIN.
- Emision de notificaciones automáticas al crear usuarios, reportes e incidencias.
- Nuevas rutas API para incidencias y notificaciones.

### Documentacion

- Nueva guia [INICIALIZACION_PROYECTO.md](INICIALIZACION_PROYECTO.md).
- Nueva guia [PASO_A_PASO_DE_INSTALACION.md](PASO_A_PASO_DE_INSTALACION.md).
- Nuevo archivo [DIAGRAMAS_FUNCIONALES_MERMAID.md](DIAGRAMAS_FUNCIONALES_MERMAID.md).
- Limpieza de documentacion antigua para dejar una base mas clara.

### Despliegue y validacion

- Frontend productivo disponible en https://sj-security-v2.vercel.app.
- Backend productivo disponible en https://sj-seguridad-v2-production.up.railway.app.
- Build completo validado localmente con `npm run build`.
- Validacion productiva realizada el 2026-04-14:
  - `GET /health` OK
  - `GET /api/health` OK
  - `POST /api/auth/login` OK
  - `GET /api/incidents` OK
  - `GET /api/notifications` OK

### Referencia tecnica

- Commit publicado en GitHub: `cf54b20`.
