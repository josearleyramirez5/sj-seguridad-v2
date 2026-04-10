# 📋 REQUERIMIENTOS Y ESPECIFICACIONES - SJ SEGURIDAD v2

**Proyecto:** Sistema de Seguridad SJ  
**Versión:** 2.0 (PostgreSQL + Express + Next.js)  
**Fecha:** 9 Abril 2026  
**Estado:** En Desarrollo

---

## 🎯 OBJETIVO DEL PROYECTO

Crear una **aplicación web de gestión de seguridad** que permita:
- 👤 Gestionar usuarios (admin, supervisores, guardias)
- 📋 Registrar reportes de inspección
- 🔄 Crear y trackear rondas de supervisión
- ⚠️ Registrar incidencias
- 📍 Rastrear ubicaciones GPS de guardias
- 🔔 Sistema de notificaciones en tiempo real

---

## 👥 ROLES DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│ SUPER_ADMIN (Administrador)                             │
├─────────────────────────────────────────────────────────┤
│ ✅ Crear usuarios (supervisores, guardias)              │
│ ✅ Ver todos los usuarios                               │
│ ✅ Editar usuarios                                      │
│ ✅ Desactivar usuarios                                  │
│ ✅ Ver todos los reportes/rondas/incidencias            │
│ ✅ Ver dashboard con estadísticas                       │
│ ✅ Crear reportes/rondas/incidencias                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SUPERVISOR                                              │
├─────────────────────────────────────────────────────────┤
│ ✅ Ver sus guardias asignados                           │
│ ✅ Crear reportes                                       │
│ ✅ Crear rondas                                         │
│ ✅ Crear incidencias                                    │
│ ✅ Ver sus propios reportes/rondas/incidencias          │
│ ❌ Crear usuarios                                       │
│ ❌ Ver datos de otros supervisores                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GUARD (Guardia)                                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Ver su ubicación en mapa                             │
│ ✅ Ver notificaciones                                   │
│ ✅ Ver reportes compartidos                             │
│ ❌ Crear usuarios                                       │
│ ❌ Crear reportes                                       │
│ ❌ Ver datos de otros                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### **Tabla: usuarios**
```sql
id              UUID (PRIMARY KEY)
email           VARCHAR(255) UNIQUE
password_hash   VARCHAR(255) - bcryptjs hash
nombre          VARCHAR(255)
telefono        VARCHAR(20) - OPCIONAL
role            VARCHAR(20) - SUPER_ADMIN | SUPERVISOR | GUARD
is_active       BOOLEAN - DEFAULT TRUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **Tabla: reportes**
```sql
id              UUID (PRIMARY KEY)
titulo          VARCHAR(255)
descripcion     TEXT
locacion        VARCHAR(255)
supervisor_id   UUID (FOREIGN KEY → usuarios.id)
fecha           TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
status          VARCHAR(20) - pendiente | visto | finalizado
```

### **Tabla: rondas**
```sql
id              UUID (PRIMARY KEY)
titulo          VARCHAR(255)
descripcion     TEXT
locacion        VARCHAR(255)
supervisor_id   UUID (FOREIGN KEY → usuarios.id)
fecha           TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
status          VARCHAR(20) - programada | activa | completada | cancelada
```

### **Tabla: incidencias**
```sql
id              UUID (PRIMARY KEY)
titulo          VARCHAR(255)
descripcion     TEXT
locacion        VARCHAR(255)
supervisor_id   UUID (FOREIGN KEY → usuarios.id)
severidad       VARCHAR(20) - BAJA | MEDIA | ALTA
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **Tabla: ubicaciones**
```sql
id              UUID (PRIMARY KEY)
usuario_id      UUID (FOREIGN KEY → usuarios.id)
latitud         DECIMAL(10, 8)
longitud        DECIMAL(11, 8)
created_at      TIMESTAMP
```

