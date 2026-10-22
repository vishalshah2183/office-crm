import { apiClient } from './apiClient';
import { ApiResponse, OfficeFile, WorkflowTask } from '../types';

export interface CreateFilePayload {
  file_number: string;
  odps_number?: string;
  work_type: string;
  applicant_name: string;
  applicant_address?: string;
  applicant_mobile?: string;
  revenue_survey_no?: string;
  city_survey_no?: string;
  tp_scheme_no?: string;
  final_plot_no?: string;
  plot_no?: string;
  permission_type?: string;
  floors?: string;
  specific_built_up_area?: number;
  estimated_amount?: number;
  advance_payment?: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  };
  advance_payment_enabled?: boolean;
  advance_amount?: number | string;
  advance_payment_date?: string;
  advance_payment_method?: string;
  advance_reference_number?: string;
  advance_notes?: string;
}

export interface GetFilesQueryParams {
  search?: string;
  odpsNumber?: string;
  page?: number;
  limit?: number;
}

export interface GetFilesResponseData {
  files: OfficeFile[];
  total?: number;
  totalItems?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  totalPages?: number;
}

export interface AssignTaskPayload {
  assigned_to: number;
  notes?: string;
}

export const fileApi = {
  getFiles: async (params?: GetFilesQueryParams): Promise<ApiResponse<GetFilesResponseData>> => {
    const res = await apiClient.get('/files', { params });
    return res.data;
  },

  createFile: async (payload: CreateFilePayload): Promise<ApiResponse<{ file: OfficeFile }>> => {
    const res = await apiClient.post('/files', payload);
    return res.data;
  },

  updateFile: async (id: number | string, payload: Partial<CreateFilePayload>): Promise<ApiResponse<{ file: OfficeFile }>> => {
    const res = await apiClient.put(`/files/${id}`, payload);
    return res.data;
  },

  deleteFile: async (id: number | string): Promise<ApiResponse<{}>> => {
    const res = await apiClient.delete(`/files/${id}`);
    return res.data;
  },

  getFileById: async (id: number | string): Promise<ApiResponse<{ file: OfficeFile }>> => {
    const res = await apiClient.get(`/files/${id}`);
    return res.data;
  },

  getWorkflow: async (id: number | string): Promise<ApiResponse<{ tasks: WorkflowTask[] }>> => {
    const res = await apiClient.get(`/files/${id}/workflow`);
    return res.data;
  },

  completeTask: async (fileId: number | string, taskId: number, notes?: string): Promise<ApiResponse<{ task: WorkflowTask }>> => {
    const res = await apiClient.patch(`/files/${fileId}/workflow/${taskId}`, { notes });
    return res.data;
  },

  undoTaskCompletion: async (fileId: number | string, taskId: number): Promise<ApiResponse<{ task: WorkflowTask }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/${taskId}/undo-completion`);
    return res.data;
  },

  triggerTask: async (fileId: number | string, taskId: number, notes?: string): Promise<ApiResponse<{ task: WorkflowTask }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/${taskId}/trigger`, { notes });
    return res.data;
  },

  assignTask: async (fileId: number | string, taskId: number, payload: AssignTaskPayload): Promise<ApiResponse<{ task: WorkflowTask }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/${taskId}/assign`, payload);
    return res.data;
  },

  bulkCompleteTasks: async (fileId: number | string, taskIds: number[]): Promise<ApiResponse<{ tasks: WorkflowTask[] }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/bulk-complete`, { taskIds });
    return res.data;
  },

  bulkUndoCompleteTasks: async (fileId: number | string, taskIds: number[]): Promise<ApiResponse<{ tasks: WorkflowTask[] }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/bulk-undo-complete`, { taskIds });
    return res.data;
  },

  bulkAssignTasks: async (fileId: number | string, taskIds: number[], assigned_to: number | null): Promise<ApiResponse<{ tasks: WorkflowTask[] }>> => {
    const res = await apiClient.post(`/files/${fileId}/workflow/bulk-assign`, { taskIds, assigned_to });
    return res.data;
  },
};
