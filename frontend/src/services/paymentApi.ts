import { apiClient } from './apiClient';
import { ApiResponse, Payment, FinancialSummary } from '../types';

export interface RegisterPaymentPayload {
  quotation_id?: number;
  amount: number;
  payment_type: string;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface GetFilePaymentsResponseData {
  payments: Payment[];
  summary?: FinancialSummary;
}

export const paymentApi = {
  registerPayment: async (fileId: number | string, payload: RegisterPaymentPayload): Promise<ApiResponse<{ payment: Payment; summary: FinancialSummary }>> => {
    const res = await apiClient.post(`/files/${fileId}/payments`, payload);
    return res.data;
  },

  updatePayment: async (fileId: number | string, paymentId: number | string, payload: Partial<RegisterPaymentPayload>): Promise<ApiResponse<{ payment: Payment; summary: FinancialSummary }>> => {
    const res = await apiClient.put(`/files/${fileId}/payments/${paymentId}`, payload);
    return res.data;
  },

  getFilePayments: async (fileId: number | string): Promise<ApiResponse<GetFilePaymentsResponseData>> => {
    const res = await apiClient.get(`/files/${fileId}/payments`);
    return res.data;
  },
};