### **Tabla: notificaciones**
```sql
id              UUID (PRIMARY KEY)
usuario_id      UUID (FOREIGN KEY → usuarios.id)
titulo          VARCHAR(255)
descripcion     TEXT
is_read         BOOLEAN - DEFAULT FALSE
created_at      TIMESTAMP
```

---

## 🔌 API ENDPOINTS

### **AUTENTICACIÓN** (Sin token)

```
POST /api/auth/login
  Body: { email, password }
  Response: { token, user }

POST /api/auth/register (Solo SUPER_ADMIN)
  Headers: Authorization: Bearer <token>, X-User-Id: <admin_id>
  Body: { email, password, nombre, role }
  Response: { user }
```

### **USUARIOS** (Token requerido)

```
GET /api/users (Solo SUPER_ADMIN)
  Response: [{ id, nombre, email, role, is_active }, ...]

GET /api/users/by-role/:role (Solo SUPER_ADMIN)
  Response: [{ id, nombre, email }, ...]

GET /api/users/profile/me
  Response: { id, nombre, email, role, is_active }

PUT /api/users/:id (Solo SUPER_ADMIN)
  Body: { nombre, role, is_active }
  Response: { id, nombre }

DELETE /api/users/:id (Solo SUPER_ADMIN)
  Response: { message: "User deactivated" }
```

### **REPORTES** (Token requerido)

```
POST /api/reports (SUPERVISOR, SUPER_ADMIN)
  Body: { titulo, descripcion, locacion, fecha }
  Response: { id, titulo, supervisor_id, created_at }

GET /api/reports (Ver todos si ADMIN, solo suyos si SUPERVISOR)
  Response: [{ id, titulo, descripcion, locacion, supervisor_id }, ...]

PUT /api/reports/:id (SUPERVISOR, SUPER_ADMIN)
  Body: { titulo, descripcion, locacion }
  Response: { id, titulo }

DELETE /api/reports/:id (Solo SUPER_ADMIN)
  Response: { message: "Report deleted" }
```

### **RONDAS** (Token requerido)

```
POST /api/rounds (SUPERVISOR, SUPER_ADMIN)
  Body: { titulo, descripcion, locacion, fecha }
  Response: { id, titulo, supervisor_id, created_at }

GET /api/rounds
  Response: [{ id, titulo, locacion, supervisor_id, fecha }, ...]

PUT /api/rounds/:id (SUPERVISOR, SUPER_ADMIN)
  Body: { titulo, descripcion, locacion }
  Response: { id, titulo }
```

---

## 📦 COMPONENTES REUTILIZABLES (Del v1)

### **UI Components (shadcn/ui)**
Todos estos se pueden reutilizar directamente:

```
✅ components/ui/button.tsx
✅ components/ui/input.tsx
✅ components/ui/card.tsx
✅ components/ui/dialog.tsx
✅ components/ui/alert.tsx
✅ components/ui/badge.tsx
✅ components/ui/dropdown-menu.tsx
✅ components/ui/select.tsx
✅ components/ui/form.tsx
✅ components/ui/label.tsx
✅ components/ui/tabs.tsx
✅ components/ui/table.tsx
✅ components/ui/skeleton.tsx

... y más en components/ui/
```

### **Vistas Principales (Necesitan Refactor)**

| Componente | v1 | v2 | Cambios |
|-----------|----|----|---------|
| LoginView | ✅ | ⚠️ | Firebase Auth → JWT tokens |
| AdminView | ✅ | ⚠️ | Firestore → APIs REST |
| DashboardView | ✅ | ✅ | Reutilizable con cambios menores |
| ProfileView | ✅ | ✅ | Mínimos cambios |
| ReportsView | ✅ | ⚠️ | APIs en lugar de Firestore |
| RoundFormView | ✅ | ⚠️ | APIs en lugar de Firestore |

### **Servicios (Necesitan Reescritura)**

