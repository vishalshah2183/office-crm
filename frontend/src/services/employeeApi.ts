import { apiClient } from './apiClient';
import { ApiResponse, Employee } from '../types';

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  designation: string;
  role_id: number;
  monthly_salary?: number;
  upad_balance?: number;
}

export interface UpdateEmployeePayload {
  name: string;
  email: string;
  mobile: string;
  designation: string;
  role_id: number;
  password?: string;
  monthly_salary?: number;
  upad_balance?: number;
}

export interface UpadAdvancePayload {
  amount: number;
  expense_date?: string;
  notes?: string;
}

export const employeeApi = {
  getEmployees: async (): Promise<ApiResponse<{ employees: Employee[] }>> => {
    const res = await apiClient.get('/employees');
    return res.data;
  },

  createEmployee: async (payload: CreateEmployeePayload): Promise<ApiResponse<{ employee: Employee }>> => {
    const res = await apiClient.post('/employees', payload);
    return res.data;
  },

  updateEmployee: async (id: number | string, payload: UpdateEmployeePayload): Promise<ApiResponse<{ employee: Employee }>> => {
    const res = await apiClient.put(`/employees/${id}`, payload);
    return res.data;
  },

  getEmployeeById: async (id: number | string): Promise<ApiResponse<{ employee: Employee }>> => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data;
  },

  toggleStatus: async (id: number | string, is_active: boolean): Promise<ApiResponse<{ employee: Employee }>> => {
    const res = await apiClient.patch(`/employees/${id}/status`, { is_active });
    return res.data;
  },

  logUpadAdvance: async (id: number | string, payload: UpadAdvancePayload): Promise<ApiResponse<{ employee: Employee }>> => {
    const res = await apiClient.post(`/employees/${id}/upad`, payload);
    return res.data;
  },
};
