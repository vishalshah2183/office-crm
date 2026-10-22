import { apiClient } from './apiClient';
import { ApiResponse, Quotation, FinancialSummary } from '../types';

export interface CreateQuotationPayload {
  quotation_number: string;
  amount: number;
  status?: string;
}

export interface GetFileQuotationsResponseData {
  quotations: Quotation[];
  summary?: FinancialSummary;
}

export const quotationApi = {
  createQuotation: async (fileId: number | string, payload: CreateQuotationPayload): Promise<ApiResponse<{ quotation: Quotation }>> => {
    const res = await apiClient.post(`/files/${fileId}/quotations`, payload);
    return res.data;
  },

  finalizeQuotation: async (quotationId: number | string): Promise<ApiResponse<{ quotation: Quotation }>> => {
    const res = await apiClient.post(`/quotations/${quotationId}/finalize`);
    return res.data;
  },

  getFileQuotations: async (fileId: number | string): Promise<ApiResponse<GetFileQuotationsResponseData>> => {
    const res = await apiClient.get(`/files/${fileId}/quotations`);
    return res.data;
  },
};
