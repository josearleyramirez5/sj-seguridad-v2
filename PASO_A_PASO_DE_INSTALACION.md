# Paso a Paso de Instalacion

## Objetivo

Esta guia sirve para instalar SJ Seguridad v2 en otro ordenador, partiendo desde GitHub hasta dejar la aplicacion corriendo en local.

## Paginas web importantes

Estas son las paginas web principales del proyecto:

- Repositorio GitHub: https://github.com/josearleyramirez5/sj-seguridad-v2
- Frontend en produccion: https://sj-security-v2.vercel.app
- Backend en produccion: https://sj-seguridad-v2-production.up.railway.app

## 1. Requisitos previos

Antes de descargar el proyecto, instala lo siguiente:

- Git https://git-scm.com/install/windows
- Node.js 20 o superior https://nodejs.org/en/download
- npm npm install
- PostgreSQL 15 o superior https://www.enterprisedb.com/downloads/postgres-postgresql-downloads 
- Visual Studio Code, para trabajar el proyecto con mas comodidad

## 2. Descargar el proyecto desde GitHub

Abre PowerShell en la carpeta donde quieras guardar el proyecto y ejecuta:

```powershell
git clone https://github.com/josearleyramirez5/sj-seguridad-v2.git
cd sj-security-v2
```

Si quieres verificar que descargaste bien el repositorio:

```powershell
git status
```

Debe mostrar el repositorio limpio o sin cambios pendientes.

## 3. Revisar la estructura principal

La estructura importante es esta:

```text
sj-security-v2/
|-- backend/
|-- database/
|-- frontend/
|-- README.md
|-- INICIALIZACION_PROYECTO.md
`-- PASO_A_PASO_DE_INSTALACION.md
```

## 4. Instalar dependencias del proyecto

Desde la raiz del repositorio ejecuta:

```powershell
cd backend
npm install

cd ..\frontend
npm install

cd ..
```

## 5. Crear la base de datos PostgreSQL

Usaremos PostgreSQL instalado localmente.

Abre PowerShell y entra a PostgreSQL:

```powershell
psql -U postgres
```

Dentro de PostgreSQL ejecuta:

```sql
CREATE DATABASE sj_security;
\q
```

## 6. Configurar variables de entorno del backend

Crea el archivo [backend/.env](backend/.env) con este contenido:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
DATABASE_SSL=false
PORT=5000
JWT_SECRET=cambiar-antes-de-produccion
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Si tu usuario o contraseña de PostgreSQL son distintos, ajusta `DATABASE_URL`.

## 7. Configurar variables de entorno del frontend

Crea el archivo [frontend/.env.local](frontend/.env.local) con este contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 8. Crear tablas y datos iniciales

Desde la carpeta raiz del proyecto ejecuta:

```powershell
cd backend
psql -U postgres -d sj_security -f ..\database\schema.sql
cd ..
```

Ese script crea:

- usuarios
- reportes
- rondas
- incidencias
- ubicaciones
- notificaciones
- usuario administrador inicial

## 9. Credenciales iniciales

Una vez cargado el esquema, puedes entrar con:

- correo: admin@sjseguridad.com
- clave: Admin123!!

## 10. Ejecutar el backend

En una primera terminal:

```powershell
cd backend
npm run dev
```

Si todo está bien, el backend quedará disponible en:

```text
http://localhost:5000
```

## 11. Ejecutar el frontend

En una segunda terminal:

```powershell
cd frontend
npm run dev
```

Si todo está bien, el frontend quedará disponible en:

```text
http://localhost:3000
```

## 12. Verificar que la instalación funciona

### Verificar backend

Abre en el navegador o prueba con PowerShell:

```text
http://localhost:5000/health
http://localhost:5000/api/health
```

La respuesta esperada debe parecerse a:

```json
{
  "status": "ok"
}
```

### Verificar frontend

Abre:

```text
http://localhost:3000
```

Debes ver la pantalla de inicio de sesión.

### Verificar login

Ingresa con:

- correo: admin@sjseguridad.com
- clave: Admin123!!

## 13. Flujo mínimo recomendado de prueba

Después de iniciar sesión, valida este recorrido:

1. Entrar al dashboard.
2. Crear una ronda.
3. Revisar la vista de reportes.
4. Crear una incidencia.
5. Revisar la bandeja de notificaciones.
6. Si eres administrador, entrar a gestión de usuarios.

## 14. Scripts útiles desde la raíz

Puedes usar también estos comandos desde la carpeta principal:

```powershell
npm run dev:backend
npm run dev:frontend
npm run build
npm run build:backend
npm run build:frontend
```

## 15. Problemas comunes

### Error de conexión a PostgreSQL

Revisa:

- que PostgreSQL esté corriendo
- que la base `sj_security` exista
- que `DATABASE_URL` sea correcta

### El frontend no conecta con el backend

Revisa:

- que el backend esté levantado en el puerto 5000
- que [frontend/.env.local](frontend/.env.local) apunte a `http://localhost:5000/api`
- que el valor `CORS_ORIGIN` del backend sea `http://localhost:3000`

### El login falla

Revisa:

- que ejecutaste [database/schema.sql](database/schema.sql)
- que el usuario admin fue creado correctamente
- que estás usando `admin@sjseguridad.com` y `Admin123!!`

## 16. URLs productivas actuales

Si quieres comparar con producción:

- Frontend: https://sj-security-v2.vercel.app
- Backend: https://sj-seguridad-v2-production.up.railway.app

## 17. Paginas web para abrir durante la instalacion

Si quieres revisar rápidamente las páginas web relacionadas mientras instalas el proyecto, usa estas:

- GitHub del proyecto: https://github.com/josearleyramirez5/sj-seguridad-v2
- Frontend productivo: https://sj-security-v2.vercel.app
- Health del backend: https://sj-seguridad-v2-production.up.railway.app/health
- API health del backend: https://sj-seguridad-v2-production.up.railway.app/api/health

## 18. Archivos recomendados para consulta

- [README.md](README.md)
- [INICIALIZACION_PROYECTO.md](INICIALIZACION_PROYECTO.md)
- [PASO_A_PASO_DE_INSTALACION.md](PASO_A_PASO_DE_INSTALACION.md)
- [database/schema.sql](database/schema.sql)

Con esto ya puedes instalar y lanzar la aplicación en otro ordenador sin depender del entorno actual.