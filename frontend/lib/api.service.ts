import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipos de respuesta
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'supervisor' | 'user';
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'user';
  createdAt: string;
}

export interface Round {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Report {
  id: string;
  roundId: string;
  supervised_by: string;
  observations: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Instancia de axios con interceptor
const axiosInstance = axios.create({
  baseURL: API_URL,
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
    if (error.response?.status === 401) {
      // Token expirado o inválido
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
  // ==================== AUTH ====================
  
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error((error.response.data as any).message || 'Login failed');
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ==================== USERS ====================

  async getUsers(): Promise<User[]> {
    const response = await axiosInstance.get<User[]>('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  // ==================== ROUNDS ====================

  async getRounds(): Promise<Round[]> {
    const response = await axiosInstance.get<Round[]>('/rounds');
    return response.data;
  },

  async getRoundById(id: string): Promise<Round> {
    const response = await axiosInstance.get<Round>(`/rounds/${id}`);
    return response.data;
  },

  async createRound(data: { name: string; description: string }): Promise<Round> {
    const response = await axiosInstance.post<Round>('/rounds', data);
    return response.data;
  },

  async updateRound(id: string, data: Partial<Round>): Promise<Round> {
    const response = await axiosInstance.put<Round>(`/rounds/${id}`, data);
    return response.data;
  },

  async deleteRound(id: string): Promise<void> {
    await axiosInstance.delete(`/rounds/${id}`);
  },

  // ==================== REPORTS ====================

  async getReports(): Promise<Report[]> {
    const response = await axiosInstance.get<Report[]>('/reports');
    return response.data;
  },

  async getReportsByRound(roundId: string): Promise<Report[]> {
    const response = await axiosInstance.get<Report[]>(`/reports?roundId=${roundId}`);
    return response.data;
  },

  async createReport(data: {
    roundId: string;
    supervised_by: string;
    observations: string;
  }): Promise<Report> {
    const response = await axiosInstance.post<Report>('/reports', data);
    return response.data;
  },

  async updateReport(id: string, data: Partial<Report>): Promise<Report> {
    const response = await axiosInstance.put<Report>(`/reports/${id}`, data);
    return response.data;
  },

  async deleteReport(id: string): Promise<void> {
    await axiosInstance.delete(`/reports/${id}`);
  },

  // ==================== HEALTH ====================

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await axiosInstance.get('/health');
    return response.data;
  },
};
