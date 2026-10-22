import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import { ShieldCheck, Plus, Shield, Pencil } from 'lucide-react';
import { roleApi, CreateRolePayload } from '../../../services/roleApi';
import { roleSchema } from '../validation/roleSchema';
import { useToast } from '../../../components/feedback/ToastContext';
import { FormField } from '../../../components/forms/FormField';
import { FormTextarea } from '../../../components/forms/FormTextarea';
import { SubmitButton } from '../../../components/forms/SubmitButton';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Role, RolePermissions } from '../../../types';
import { useAuth } from '../../../app/providers/AuthContext';

const permissionModules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'files', label: 'Office Files' },
  { key: 'employees', label: 'Employees' },
  { key: 'roles', label: 'Roles' },
  { key: 'expenses', label: 'Expenses' },
];

const defaultPermissions = (): RolePermissions => Object.fromEntries(
  permissionModules.map(({ key }) => [key, { read: true, write: false, delete: false }])
);

const normalizePermissions = (permissions?: RolePermissions | string): RolePermissions => {
  if (!permissions) return defaultPermissions();
  if (typeof permissions === 'string') {
    try {
      return { ...defaultPermissions(), ...JSON.parse(permissions) };
    } catch (error) {
      return defaultPermissions();
    }
  }
  return { ...defaultPermissions(), ...permissions };
};

export const RoleListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasPermission, user, refreshUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: rolesData, isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await roleApi.getRoles();
      return res.data?.roles || [];
    },
  });

  const roles = Array.isArray(rolesData) ? rolesData : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Roles & Administrative Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define job roles and access responsibilities across the studio portal.
          </p>
        </div>

        {hasPermission('roles', 'write') && <button
          onClick={() => { setEditingRole(null); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New Role</span>
        </button>}
      </div>

      {/* Roles Grid / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Failed to load roles from API server.
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          title="No roles found"
          description="Create your first role designation for employees."
          action={
            hasPermission('roles', 'write') && <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg"
            >
              Create Role
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    {role.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: #{role.id}</span>
                </div>
                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {role.description || 'No description provided for this role.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{Object.values(normalizePermissions(role.permissions)).filter((permission) => permission.read).length} modules enabled</span>
                {hasPermission('roles', 'write') && <button type="button" onClick={() => { setEditingRole(role); setIsModalOpen(true); }} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                  <Pencil className="w-3 h-3" /> Edit access
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRole(null); }}
        title={editingRole ? 'Edit Role Permissions' : 'Create New Role'}
        subtitle={editingRole ? `Configure access for ${editingRole.name}` : 'Define new job role designation'}
        maxWidth="md"
      >
        <Formik
          initialValues={{ name: editingRole?.name || '', description: editingRole?.description || '', permissions: normalizePermissions(editingRole?.permissions) }}
          enableReinitialize
          validationSchema={roleSchema}
          onSubmit={async (values, { setSubmitting, setFieldError, resetForm }) => {
            try {
              const res = editingRole
                ? await roleApi.updateRole(editingRole.id, { description: values.description, permissions: values.permissions })
                : await roleApi.createRole(values);
              if (res.success) {
                toast.success(editingRole ? 'Role Updated' : 'Role Created', editingRole ? `Access for ${values.name} has been updated.` : `Role ${values.name} has been added.`);
                queryClient.invalidateQueries({ queryKey: ['roles'] });
                if (editingRole?.id === user?.role_id) await refreshUser();
                resetForm();
                setIsModalOpen(false);
                setEditingRole(null);
              }
            } catch (err: any) {
              const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create role';
              toast.error('Creation Failed', msg);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-4">
              <FormField
                name="name"
                label="Role Identifier / Name"
                placeholder="DRAFTSMAN"
                required
                helperText="Use uppercase identifiers (e.g. ARCHITECT, DRAFTSMAN, MANAGER)"
                disabled={!!editingRole}
              />

              <FormTextarea
                name="description"
                label="Role Description"
                placeholder="Responsible for drawing work and building plan drafting..."
                rows={3}
              />

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">Module Permissions</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-950/70 text-slate-400">
                      <tr>
                        <th className="text-left p-3">Module</th>
                        {(['read', 'write', 'delete'] as const).map((action) => {
                          const allSelected = permissionModules.every(({ key }) => Boolean(values.permissions?.[key]?.[action]));
                          return <th className="p-3" key={action}>
                            <button
                              type="button"
                              aria-pressed={allSelected}
                              title={`${allSelected ? 'Clear' : 'Select'} all ${action} permissions`}
                              onClick={() => permissionModules.forEach(({ key }) => setFieldValue(`permissions.${key}.${action}`, !allSelected))}
                              className={`px-2 py-1 rounded border text-[10px] font-semibold capitalize ${allSelected ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
                            >
                              {allSelected ? `Clear all ${action}` : `Select all ${action}`}
                            </button>
                          </th>;
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {permissionModules.map(({ key, label }) => (
                        <tr key={key}>
                          <td className="p-3 text-slate-200">{label}</td>
                          {(['read', 'write', 'delete'] as const).map((action) => (
                            <td className="p-3 text-center" key={action}><Field type="checkbox" name={`permissions.${key}.${action}`} className="accent-cyan-500" /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRole(null); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton>{editingRole ? 'Save Permissions' : 'Create Role'}</SubmitButton>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};