```
❌ firebase.service.ts        → ✅ api.service.ts (NUEVOS)
❌ admin.service.ts           → ✅ admin.api.service.ts (NUEVOS)
❌ auth.service.ts            → ✅ auth.api.service.ts (NUEVOS)
✅ notification.service.ts    → Reutilizable con cambios
✅ utils.ts                   → Reutilizable
✅ types.ts                   → Reutilizable (agregar más tipos)
```

### **Hooks Reutilizables**

```
✅ hooks/use-mobile.ts
✅ hooks/use-toast.ts
✅ hooks/use-gps.ts (para ubicación)
```

---

## 💻 DEPENDENCIAS FRONTEND (package.json v2)

```json
{
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.0.0",
    "axios": "^1.6.2",          // ← NUEVO (para APIs)
    "sonner": "^1.2.0",         // Notificaciones
    "@radix-ui/react-*": "...", // UI Components
    "@hookform/resolvers": "^3.9.1",
    "react-hook-form": "^7.48.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "4.1.0"
  }
}
```

---

## 🗂️ ESTRUCTURA DE CARPETAS v2

```
sj-security-v2/
│
├── frontend/                 # Next.js
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          (Mismo app.tsx, refactorizado)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── admin-view.tsx    (Refactorizado para APIs)
│   │   ├── dashboard-view.tsx
│   │   ├── login-view.tsx    (JWT en lugar de Firebase)
│   │   ├── reports-view.tsx  (APIs)
│   │   ├── round-form-view.tsx
│   │   ├── user-management-modal.tsx
│   │   ├── bottom-navigation.tsx
│   │   ├── profile-view.tsx
│   │   ├── theme-provider.tsx
│   │   ├── notification-center.tsx
│   │   │
│   │   └── ui/               (Copiar del v1)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── ... (todos los UI components)
│   │
│   ├── lib/
│   │   ├── api.service.ts    (NUEVO - APIs REST)
│   │   ├── admin.api.service.ts (NUEVO)
│   │   ├── auth.api.service.ts (NUEVO - JWT)
│   │   ├── types.ts          (Reutilizar + Agregar)
│   │   └── utils.ts          (Reutilizar)
│   │
│   ├── hooks/
│   │   ├── use-mobile.ts     (Reutilizar)
│   │   ├── use-toast.ts      (Reutilizar)
│   │   └── use-gps.ts        (Reutilizar)
│   │
│   ├── public/
│   ├── styles/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── README.md
│
├── backend/                  # Express + Node.js (Igual que ahora)
│   ├── src/
│   │   ├── server.ts
│   │   ├── database.ts
│   │   ├── middleware/auth.ts
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── users.ts
│   │       ├── reports.ts
│   │       └── rounds.ts
│   └── package.json
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

## 🔑 TIPOS TYPESCRIPT (TypeScript)

```typescript
// Copiar de v1 types.ts y agregar/modificar:

export type UserRole = 'SUPER_ADMIN' | 'SUPERVISOR' | 'GUARD';
export type ReportStatus = 'pendiente' | 'visto' | 'finalizado';
export type RoundStatus = 'programada' | 'activa' | 'completada' | 'cancelada';
export type IncidentSeverity = 'BAJA' | 'MEDIA' | 'ALTA';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface Report {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisorId: string;
  fecha: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Round {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisorId: string;
  fecha: string;
  status: RoundStatus;
  createdAt: string;
}

export interface Incident {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisorId: string;
  severidad: IncidentSeverity;
  createdAt: string;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  titulo: string;
  descripcion: string;
  isRead: boolean;
  createdAt: string;
}
```

---

## 🔐 AUTENTICACIÓN (JWT)

### **Flujo de Login**

```
1. Usuario ingresa email + password
2. Frontend hace POST /api/auth/login
3. Backend verifica en PostgreSQL
4. Si OK, retorna JWT token + user data
5. Frontend guarda token en localStorage
6. Todas las requests llevan: Authorization: Bearer <token>
```

### **JWT Token Structure**

```json
{
  "payload": {
    "id": "uuid-del-usuario",
    "email": "user@email.com",
    "role": "SUPER_ADMIN"
  },
  "expiresIn": "24h"
}
```

---

## 📝 NUEVA API SERVICE (Para el Frontend)

Necesita un archivo nuevo: `lib/api.service.ts`

```typescript
// lib/api.service.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Interceptor para agregar token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.api.post('/auth/login', { email, password });
    return res.data;
  }

  // Users
  async getUsers() {
    const res = await this.api.get('/users');
    return res.data;
  }

  async getUsersByRole(role: string) {
    const res = await this.api.get(`/users/by-role/${role}`);
    return res.data;
  }

  // Reports
  async createReport(data: any) {
    const res = await this.api.post('/reports', data);
    return res.data;
  }

  async getReports() {
    const res = await this.api.get('/reports');
    return res.data;
  }

  // ... más métodos
}

