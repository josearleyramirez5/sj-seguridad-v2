# 📋 GUÍA DE MIGRACIÓN: v1 → v2

**Cómo copiar y adaptar componentes de SJ Security v1 a v2**

---

## 📁 COMPONENTES A COPIAR DEL v1

### ✅ COPIAR DIRECTAMENTE (Sin cambios)

Estos componentes pueden copiarse tal cual:

```
sj-security/frontend/components/
├── ui/                             ← TODO
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── select.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── alert.tsx
│   └── ... (todos los UI components)
│
├── theme-provider.tsx             ← Copiar tal cual
├── bottom-navigation.tsx           ← Copiar tal cual
└── notification-center.tsx         ← Copiar tal cual (con cambios menores)
```

**Comando para copiar (Windows PowerShell):**

```powershell
# Copiar toda la carpeta ui
Copy-Item -Path "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\components\ui" `
          -Destination "c:\Users\juana\OneDrive\Escritorio\sj-security-v2\frontend\components\ui" `
          -Recurse

# Copiar componentes individuales
Copy-Item -Path "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\components\theme-provider.tsx" `
          -Destination "c:\Users\juana\OneDrive\Escritorio\sj-security-v2\frontend\components\theme-provider.tsx"
```

---

### ⚠️ COPIAR CON CAMBIOS (Refactorizar)

Estos necesitan ajustes para usar APIs en lugar de Firebase:

#### **1. login-view.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: Firebase Auth
import { authService } from "@/lib/auth.service"

// ✅ DESPUÉS: API Service + JWT
import { apiService } from "@/lib/api.service"

// ❌ ANTES: Guardar user en useState
const handleSubmit = async (e: React.FormEvent) => {
  try {
    const userProfile = await authService.signIn(emailLower, password)
    onLogin(userProfile)  // ← Retorna user completo
  }
}

// ✅ DESPUÉS: Guardar token + user
const handleSubmit = async (e: React.FormEvent) => {
  try {
    const response = await apiService.login(emailLower, password)
    // response = { token, user }
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    onLogin(response.user)
  }
}

// ❌ ANTES: Fallback a mockAuth
if (firebaseError.code === "auth/user-not-found") {
  const name = emailLower.split("@")[0]
  userProfile = mockAuthService.signUp(...)
}

// ✅ DESPUÉS: No necesita fallback
// El backend siempre responde (o error)
```

**Archivo:** `frontend/lib/api.service.ts` (Nuevo)

```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiService = {
  async login(email: string, password: string) {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data; // { token, user }
  },

  async getProfile() {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/users/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // ... más métodos
};
```

---

#### **2. admin-view.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: Firestore queries
import { collection, where, query, onSnapshot } from 'firebase/firestore'

useEffect(() => {
  const q = query(collection(db, 'usuarios'), where('role', '==', 'SUPERVISOR'))
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sups = snapshot.docs.map(doc => doc.data())
    setSupervisores(sups)
  })
  return () => unsubscribe()
}, [])

// ✅ DESPUÉS: API calls
import { apiService } from '@/lib/api.service'

useEffect(() => {
  const loadData = async () => {
    try {
      const sups = await apiService.getUsersByRole('SUPERVISOR')
      setSupervisores(sups)
    } catch (error) {
      console.error('Error loading supervisors:', error)
    }
  }
  loadData()
}, [])
```

---

#### **3. reports-view.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: Firestore
const [reports, setReports] = useState([])

useEffect(() => {
  const q = query(collection(db, 'reportes'))
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const reps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setReports(reps)
  })
  return () => unsubscribe()
}, [])

// ✅ DESPUÉS: API REST
const [reports, setReports] = useState([])

useEffect(() => {
  const loadReports = async () => {
    try {
      const data = await apiService.getReports()
      setReports(data)
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }
  loadReports()
}, [])

const handleCreateReport = async (formData) => {
  try {
    const newReport = await apiService.createReport(formData)
    setReports([newReport, ...reports])
    toast.success('Reporte creado')
  } catch (error) {
    toast.error('Error al crear reporte')
  }
}
```

---

#### **4. user-management-modal.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: adminService.crearUsuario()
import { adminService } from '@/lib/admin.service'

const handleCreateUser = async (userData) => {
  const response = await adminService.crearUsuario({
    nombre: userData.nombre,
    email: userData.email,
    rol: userData.role,
  })
  // response = { user, temporaryPassword }
  showPasswordModal(response.temporaryPassword)
}

// ✅ DESPUÉS: apiService.createUser()
import { apiService } from '@/lib/api.service'

const handleCreateUser = async (userData) => {
  const response = await apiService.createUser({
    nombre: userData.nombre,
    email: userData.email,
    role: userData.role,
    password: generateTempPassword()
  })
  // response = { user, temporaryPassword }
  showPasswordModal(response.temporaryPassword)
}
```

---

#### **5. round-form-view.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: Firebase setDoc()
const handleSubmit = async (data) => {
  await setDoc(doc(db, 'rondas', roundId), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

// ✅ DESPUÉS: API POST/PUT
const handleSubmit = async (data) => {
  if (roundId) {
    await apiService.updateRound(roundId, data)
  } else {
    await apiService.createRound(data)
  }
}
```

---

#### **6. dashboard-view.tsx**

**Cambios principales:**

```typescript
// ❌ ANTES: Cargar datos de Firestore
const loadUserData = async () => {
  const rondas = await getDocs(query(collection(db, 'rondas')))
  const reportes = await getDocs(query(collection(db, 'reportes')))
}

// ✅ DESPUÉS: Cargar de APIs
const loadUserData = async () => {
  const rondas = await apiService.getRounds()
  const reportes = await apiService.getReports()
}
```

