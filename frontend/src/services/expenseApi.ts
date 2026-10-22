import { apiClient } from './apiClient';
import { ApiResponse, Expense } from '../types';

export interface CreateExpensePayload {
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  employee_id?: number;
}

export interface ExpenseFilterParams {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  minAmount?: number | string;
  maxAmount?: number | string;
  employeeId?: number | string;
  page?: number;
  limit?: number | string;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface GetExpensesResponse {
  expenses: Expense[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  totalExpenseAmount?: number;
  categoryBreakdown?: ExpenseCategoryBreakdown[];
}

export const expenseApi = {
  createExpense: async (payload: CreateExpensePayload): Promise<ApiResponse<{ expense: Expense }>> => {
    const res = await apiClient.post('/expenses', payload);
    return res.data;
  },

  getExpenses: async (params?: ExpenseFilterParams): Promise<ApiResponse<GetExpensesResponse>> => {
    const res = await apiClient.get('/expenses', { params });
    return res.data;
  },

  updateExpense: async (id: number | string, payload: Partial<CreateExpensePayload>): Promise<ApiResponse<{ expense: Expense }>> => {
    const res = await apiClient.put(`/expenses/${id}`, payload);
    return res.data;
  },

  deleteExpense: async (id: number | string): Promise<ApiResponse<{}>> => {
    const res = await apiClient.delete(`/expenses/${id}`);
    return res.data;
  },
};