export const apiService = new ApiService();
```

---

## 🚀 DEPENDENCIAS NECESARIAS

### **Backend** (Ya incluidas en package.json)
- express
- pg (PostgreSQL)
- jsonwebtoken (JWT)
- bcryptjs (Password hashing)
- cors
- dotenv
- morgan (Logging)
- typescript

### **Frontend** (Necesita agregar)
- axios (Cliente HTTP)
- Mantener: @radix-ui, react-hook-form, sonner, etc.

---

## 📊 MIGRACIONES DE FUNCIONALIDADES

| Feature | v1 (Firebase) | v2 (PostgreSQL) | Estado |
|---------|---------------|-----------------|--------|
| Login | Firebase Auth | JWT + PostgreSQL | ⚠️ |
| Crear Usuario | Firebase Auth + Firestore | PostgreSQL + bcrypt | ⚠️ |
| CRUD Reportes | Firestore | PostgreSQL API | ⚠️ |
| CRUD Rondas | Firestore | PostgreSQL API | ⚠️ |
| Incidencias | Firestore | PostgreSQL API | ⚠️ |
| Ubicaciones GPS | Firestore | PostgreSQL API | ⚠️ |
| Notificaciones | Firestore | PostgreSQL API | ⚠️ |
| Roles/Permisos | Firestore Rules | Backend Middleware | ⚠️ |
| Dashboard Estadísticas | Firestore Queries | PostgreSQL Queries | ⚠️ |

---

## 🎯 CHECKLIST DE DESARROLLO

### **Backend Express** ✅ (Completado)
- [x] Estructura básica
- [x] Database connection
- [x] Auth routes (login, register)
- [x] JWT middleware
- [x] Users CRUD
- [x] Reports CRUD
- [x] Rounds CRUD
- [ ] Incidents CRUD
- [ ] Locations endpoints
- [ ] Notifications endpoints
- [ ] Tests

### **Frontend Next.js** ⬜ (Por hacer)
- [ ] Copiar UI components
- [ ] Crear api.service.ts
- [ ] Refactorizar LoginView
- [ ] Refactorizar AdminView
- [ ] Refactorizar ReportsView
- [ ] Actualizar DashboardView
- [ ] Actualizar RoundFormView
- [ ] Actualizar UserManagementModal
- [ ] Tests

### **Deployment** ⬜ (Por hacer)
- [ ] Backend en Railway
- [ ] PostgreSQL en Railway
- [ ] Frontend en Vercel
- [ ] Variables de entorno configuradas
- [ ] Tests en producción

---

## 📱 PANTALLAS PRINCIPALES

```
┌─────────────────────────────────────────┐
│ 1. LOGIN SCREEN (Todo el mundo)         │
│    - Email input                        │
│    - Password input                     │
│    - Login button                       │
│                                         │
│ Redirige según role:                    │
│ SUPER_ADMIN → Admin Panel               │
│ SUPERVISOR → Dashboard                  │
│ GUARD → Guard Dashboard                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 2. ADMIN PANEL (SUPER_ADMIN)            │
│    ✅ Estadísticas                       │
│    ✅ Lista de usuarios                  │
│    ✅ Crear usuario modal                │
│    ✅ Ver reportes/rondas/incidencias    │
│    ✅ Dashboard con gráficos             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 3. SUPERVISOR DASHBOARD                 │
│    ✅ Mis rondas                        │
│    ✅ Mis reportes                      │
│    ✅ Mis incidencias                   │
│    ✅ Ubicaciones de mis guardias        │
│    ✅ Crear nueva ronda/reporte          │
│    ✅ Notificaciones                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 4. GUARD DASHBOARD                      │
│    ✅ Mapa con mi ubicación              │
│    ✅ Notificaciones                     │
│    ✅ Perfil                             │
│    ✅ Ver reportes compartidos           │
└─────────────────────────────────────────┘
```

---

## 🔒 SEGURIDAD

```
✅ Contraseñas con bcryptjs (10 rounds)
✅ JWT tokens con expiración 24h
✅ Validación de roles en cada endpoint
✅ CORS configurado
✅ Prepared statements (SQL injection safe)
✅ Validación de entrada
✅ Token refrescante (implementar en fase 2)
✅ HTTPS en producción
```

---

## 📈 FASES DE DESARROLLO

```
FASE 1 (Actual): ✅ 
└─ Backend básico (Express + PostgreSQL)
└─ Endpoints CRUD

