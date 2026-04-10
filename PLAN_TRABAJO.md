# 📅 PLAN DE TRABAJO - SJ SECURITY v2

**Proyecto:** De Firebase a PostgreSQL + Express  
**Duración Total:** ~2-3 semanas  
**Inicio:** 9 Abril 2026  
**Estructura:** Backend primero, Frontend después, Deploy al final

---

## 🎯 HITO 1: BACKEND FUNCIONANDO (Esta semana)

### **Día 1 (Hoy - 9 Abril)**

```
✅ Carpeta v2 creada
✅ Backend structure completo
✅ package.json configurado
✅ Database schema listo
✅ Documentación de requerimientos

TAREAS HOY:
□ Instalar PostgreSQL (Docker o Local)
□ Crear base de datos
□ npm install en /backend
□ Crear .env file
□ Probar npm run dev
□ Verificar health check en http://localhost:5000/health

RESULTADO ESPERADO:
🚀 Server running on http://localhost:5000
📊 Database connected
```

---

### **Día 2-3 (10-11 Abril)**

```
BACKEND TESTING & REFINEMENT

TAREAS:
□ Probar endpoints con Postman/Insomnia
  - POST /api/auth/login
  - GET /api/users
  - POST /api/reports
  - POST /api/rounds
  
□ Agregar endpoints faltantes
  - DELETE /api/users/:id
  - DELETE /api/reports/:id
  - Incidents CRUD

□ Mejorar error handling
□ Agregar validaciones

RESULTADO ESPERADO:
Todos los endpoints funcionando 100%
```

---

### **Día 4-5 (12-13 Abril)**

```
SETUP RAILWAY & PREPARAR DEPLOY

TAREAS:
□ Crear cuenta en Railway (https://railway.app)
□ Agregar PostgreSQL en Railway
□ Copiar DATABASE_URL
□ Crear GitHub repo para el proyecto
□ Push del código a GitHub
□ Configurar variables en Railway
□ Deploy del backend a Railway

RESULTADO ESPERADO:
Backend funcionando en producción: https://tu-app.railway.app
```

---

## 🎯 HITO 2: FRONTEND CONECTADO (Semana 2)

### **Día 6-7 (16-17 Abril)**

```
SETUP FRONTEND & COPIAR COMPONENTES

TAREAS:
□ Copiar estructura Next.js
□ Copiar components/ui/ completa
□ Copiar lib/types.ts, lib/utils.ts
□ Copiar hooks/
□ Copiar theme-provider.tsx

□ Crear lib/api.service.ts (NUEVO)
□ Crear lib/auth.api.service.ts (NUEVO)

□ npm install en /frontend
□ Configurar .env.local

ESTRUCTURA FRONTEND:
frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          (Copiado de v1) ✅
│   ├── login-view.tsx (Por refactorizar)
│   ├── admin-view.tsx (Por refactorizar)
│   └── ...
├── lib/
│   ├── api.service.ts (NUEVO)
│   ├── types.ts (Copiado)
│   └── utils.ts (Copiado)
├── hooks/           (Copiado) ✅
└── package.json
```

---

### **Día 8-10 (18-20 Abril)**

```
REFACTORIZAR COMPONENTES

PRIORIDAD 1 (Crítico):
□ login-view.tsx
  - Cambiar Firebase Auth → API login
  - Guardar token en localStorage
  - Cambiar error handling
  
□ admin-view.tsx
  - Cambiar Firestore queries → API calls
  - Actualizar user management modal

PRIORIDAD 2 (Alto):
□ reports-view.tsx
  - Cambiar CRUD Firestore → API
  
□ round-form-view.tsx
  - Cambiar crear/editar ronda → API

PRIORIDAD 3 (Medio):
□ dashboard-view.tsx
□ user-management-modal.tsx
□ profile-view.tsx
```

---

### **Día 11-12 (23-24 Abril)**

```
TESTING & BUG FIXES

TESTING CHECKLIST:
□ Login funciona con JWT
□ Token se guarda en localStorage
□ Crear usuario funciona
□ Crear reporte funciona
□ Crear ronda funciona
□ Editar datos funciona
□ Eliminar funciona (admin)
□ Permisos de rol funcionan
□ Error handling correcto

FIXES:
□ Validaciones de entrada
□ Mensajes de error legibles
□ Loading states
□ Error pages
```

---

## 🎯 HITO 3: DEPLOYMENT (Semana 3)

### **Día 13-14 (25-26 Abril)**

