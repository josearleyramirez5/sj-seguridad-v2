# 🔒 SJ Seguridad v2 - PostgreSQL + Express + Next.js

Reemplazo completo de Firebase por PostgreSQL + Backend Express.

```
sj-security-v2/
├── backend/              # Express + Node.js + TypeScript
│   ├── src/
│   │   ├── server.ts    # Servidor principal
│   │   ├── database.ts  # Conexión PostgreSQL
│   │   ├── middleware/
│   │   │   └── auth.ts  # JWT + Validación de roles
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── users.ts
│   │       ├── reports.ts
│   │       └── rounds.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md         # Instrucciones detalladas
│
├── database/             # SQL Scripts
│   └── schema.sql       # Tabla, índices, usuario admin
│
└── frontend/            # Next.js (crear luego)
    ├── app/
    ├── components/
    ├── lib/
    │   └── api.service.ts  # NUEVO: APIs REST en lugar de Firebase
    └── package.json
```

---

## ⚡ INICIO RÁPIDO (Completo)

### 1️⃣ BACKEND - INSTALAR Y CONFIGURAR

#### **A) PostgreSQL Local (Windows)**

```powershell
# Si no tienes PostgreSQL instalado:
# Descargar: https://www.postgresql.org/download/windows/
# Ejecutar instalador

# Abrir PowerShell y conectarse:
psql -U postgres

# Dentro de psql:
CREATE DATABASE sj_security;
\q
```

#### **B) O Usar Docker (Más fácil)**

```powershell
# Instalar Docker Desktop: https://www.docker.com/products/docker-desktop

# Ejecutar PostgreSQL
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15

# Ver si está funcionando:
docker ps
```

#### **C) Instalar dependencias del backend**

```powershell
cd backend
npm install
```

#### **D) Crear archivo .env**

```powershell
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env (usa Notepad o VS Code)
# Debe quedar así:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
# JWT_SECRET=todavia_no_es_produccion_cambiarlo_luego
# PORT=5000
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:3000
```

#### **E) Crear tablas en la base de datos**

```powershell
# Desde PowerShell (en la carpeta del proyecto)
psql -U postgres -d sj_security -f ../database/schema.sql

# Debe mostrar: CREATE TABLE, CREATE INDEX, INSERT 1
```

#### **F) Iniciar servidor**

```powershell
# Modo desarrollo (auto-reload)
npm run dev

# Debe mostrar:
# 🚀 Server running on http://localhost:5000
# 📊 Database: postgresql://...
```

✅ **Backend listo**

---

### 2️⃣ PRUEBAS RÁPIDAS (Sin Frontend)

**Abrir Postman o Insomnia** (O usar curl en PowerShell)

#### **A) Health Check**

```bash
GET http://localhost:5000/health

Respuesta:
{
  "status": "ok",
  "timestamp": "2026-04-09T..."
}
```

#### **B) Login**

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sjseguridad.com",
  "password": "admin123"  # Cambiar en schema.sql con bcrypt real
}

Respuesta:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "nombre": "Administrador",
    "role": "SUPER_ADMIN"
  }
}
```

#### **C) Obtener Usuarios (Requiere Token)**

```bash
GET http://localhost:5000/api/users
Authorization: Bearer <TOKEN_DEL_LOGIN>

Respuesta:
[
  {
    "id": "uuid",
    "nombre": "Administrador",
    "email": "admin@sjseguridad.com",
    "role": "SUPER_ADMIN"
  }
]
```

---

## 📱 Frontend (Next.js)

**Por ahora está vacío, lo crearemos después.**

La estructura será similar a la v1, pero usando APIs REST en lugar de Firebase.

---

## 🌐 DEPLOYMENT A RAILWAY

### PASO 1: Crear Cuenta Railway

1. Ir a https://railway.app
2. Hacer login con GitHub
3. Crear nuevo proyecto

### PASO 2: Agregar PostgreSQL

1. En Dashboard: "+ New" → PostgreSQL
2. Se crea automáticamente
3. Copiar CONNECTION STRING

### PASO 3: Agregar Backend

1. "+ New Service" → GitHub Repo
2. Seleccionar "sj-security-v2"
3. Configurar Variables de Entorno:

```
DATABASE_URL=<Copiar de PostgreSQL service>
JWT_SECRET=un_secreto_muy_fuerte_aqui_cambiar
NODE_ENV=production
CORS_ORIGIN=https://tu_frontend.vercel.com
```

### PASO 4: Deploy

```bash
git push origin main

# Railway detecta cambios y hace deploy automáticamente
```

---

## ✅ CHECKLIST

- [ ] PostgreSQL instalado o Docker corriendo
- [ ] Base de datos "sj_security" creada
- [ ] Backend npm install completo
- [ ] .env configurado
- [ ] Schema SQL aplicado
- [ ] Backend npm run dev funcionando
- [ ] Health check en http://localhost:5000/health OK
- [ ] Login test con Postman OK
- [ ] Get users test OK

---

## 📚 Referencia Rápida

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Iniciar servidor (modo desarrollo) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Iniciar desde dist/ |
| `psql -U postgres -d sj_security` | Conectar a BD |
| `\dt` | Listar tablas (dentro de psql) |
| `docker ps` | Ver contenedores activos |
| `docker logs sj-postgres` | Ver logs del contenedor |

---

## 🆘 Problemas Comunes

**Error: "Cannot find module 'pg'"**
```bash
npm install pg
```

**Error: "Database connection failed"**
- Verificar que PostgreSQL está corriendo
- Verificar DATABASE_URL en .env
- Verificar credenciales

**Error: "Cannot login"**
- La contraseña admin en schema.sql es de ejemplo
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