FASE 2 (Próximo):
└─ Frontend (Next.js) conectado a APIs
└─ Refactorizar componentes
└─ Testing

FASE 3 (Después):
└─ Deploy a Railway + Vercel
└─ Optimizaciones
└─ Monitoreo

FASE 4 (Futura):
└─ Notificaciones en tiempo real (WebSockets)
└─ Sincronización GPS en vivo
└─ Reportes avanzados
└─ Mobile app
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Puedo reutilizar los componentes de v1?**
R: Sí, los UI components (button, card, input, etc.) son 100% reutilizable. Las vistas principales (LoginView, AdminView, etc.) necesitan refactor para usar APIs en lugar de Firebase.

**P: ¿Cómo cambio de Firebase Auth a JWT?**
R: El backend maneja el login completo con PostgreSQL + bcryptjs + JWT. El frontend solo necesita guardar el token y agregarlo en el Authorization header.

**P: ¿Puedo usar Firestore Rules en v2?**
R: No. En v2 usamos PostgreSQL, así que los permisos se validan en el backend mediante middleware de roles.

**P: ¿Cómo migro datos de Firebase a PostgreSQL?**
R: Scripts en el backend. Se puede hacer con un endpoints especial que lee de Firebase y escribe a PostgreSQL.

---

## 🎓 TECNOLOGÍAS

| Capa | v1 | v2 |
|------|----|----|
| Frontend | Next.js 16 + React | Next.js 16 + React ✅ |
| Backend | Firebase Cloud Functions | Express.js ✅ |
| Database | Firestore (NoSQL) | PostgreSQL (SQL) ✅ |
| Auth | Firebase Auth | JWT + PostgreSQL ✅ |
| Hosting | Firebase Hosting | Vercel (front) + Railway (back) |
| Styling | Tailwind + shadcn/ui | Tailwind + shadcn/ui ✅ |

---

## 📌 NOTAS IMPORTANTES

1. **Variables de Entorno Frontend:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api (desarrollo)
   NEXT_PUBLIC_API_URL=https://api.railway.app/api (producción)
   ```

2. **localStorage Token:**
   ```javascript
   // Login exitoso
   localStorage.setItem('token', response.token);
   localStorage.setItem('user', JSON.stringify(response.user));
   
   // On logout
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   ```

3. **CORS en desarrollo:**
   ```
   Backend CORS_ORIGIN=http://localhost:3000
   ```

4. **Contraseña Temporal Admin:**
   - Se genera automáticamente en creación de usuario
   - Se muestra UNA SOLA VEZ en modal
   - Obliga cambio en primer login

---

**PROYECTO LISTO PARA IMPLEMENTACIÓN**

Fecha: 9 Abril 2026  
Responsable: Chat  
Estado: ✅ Especificaciones Completas
