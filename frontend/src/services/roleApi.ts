import { apiClient } from './apiClient';
import { ApiResponse, Role, RolePermissions } from '../types';

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: RolePermissions;
}

export const roleApi = {
  getRoles: async (): Promise<ApiResponse<{ roles: Role[] }>> => {
    const res = await apiClient.get('/roles');
    return res.data;
  },

  createRole: async (payload: CreateRolePayload): Promise<ApiResponse<{ role: Role }>> => {
    const res = await apiClient.post('/roles', payload);
    return res.data;
  },

  updateRole: async (id: number | string, payload: Partial<CreateRolePayload>): Promise<ApiResponse<{ role: Role }>> => {
    const res = await apiClient.put(`/roles/${id}`, payload);
    return res.data;
  },
};