---

### 📄 ARCHIVOS A COPIAR DE lib/

```
sj-security/frontend/lib/
├── types.ts                   ← COPIAR (pero agregar nuevos tipos)
├── utils.ts                   ← COPIAR tal cual
├── notification.service.ts    ← COPIAR (cambios menores)
└── (Crear nuevo):
    ├── api.service.ts         ← NUEVO (APIs REST)
    └── auth.api.service.ts    ← NUEVO (JWT login)
```

**No copiar:**
```
❌ firebase.service.ts        → NO NECESARIO
❌ admin.service.ts           → NO NECESARIO
❌ auth.service.ts            → NO NECESARIO (reescribir)
❌ mock-auth.service.ts       → NO NECESARIO
❌ firebaseConfig.js          → NO NECESARIO
```

---

### 📦 HOOKS A COPIAR

```
sj-security/frontend/hooks/
├── use-mobile.ts             ← COPIAR tal cual
├── use-toast.ts              ← COPIAR tal cual
└── use-gps.ts                ← COPIAR tal cual
```

---

## 🔄 RESUMEN DE CAMBIOS GLOBALES

### **Login Flow**

**Antes (Firebase):**
```
Usuario → LoginView → Firebase Auth → localStorage["user"] → App
```

**Después (JWT):**
```
Usuario → LoginView → Backend API → localStorage["token"] + ["user"] → App
```

### **Data Fetching**

**Antes (Firestore):**
```
Component → useEffect → onSnapshot → State update (Real-time)
```

**Después (REST API):**
```
Component → useEffect → axios.get() → State update (Manual refresh)
```

### **Creating Data**

**Antes (Firestore):**
```
Form → setDoc(collection, doc, data) → Listener updates state
```

**Después (REST API):**
```
Form → apiService.create(data) → Response → Manually update state
```

---

## 📝 CHECKLIST DE MIGRACIÓN

### **Step 1: UI Components**
- [ ] Copiar carpeta `components/ui/` completa
- [ ] Copiar `theme-provider.tsx`
- [ ] Copiar `bottom-navigation.tsx`
- [ ] Copiar `notification-center.tsx`

### **Step 2: Utilities**
- [ ] Copiar `lib/types.ts` (y agregar nuevos tipos)
- [ ] Copiar `lib/utils.ts`
- [ ] Copiar todos los hooks

### **Step 3: Services (NUEVOS)**
- [ ] Crear `lib/api.service.ts`
- [ ] Crear `lib/auth.api.service.ts`
- [ ] Crear `lib/admin.api.service.ts`

### **Step 4: Componentes (Refactorizar)**
- [ ] Refactorizar `login-view.tsx`
- [ ] Refactorizar `admin-view.tsx`
- [ ] Refactorizar `reports-view.tsx`
- [ ] Refactorizar `round-form-view.tsx`
- [ ] Refactorizar `user-management-modal.tsx`
- [ ] Actualizar `dashboard-view.tsx`
- [ ] Actualizar `profile-view.tsx`

### **Step 5: Testing**
- [ ] Verificar login funciona con JWT
- [ ] Verificar CRUD de reportes
- [ ] Verificar CRUD de rondas
- [ ] Verificar permisos por rol

---

## 🚀 COMANDO PARA COPIAR RÁPIDO (Windows)

```powershell
# Entrar a carpeta de destino
cd "c:\Users\juana\OneDrive\Escritorio\sj-security-v2\frontend"

# Crear structure
mkdir -p components/ui
mkdir -p lib
mkdir -p hooks
mkdir -p styles

# Copiar UI components
Copy-Item -Path "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\components\ui\*" `
          -Destination "components\ui" -Recurse

# Copiar providers/theme
Copy-Item "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\components\theme-provider.tsx" `
          components\

# Copiar lib
Copy-Item "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\lib\types.ts" lib\
Copy-Item "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\lib\utils.ts" lib\

# Copiar hooks
Copy-Item -Path "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\hooks\*" `
          -Destination "hooks" -Recurse

# Copiar componentes principales (después refactorizar)
Copy-Item "c:\Users\juana\OneDrive\Escritorio\sj security\frontend\components\login-view.tsx" `
          components\

# ... más copias según necesidad
```

---

## 🎯 ORDEN RECOMENDADO

```
1. Copiar UI components (fácil) ← EMPEZAR AQUÍ
2. Copiar utilities y hooks
3. Copiar componentes grandes
4. Crear api.service.ts
5. Refactorizar login-view
6. Refactorizar admin-view
7. Refactorizar reports-view
8. Actualizar otros componentes
9. Pruebas integrales
```

---

## 💡 NOTAS IMPORTANTES

1. **CORS Header:**
   - En v2, el backend valida CORS
   - Asegurar que `CORS_ORIGIN` en .env del backend apunta al frontend

2. **localStorage:**
   - v1: `localStorage['user']`
   - v2: `localStorage['token']` + `localStorage['user']`
   - Actualizar los interceptores de axios

3. **Error Handling:**
   - v1: Firebase errors con código específico (auth/user-not-found)
   - v2: HTTP status codes (401, 403, 404, 500)
   - Actualizar manejo de errores

4. **Real-time vs Manual:**
   - v1: Firestore escuchaba cambios en tiempo real
   - v2: API REST necesita refresh manual o polling
   - Considerar agregar WebSockets después (fase 2)

---

**Documento completado: 9 Abril 2026**
