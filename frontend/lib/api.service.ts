import axios, { AxiosError } from 'axios';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const localFallbackApiUrl = 'http://localhost:5000/api';
const API_URL = configuredApiUrl || localFallbackApiUrl;
const HEALTH_URL = `${API_URL.replace(/\/api\/?$/, '')}/health`;

type BackendRole = 'SUPER_ADMIN' | 'SUPERVISOR' | 'GUARD';
type AppRole = 'admin' | 'supervisor' | 'guard';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  backendRole: BackendRole;
  createdAt?: string;
  isActive?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  supervisorId: string;
  severity: 'BAJA' | 'MEDIA' | 'ALTA';
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  title: string;
  description: string;
  location: string;
  supervisorId: string;
  scheduledAt: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  location: string;
  supervisorId: string;
  scheduledAt: string;
  createdAt: string;
  status: 'attention' | 'completed';
  alertCount: number;
}

interface BackendAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    role: BackendRole;
    created_at?: string;
    is_active?: boolean;
  };
}

interface BackendUser {
  id: string;
  email: string;
  nombre: string;
  role: BackendRole;
  created_at?: string;
  is_active?: boolean;
}

interface BackendNotification {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string;
  is_read: boolean;
  created_at: string;
}

interface BackendIncident {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisor_id: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA';
  created_at: string;
  updated_at: string;
}

interface BackendRound {
  id: string;
  titulo: string;
  descripcion?: string;
  locacion: string;
  supervisor_id: string;
  fecha?: string;
  created_at: string;
}

interface BackendReport {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisor_id: string;
  fecha?: string;
  created_at: string;
}

function mapRole(role: BackendRole): AppRole {
  if (role === 'SUPER_ADMIN') {
    return 'admin';
  }
  if (role === 'SUPERVISOR') {
    return 'supervisor';
  }
  return 'guard';
}

function parseAlertCount(description: string): number {
  const match = description.match(/^Alertas:\s*(\d+)/im);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function mapUser(raw: BackendUser): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.nombre,
    role: mapRole(raw.role),
    backendRole: raw.role,
    createdAt: raw.created_at,
    isActive: raw.is_active,
  };
}

function mapRound(raw: BackendRound): Round {
  return {
    id: raw.id,
    title: raw.titulo,
    description: raw.descripcion || '',
    location: raw.locacion,
    supervisorId: raw.supervisor_id,
    scheduledAt: raw.fecha || raw.created_at,
    createdAt: raw.created_at,
  };
}

function mapNotification(raw: BackendNotification): Notification {
  return {
    id: raw.id,
    userId: raw.usuario_id,
    title: raw.titulo,
    description: raw.descripcion,
    isRead: raw.is_read,
    createdAt: raw.created_at,
  };
}

