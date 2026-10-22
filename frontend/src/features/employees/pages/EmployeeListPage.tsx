import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Formik, Form } from 'formik';
import { Users, UserPlus, Shield, Search, Loader2, Pencil, Receipt } from 'lucide-react';
import { employeeApi, CreateEmployeePayload, UpdateEmployeePayload } from '../../../services/employeeApi';
import { employeeSchema, employeeUpdateSchema } from '../validation/employeeSchema';
import { roleApi } from '../../../services/roleApi';
import { useToast } from '../../../components/feedback/ToastContext';
import { formatCurrency } from '../../../utils/formatters';
import { FormField } from '../../../components/forms/FormField';
import { FormSelect } from '../../../components/forms/FormSelect';
import { SubmitButton } from '../../../components/forms/SubmitButton';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Employee } from '../../../types';
import { useAuth } from '../../../app/providers/AuthContext';

export const EmployeeListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusDialogEmployee, setStatusDialogEmployee] = useState<Employee | null>(null);

  // Fetch employees
  const { data: employeesData, isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeApi.getEmployees();
      return res.data?.employees || [];
    },
  });

  // Fetch roles for create form select
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await roleApi.getRoles();
      return res.data?.roles || [];
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await employeeApi.toggleStatus(id, is_active);
    },
    onSuccess: (_, variables) => {
      toast.success(
        'Status Updated',
        `Employee status changed to ${variables.is_active ? 'Active' : 'Inactive'}`
      );
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setStatusDialogEmployee(null);
    },
    onError: (err: any) => {
      toast.error('Failed to update status', err.response?.data?.message || 'API error');
    },
  });

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const filteredEmployees = employees.filter(
    (emp) =>
      emp?.name?.toLowerCase()?.trim()?.includes(searchTerm.toLowerCase()?.trim()) ||
      emp?.email?.toLowerCase()?.trim()?.includes(searchTerm.toLowerCase()?.trim()) ||
      emp?.designation?.toLowerCase()?.trim()?.includes(searchTerm.toLowerCase()?.trim())
  );

  const roleOptions = (rolesData || []).map((r) => ({
    value: r.id,
    label: `${r.name} (${r.description || 'No description'})`,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Employee Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage company staff members, office designations, and role assignments.
          </p>
        </div>

        {hasPermission('employees', 'write') && <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Add New Employee</span>
        </button>}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, email, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Employees Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Failed to load employee list from server.
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={searchTerm ? 'No staff member matches your search filter.' : 'No employee records exist yet.'}
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg"
            >
              Add First Employee
            </button>
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Salary / UPAD</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{emp.name}</div>
                          <div className="text-[10px] text-slate-500">ID: #{emp.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{emp.email}</div>
                      <div className="text-[11px] text-slate-400">{emp.mobile}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {emp.designation}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        <Shield className="w-3 h-3 mr-1 text-cyan-400" />
                        {emp.role?.name || `Role #${emp.role_id}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="text-slate-200 font-mono font-medium">
                          Salary: {formatCurrency(emp.monthly_salary || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500">Manage salary and UPAD in expense records</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={emp.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {hasPermission('expenses', 'write') && hasPermission('employees', 'read') && (
                        <a
                          href={`/expenses?employeeId=${emp.id}`}
                          title={`Manage salary and UPAD records for ${emp.name}`}
                          className="inline-flex items-center px-2.5 py-1 mr-2 rounded text-xs font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Records
                        </a>
                      )}
                      {hasPermission('employees', 'write') && <button
                        type="button"
                        onClick={() => {
                          setEditingEmployee(emp);
                          setIsCreateModalOpen(true);
                        }}
                        disabled={!emp.is_active}
                        title={`Edit ${emp.name}`}
                        className={`inline-flex items-center px-2.5 py-1 mr-2 rounded text-xs font-semibold transition-colors ${emp.is_active
                            ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20'
                            : 'text-slate-500 bg-slate-800/50 border border-slate-700/50 cursor-not-allowed'
                          }`}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>}
                      {hasPermission('employees', 'write') && <button
                        onClick={() => setStatusDialogEmployee(emp)}
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold transition-colors ${emp.is_active
                            ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20'
                            : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                      >
                        {emp.is_active ? 'Deactivate' : 'Activate'}
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEmployee(null);
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        subtitle={editingEmployee ? 'Update staff member details and office role' : 'Register new staff member credentials and office role'}
        maxWidth="lg"
      >
        <Formik
          initialValues={{
            name: editingEmployee?.name || '',
            email: editingEmployee?.email || '',
            password: '',
            mobile: editingEmployee?.mobile || '',
            designation: editingEmployee?.designation || '',
            role_id: editingEmployee?.role_id || ((rolesData && rolesData.length > 0 ? rolesData[0].id : '') as any),
            monthly_salary: editingEmployee?.monthly_salary || 0,
          }}
          enableReinitialize
          validationSchema={editingEmployee ? employeeUpdateSchema : employeeSchema}
          onSubmit={async (values, { setSubmitting, setFieldError, resetForm }) => {
            try {
              const payload = {
                ...values,
                role_id: Number(values.role_id),
                monthly_salary: Number(values.monthly_salary) || 0,
              };
              const res = editingEmployee
                ? await employeeApi.updateEmployee(editingEmployee.id, {
                  ...(payload as UpdateEmployeePayload),
                  ...(values.password ? { password: values.password } : {}),
                })
                : await employeeApi.createEmployee(payload as CreateEmployeePayload);
              if (res.success) {
                toast.success(
                  editingEmployee ? 'Employee Updated' : 'Employee Created',
                  editingEmployee ? `${values.name} has been updated successfully.` : `${values.name} has been added successfully.`
                );
                queryClient.invalidateQueries({ queryKey: ['employees'] });
                resetForm();
                setIsCreateModalOpen(false);
                setEditingEmployee(null);
              }
            } catch (err: any) {
              const msg = err.response?.data?.message || err.response?.data?.error || `Failed to ${editingEmployee ? 'update' : 'create'} employee`;
              toast.error(editingEmployee ? 'Update Failed' : 'Creation Failed', msg);
              if (err.response?.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, message]) => {
                  setFieldError(field, Array.isArray(message) ? message[0] : (message as string));
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {() => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="name" label="Full Name" placeholder="John Architect" required />
                <FormField name="mobile" label="Mobile Number" placeholder="9876543210" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="password" label={editingEmployee ? 'Password (Optional)' : 'Password'} type="password" placeholder={editingEmployee ? 'Leave blank to keep current password' : '••••••••'} required={!editingEmployee} />
                <FormField name="email" label="Email Address (Optional)" type="email" placeholder="john@example.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField name="designation" label="Designation" placeholder="Senior Draftsman" required />
                <FormField name="monthly_salary" label="Monthly Base Salary (₹)" type="number" step="500" min="0" placeholder="25000" />
                <FormSelect
                  name="role_id"
                  label="Office Role"
                  options={roleOptions}
                  placeholder="Select Role"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton>{editingEmployee ? 'Update Employee Record' : 'Create Employee Record'}</SubmitButton>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Toggle Status Dialog */}
      {statusDialogEmployee && (
        <Modal
          isOpen={!!statusDialogEmployee}
          onClose={() => setStatusDialogEmployee(null)}
          title={statusDialogEmployee.is_active ? 'Deactivate Employee' : 'Activate Employee'}
          subtitle={`Confirmation for ${statusDialogEmployee.name}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <p>
              Are you sure you want to{' '}
              <strong className={statusDialogEmployee.is_active ? 'text-rose-400' : 'text-emerald-400'}>
                {statusDialogEmployee.is_active ? 'deactivate' : 'activate'}
              </strong>{' '}
              employee record for <strong>{statusDialogEmployee.name}</strong> ({statusDialogEmployee.email})?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusDialogEmployee(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    id: statusDialogEmployee.id,
                    is_active: !statusDialogEmployee.is_active,
                  })
                }
                className={`inline-flex items-center px-4 py-1.5 rounded-lg font-semibold text-white ${statusDialogEmployee.is_active
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
              >
                {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Confirm Status Change
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
