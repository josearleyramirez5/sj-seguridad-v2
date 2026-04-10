# 🗄️ INSTALAR PostgreSQL EN WINDOWS 10/11

**Opción A: Instalación Local (Tradicional)**
**Opción B: Docker (Recomendado - Más fácil)**

---

## 📥 OPCIÓN A: Instalación Local

### PASO 1: Descargar PostgreSQL

1. Ve a: https://www.postgresql.org/download/windows/
2. Haz clic en **"Download the installer"**
3. Elige versión **15 o 16** (recomendado)
4. Se descargará un archivo `.exe`

### PASO 2: Ejecutar el Instalador

1. Doble-clic en el archivo `.exe` descargado
2. Elige idioma (English)
3. Siguiente, siguiente...
4. **En el paso de contraseña:**
   - Password: `postgres`
   - Confirmar: `postgres`
   - Anota esto, lo necesitarás luego
5. **Puerto:** Dejar 5432 (por defecto)
6. **Locale:** English, United States
7. Finish → Se instala

### PASO 3: Abrir PostgreSQL Command Line

1. Presiona `Win` (tecla Windows)
2. Busca: "**pgAdmin**" o "**SQL Shell**"
3. Abre `SQL Shell (psql.exe)`

### PASO 4: Crear la Base de datos

```sql
-- Dentro de SQL Shell, escribe:
CREATE DATABASE sj_security;

-- Presiona Enter
-- Debe decir: "CREATE DATABASE"

-- Luego escribe:
\l

-- Debe aparecer "sj_security" en la lista
```

### PASO 5: Salir

```
\q
```

**✅ PostgreSQL está listo**

---

## 🐳 OPCIÓN B: Docker (Más Fácil - Recomendado)

### PASO 1: Instalar Docker Desktop

1. Ve a: https://www.docker.com/products/docker-desktop
2. Descarga para Win"jsonwebtoken": "^9.0.2"dows
3. Ejecuta el instalador (`.exe`)
4. Sigue los pasos (siguiente, siguiente...)
5. Reinicia tu computadora cuando pida
6. Docker Desktop se abrirá automáticamente

### PASO 2: Verificar que Docker Funciona

Abre PowerShell y escribe:

```powershell
docker --version

# Debe mostrar:
# Docker version 24.0.x, build xxxxx
```

Si no funciona, asegúrate de que Docker Desktop está corriendo (presiona Win, busca "Docker", inicia la app).

### PASO 3: Ejecutar PostgreSQL en Docker

Copia esta línea completa y pégala en PowerShell:

```powershell
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15
```

**Explicación:**
- `--name sj-postgres` = Nombre del contenedor
- `POSTGRES_PASSWORD=postgres` = Contraseña (postgres)
- `POSTGRES_DB=sj_security` = Base de datos que se crea automáticamente
- `-p 5432:5432` = Puerto (5432 es el estándar)
- `-d` = Ejecutar en background
- `postgres:15` = Versión de PostgreSQL

Si todo va bien, verá algo como:

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Ese es el ID del contenedor (no preocuparse, es normal).

### PASO 4: Verificar que PostgreSQL está Corriendo

```powershell
docker ps

# Debe mostrar:
# CONTAINER ID IMAGE    STATUS
# a1b2c3d4...  postgres:15 Up 2 minutes
```

### PASO 5: Acceder a la Base de datos

```powershell
psql -h localhost -U postgres -d sj_security

# Cuando pida password, escribe:
# postgres

# Si entra, verá un prompt como:
# sj_security=#
```

### PASO 6: Salir

```
\q
```

**✅ PostgreSQL con Docker está listo**

---

## 🔄 COMANDOS ÚTILES DOCKER

```powershell
# Ver contenedores en ejecución
docker ps

# Detener PostgreSQL
docker stop sj-postgres

# Iniciar nuevamente
docker start sj-postgres

# Ver logs
docker logs sj-postgres

# Eliminar contenedor (CUIDADO: Borra dados)
docker rm sj-postgres
```

---

## ✅ VERIFICACIÓN FINAL

Después de instalar (por cualquier método), verifica que funciona:

```powershell
# Conectar a la BD
psql -U postgres -d sj_security

# Dentro, ejecutar:
SELECT NOW();

# Debe mostrar la fecha/hora actual
```

Si ves la fecha, **¡PostgreSQL funciona!** ✅

---

## 🎯 PRÓXIMO PASO

Una vez que PostgreSQL esté corriendo:

1. Abre tu proyecto en VS Code:
   ```
   code c:\Users\juana\OneDrive\Escritorio\sj-security-v2\backend
   ```

2. Ejecuta:
   ```powershell
   npm install
   ```

3. Crea `.env` (copiar desde `.env.example`)

4. Aplica el schema:
   ```powershell
   psql -U postgres -d sj_security -f ../database/schema.sql
   ```

5. Inicia servidor:
   ```powershell
   npm run dev
   ```

6. Verifica en navegador:
   ```
   http://localhost:5000/health
   ```

¡Listo!

---

## ❓ PROBLEMAS

### Docker no inicia
- Necesitas Windows 11 o Windows 10 Pro
- Actualiza Windows
- Reinicia computadora

### psql: command not found
- PostgreSQL local no se agregó al PATH
- Reinstala o agrega manualmente a PATH

### Connection refused
- PostgreSQL no está corriendo
- Ejecuta `docker start sj-postgres` de nuevo

---

**¿Cuál opción prefieres: A (Local) o B (Docker)?**