function mapIncident(raw: BackendIncident): Incident {
  return {
    id: raw.id,
    title: raw.titulo,
    description: raw.descripcion,
    location: raw.locacion,
    supervisorId: raw.supervisor_id,
    severity: raw.severidad,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapReport(raw: BackendReport): Report {
  const alertCount = parseAlertCount(raw.descripcion || '');

  return {
    id: raw.id,
    title: raw.titulo,
    description: raw.descripcion,
    location: raw.locacion,
    supervisorId: raw.supervisor_id,
    scheduledAt: raw.fecha || raw.created_at,
    createdAt: raw.created_at,
    status: alertCount > 0 ? 'attention' : 'completed',
    alertCount,
  };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisa la conexión o la configuración de la API.';
    }

    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// Instancia de axios con interceptor
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Interceptor para agregar token JWT
axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (!configuredApiUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      throw new Error('La aplicación no tiene configurada la URL pública de la API.');
    }

    try {
      const response = await axiosInstance.post<BackendAuthResponse>('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      return {
        token: response.data.token,
        user: mapUser(response.data.user),
      };
    } catch (error) {
      console.error('Login request failed', error);
      throw new Error(extractErrorMessage(error, 'No fue posible iniciar sesión'));
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getUsers(): Promise<User[]> {
    const response = await axiosInstance.get<BackendUser[]>('/users');
    return response.data.map(mapUser);
  },

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    backendRole: BackendRole;
  }): Promise<User> {
    try {
      const response = await axiosInstance.post<{ user: BackendUser }>('/auth/register', {
        email: data.email,
        password: data.password,
        nombre: data.name,
        role: data.backendRole,
      });

      return mapUser(response.data.user);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'No fue posible crear el usuario'));
    }
  },

  async getMyProfile(): Promise<User> {
    const response = await axiosInstance.get<BackendUser>('/users/profile/me');
    return mapUser(response.data);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<BackendUser>(`/users/${id}`, {
      nombre: data.name,
      role: data.backendRole,
      is_active: data.isActive,
    });
    return mapUser(response.data);
  },

  async deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  async getNotifications(): Promise<Notification[]> {
    const response = await axiosInstance.get<BackendNotification[]>('/notifications');
    return response.data.map(mapNotification);
  },

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await axiosInstance.put<BackendNotification>(`/notifications/${id}/read`);
    return mapNotification(response.data);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    await axiosInstance.put('/notifications/read-all');
  },

  async getIncidents(): Promise<Incident[]> {
    const response = await axiosInstance.get<BackendIncident[]>('/incidents');
    return response.data.map(mapIncident);
  },

  async createIncident(data: {
    title: string;
    description: string;
    location: string;
    severity: Incident['severity'];
  }): Promise<Incident> {
    const response = await axiosInstance.post<BackendIncident>('/incidents', {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
      severidad: data.severity,
    });
    return mapIncident(response.data);
  },

  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const response = await axiosInstance.put<BackendIncident>(`/incidents/${id}`, {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
      severidad: data.severity,
    });
    return mapIncident(response.data);
  },

  async deleteIncident(id: string): Promise<void> {
    await axiosInstance.delete(`/incidents/${id}`);
  },

  async getRounds(): Promise<Round[]> {
    const response = await axiosInstance.get<BackendRound[]>('/rounds');
    return response.data.map(mapRound);
  },

  async createRound(data: {
    title: string;
    description: string;
    location: string;
    scheduledAt?: string;
  }): Promise<Round> {
    const response = await axiosInstance.post<BackendRound>('/rounds', {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
      fecha: data.scheduledAt,
    });
    return mapRound(response.data);
  },

  async updateRound(id: string, data: Partial<Round>): Promise<Round> {
    const response = await axiosInstance.put<BackendRound>(`/rounds/${id}`, {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
    });
    return mapRound(response.data);
  },

  async completeRound(data: {
    title: string;
    description: string;
    location: string;
    scheduledAt?: string;
  }): Promise<{ round: Round; report: Report }> {
    const response = await axiosInstance.post<{ round: BackendRound; report: BackendReport }>('/rounds/complete', {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
      fecha: data.scheduledAt,
    });

    return {
      round: mapRound(response.data.round),
      report: mapReport(response.data.report),
    };
  },

  async getReports(): Promise<Report[]> {
    const response = await axiosInstance.get<BackendReport[]>('/reports');
    return response.data.map(mapReport);
  },

  async createReport(data: {
    title: string;
    description: string;
    location: string;
    scheduledAt?: string;
  }): Promise<Report> {
    const response = await axiosInstance.post<BackendReport>('/reports', {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
      fecha: data.scheduledAt,
    });
    return mapReport(response.data);
  },

  async updateReport(id: string, data: Partial<Report>): Promise<Report> {
    const response = await axiosInstance.put<BackendReport>(`/reports/${id}`, {
      titulo: data.title,
      descripcion: data.description,
      locacion: data.location,
    });
    return mapReport(response.data);
  },

  async deleteReport(id: string): Promise<void> {
    await axiosInstance.delete(`/reports/${id}`);
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await axios.get(HEALTH_URL);
    return response.data;
  },
};
