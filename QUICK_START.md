# 🎯 GUÍA VISUAL - PASO A PASO

## ✅ CHECKLIST RÁPIDA

```
INSTALACIÓN EN ORDEN:
┌─────────────────────────────────────────┐
│ 1. Instalar PostgreSQL (Local o Docker) │ ← HACER PRIMERO
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. Ejecutar schema.sql en la BD         │ ← DESPUÉS
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. npm install en /backend              │ ← INSTALAR LIBRERÍAS
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. Crear archivo .env                   │ ← CONFIGURAR
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. npm run dev                          │ ← INICIAR SERVIDOR
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 6. http://localhost:5000/health        │ ← VERIFICAR
└─────────────────────────────────────────┘
```

---

## 🌟 OPCIÓN 1: DOCKER (RECOMENDADO - 5 MINUTOS)

### Abre PowerShell y sigue esto:

```PS1
# Copiar TODO esto y pegar en PowerShell:

# 1. Descargar y ejecutar PostgreSQL en Docker
docker run --name sj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sj_security `
  -p 5432:5432 `
  -d postgres:15

# 2. Esperar 5 segundos, verificar que está corriendo
docker ps

# 3. Debe ver "sj-postgres" en la lista ✅
```

**Listo, PostgreSQL está corriendo.**

---

## 📁 ARCHIVO .env

Crea un archivo llamado `.env` en la carpeta `backend/`:

```
# Copiar EXACTAMENTE esto:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sj_security
JWT_SECRET=tu_secreto_muy_seguro_cambiar_en_produccion
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## 🔧 INSTALAR BACKEND

En PowerShell, en la carpeta del proyecto:

```PS1
# Ir a la carpeta backend
cd "c:\Users\juana\OneDrive\Escritorio\sj-security-v2\backend"

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Iniciar servidor (desarrollo)
npm run dev
```

---

## 🎬 RESULTADO ESPERADO

Cuando ejecutes `npm run dev`, deberías ver:

```
🚀 Server running on http://localhost:5000
📊 Database: postgresql://postgres:postgres@localhost:5432/sj_security

Listening on port 5000
```

**Si ves esto, ¡el servidor está corriendo!** ✅

---

## 🧪 PRUEBA RÁPIDA

### En el navegador o Postman:

```
GET http://localhost:5000/health

Respuesta:
{
  "status": "ok",
  "timestamp": "2026-04-09T15:45:22.123Z"
}
```

Si ves eso, **todo funciona** ✅

---

## 📝 PRÓXIMOS PASOS

Una vez que tengamos el backend funcionando:

1. ✅ Backend corriendo en localhost:5000
2. ⬜ Crear Frontend (Next.js conectado a APIs)
3. ⬜ Deploy a Railway (Backend + PostgreSQL)
4. ⬜ Deploy Frontend a Vercel

---

## 📚 ARCHIVOS IMPORTANTES

```
sj-security-v2/
├── README.md                    ← LEER PRIMERO
├── POSTGRESQL_INSTALL.md        ← Instrucciones de instalación
├── backend/
│   ├── README.md               ← Endpoints API
│   ├── .env.example            ← Copiar a .env
│   ├── package.json            ← Dependencias
│   ├── tsconfig.json           ← Configuración TypeScript
│   └── src/
│       ├── server.ts           ← Servidor Express
│       ├── database.ts         ← Conexión PostgreSQL
│       ├── middleware/auth.ts  ← JWT + roles
│       └── routes/             ← Endpoints
└── database/
    └── schema.sql              ← Crear tablas
```

---

## ⏱️ TIEMPO ESTIMADO

| Paso | Tiempo |
|------|--------|
| Instalar PostgreSQL (Docker) | 5 min |
| Instalar dependencias (npm) | 2 min |
| Crear .env | 1 min |
| Iniciar servidor | 30 seg |
| **Total** | **~8 minutos** |

---

## 🆘 SI ALGO FALLA

### Error: "docker: command not found"
→ Docker no está instalado
→ Ve a: https://www.docker.com/products/docker-desktop

### Error: "Cannot find module 'pg'"
```PS1
npm install pg --save
```

### Error: "ECONNREFUSED"
→ PostgreSQL no está corriendo
```PS1
docker start sj-postgres
```

### Error: "Cannot locate the database"
→ Ejecutar schema.sql:
```PS1
psql -U postgres -d sj_security -f ../database/schema.sql
```

---

## 🎯 OBJETIVO FINAL DE HOY

**Tener el backend corriendo y respondiendo en http://localhost:5000/health**

Una vez que eso esté funcionando, añadimos el Frontend (Next.js).

---

**¿ESTAS LISTO PARA EMPEZAR?**

Sigue estos pasos en orden y lo tendremos en \~10 minutos.
