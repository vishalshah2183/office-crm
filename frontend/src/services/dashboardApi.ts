import { apiClient } from './apiClient';
import { ApiResponse, DashboardSummary, WorkflowTask } from '../types';

export const dashboardApi = {
  getSummary: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<DashboardSummary>> => {
    const res = await apiClient.get('/dashboard/summary', { params });
    return res.data;
  },
  getMyTasks: async (): Promise<ApiResponse<{ tasks: WorkflowTask[] }>> => {
    const res = await apiClient.get('/dashboard/my-tasks');
    return res.data;
  },
};
