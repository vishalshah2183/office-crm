export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string | string[]>;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  permissions?: RolePermissions | string;
}

export type PermissionAction = 'read' | 'write' | 'delete';
export type RolePermissions = Record<string, Record<PermissionAction, boolean>>;

export interface Employee {
  id: number;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  role_id: number;
  is_active: boolean;
  monthly_salary?: number;
  upad_balance?: number;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfficeFile {
  id: number;
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
  current_status: string;
  assigned_employee_id?: number;
  assigned_employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
  workflowTasks?: WorkflowTask[];
}

export interface WorkflowTask {
  id: number;
  file_id: number;
  task_key: string;
  title: string;
  category: string;
  sequence: number;
  is_optional: boolean;
  is_triggered: boolean;
  default_designation?: string;
  assigned_to?: number;
  assigned_by?: number;
  assigned_at?: string;
  completed_by?: number;
  completed_at?: string;
  notes?: string;
  assignee?: Employee;
  assigner?: Employee;
  completer?: Employee;
  file?: Pick<OfficeFile, 'id' | 'file_number' | 'applicant_name' | 'work_type'>;
  createdAt?: string;
  updatedAt?: string;
  activities?: WorkflowTaskActivity[];
}

export interface WorkflowTaskActivity {
  id: number;
  task_id: number;
  actor_id: number;
  action: string;
  assigned_to?: number;
  notes?: string;
  actor?: Employee;
  assignedEmployee?: Employee;
  createdAt?: string;
  created_at?: string;
}

export interface FileStatusHistory {
  id: number;
  file_id: number;
  status: string;
  notes?: string;
  changed_by?: number;
  changer?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileAssignment {
  id: number;
  file_id: number;
  assigned_to: number;
  assignment_type: string;
  notes?: string;
  assignee?: Employee;
  assigner?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quotation {
  id: number;
  file_id: number;
  quotation_number: string;
  amount: number;
  status: 'DRAFT' | 'FINAL' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  file_id: number;
  quotation_id?: number;
  amount: number;
  payment_type: string;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  creator?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  totalQuotationAmount?: number;
  totalPaidAmount?: number;
  outstandingAmount?: number;
  [key: string]: any;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  employee_id?: number;
  employee?: Employee;
  created_by?: number;
  creator?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  summary?: Record<string, any>;
  totalFiles?: number;
  activeFiles?: number;
  totalEmployees?: number;
  totalQuotationsAmount?: number;
  totalPaymentsReceived?: number;
  totalExpenses?: number;
  outstandingPayments?: number;
  [key: string]: any;
}
