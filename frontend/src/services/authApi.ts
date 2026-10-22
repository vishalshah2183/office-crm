import { apiClient } from './apiClient';
import { ApiResponse, Employee } from '../types';

export interface LoginCredentials {
  mobile?: string;
  email?: string;
  identifier?: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginResponseData {
  token: string;
  employee?: Employee;
  user?: Employee;
}

export interface MeResponseData {
  employee: Employee;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  signup: async (payload: SignupPayload): Promise<ApiResponse<LoginResponseData>> => {
    const res = await apiClient.post('/auth/signup', payload);
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<MeResponseData>> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
};