```
DEPLOY FRONTEND A VERCEL

TAREAS:
□ Conectar GitHub a Vercel
□ Configurar variables de entorno
  - NEXT_PUBLIC_API_URL=https://tu-backend-railway.app/api

□ Deploy automático en push
□ Verificar en producción
□ Tests en producción

RESULTADO:
App funcionando en: https://tu-app.vercel.app
```

---

### **Día 15 (27 Abril)**

```
PRUEBAS FINALES EN PRODUCCIÓN

□ Todo funciona en producción
□ Backend + Frontend + DB conectados
□ Users pueden:
  - Login con JWT
  - Ver datos según rol
  - Crear reportes/rondas
  - Editar propios datos
  
□ Admin puede:
  - Ver todos los datos
  - Crear usuarios
  - Eliminar datos

RESULTADO:
✅ v2 Completamente funcional en producción
```

---

## 📋 CHECKLIST FINAL

### **Backend Express**
- [x] Estructura completa
- [x] Database connection
- [x] Auth (login, register)
- [ ] JWT middleware
- [ ] Users CRUD
- [ ] Reports CRUD
- [ ] Rounds CRUD
- [ ] Error handling
- [ ] Validaciones
- [ ] Deploy a Railway

### **Frontend Next.js**
- [ ] UI components copiados
- [ ] API service creado
- [ ] Login refactorizado
- [ ] Admin view refactorizado
- [ ] Reports view refactorizado
- [ ] Rounds view refactorizado
- [ ] User management refactorizado
- [ ] Testing completo
- [ ] Deploy a Vercel

### **Producción**
- [ ] Backend en Railway
- [ ] PostgreSQL en Railway
- [ ] Frontend en Vercel
- [ ] Variables configuradas
- [ ] Tests en prod
- [ ] Monitoreo activo

---

## 🚨 PUNTOS CRÍTICOS

```
1. DATABASE CONNECTION
   - Si PostgreSQL no conecta, nada funciona
   - Verificar DATABASE_URL antes de empezar
   
2. JWT TOKENS
   - Guardar en localStorage correctamente
   - Agregarlo en Authorization header
   - Manejar expiración (24h)
   
3. CORS
   - Backend debe permitir frontend
   - Verificar CORS_ORIGIN en .env
   
4. ERROR HANDLING
   - No mostrar errores de BD al usuario
   - Mensajes genéricos en prod
   
5. VALIDACIÓN DE ROLES
   - Los permisos deben validarse en backend
   - No confiar en datos del cliente
```

---

## 📊 VELOCIDAD ESPERADA

| Tarea | Estimado | Actual | % |
|------|----------|--------|---|
| Backend setup | 1 día | ✅ 0.5 días | 100% |
| Backend endpoints | 2 días | □ | 0% |
| Frontend setup | 1 día | □ | 0% |
| Refactorizar componentes | 3 días | □ | 0% |
| Testing | 2 días | □ | 0% |
| Deploy | 1 día | □ | 0% |
| **TOTAL** | **10 días** | | |

---

## 🎓 LEARNING OUTCOMES

Al final sabrás:

```
✅ Express.js + TypeScript
✅ PostgreSQL database design
✅ JWT authentication
✅ REST API design
✅ Next.js conectado a APIs
✅ Deployment en Railway & Vercel
✅ Error handling profesional
✅ Security best practices
```

---

## 📞 SOPORTE

Si tienes problemas:

```
1. Lee el README.md correspondiente
2. Verifica el archivo específico en REQUERIMIENTOS_COMPLETOS.md
3. Revisa logs: console, docker logs, Firebase Console
4. Busca en Google el error específico
5. Pregunta en el chat
```

---

## 🎯 OBJETIVO FINAL

```
┌─────────────────────────────────────────┐
│ SJ SECURITY v2                          │
│ ✅ Backend: Express + PostgreSQL        │
│ ✅ Frontend: Next.js moderno            │
│ ✅ Auth: JWT tokens                     │
│ ✅ Hosting: Railway + Vercel            │
│ ✅ Escalable y mantenible               │
│ ✅ Sin Firebase complicado              │
│ ✅ Listo para producción                │
└─────────────────────────────────────────┘
```

---

**¿Listo para empezar?**

Sigue el plan paso a paso y lo tendremos en ~15 días completamente funcional.

Proyecto iniciado: 9 Abril 2026  
Tiempo estimado: 15 días  
Status: 🟢 En desarrollo
