import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  FolderKanban,
  ArrowLeft,
  User,
  Building,
  FileCheck,
  History,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react';
import { fileApi } from '../../../services/fileApi';
import { employeeApi } from '../../../services/employeeApi';
import { paymentApi } from '../../../services/paymentApi';
import { quotationApi } from '../../../services/quotationApi';
import { Payment, WorkflowTaskActivity } from '../../../types';
import { paymentSchema } from '../../payments/validation/paymentSchema';
import { useToast } from '../../../components/feedback/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/forms/FormField';
import { FormDatePicker } from '../../../components/forms/FormDatePicker';
import { FormSelect } from '../../../components/forms/FormSelect';
import { FormTextarea } from '../../../components/forms/FormTextarea';
import { SubmitButton } from '../../../components/forms/SubmitButton';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuth } from '../../../app/providers/AuthContext';

export const FileDetailPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasPermission, user } = useAuth();
  type FileWorkspaceTab = 'overview' | 'workflow' | 'payments';
  const tabStorageKey = fileId ? `file-workspace-tab-${fileId}` : '';
  const [activeTab, setActiveTab] = useState<FileWorkspaceTab>(() => {
    const targetTab = searchParams.get('tab');
    if (targetTab === 'workflow' || targetTab === 'payments') {
      return targetTab;
    }
    const storedTab = fileId ? localStorage.getItem(`file-workspace-tab-${fileId}`) : null;
    return storedTab === 'workflow' || storedTab === 'payments'
      ? storedTab
      : 'overview';
  });

  const targetTaskId = searchParams.get('taskId');
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  // Modals & Selection
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isEditFileModalOpen, setIsEditFileModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  useEffect(() => {
    if (tabStorageKey) {
      localStorage.setItem(tabStorageKey, activeTab);
    }
  }, [activeTab, tabStorageKey]);

  // Queries
  const { data: fileRes, isLoading: isFileLoading, isError: isFileError } = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => fileApi.getFileById(fileId!),
    enabled: !!fileId,
  });

  const { data: workflowRes } = useQuery({
    queryKey: ['fileWorkflow', fileId],
    queryFn: () => fileApi.getWorkflow(fileId!),
    enabled: !!fileId,
    refetchOnMount: 'always',
  });

  const { data: paymentsRes } = useQuery({
    queryKey: ['filePayments', fileId],
    queryFn: () => paymentApi.getFilePayments(fileId!),
    enabled: !!fileId,
  });

  const { data: quotationsRes } = useQuery({
    queryKey: ['fileQuotations', fileId],
    queryFn: () => quotationApi.getFileQuotations(fileId!),
    enabled: !!fileId,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeApi.getEmployees();
      return res.data?.employees || [];
    },
  });

  useEffect(() => {
    if (targetTaskId) {
      const numericId = Number(targetTaskId);
      if (!isNaN(numericId)) {
        setHighlightedTaskId(numericId);
        setActiveTab('workflow');
        const timer = setTimeout(() => {
          const el = document.getElementById(`task-${numericId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);

        const clearTimer = setTimeout(() => {
          setHighlightedTaskId(null);
        }, 5000);

        return () => {
          clearTimeout(timer);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [targetTaskId, workflowRes]);

  if (isFileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isFileError || !fileRes?.data?.file) {
    return (
      <div className="p-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold">Office File Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested file ID #{fileId} does not exist or was removed.
        </p>
        <Link
          to="/files"
          className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const file = fileRes.data.file;
  const tasks = workflowRes?.data?.tasks || file.workflowTasks || [];
  const requiredTasks = tasks.filter((task) => !task.is_optional || task.is_triggered);
  const payments = paymentsRes?.data?.payments || [];
  const paymentSummary = paymentsRes?.data?.summary;
  const quotations = quotationsRes?.data?.quotations || [];
  const employees = Array.isArray(employeesData) ? employeesData : [];

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.id === user?.id ? `${emp.name} (Me)` : emp.name,
  }));

  const allActivities = tasks
    .flatMap((task) => (task.activities || []).map((activity) => ({ ...activity, taskTitle: task.title })))
    .sort((left, right) => new Date(right.createdAt || right.created_at || 0).getTime() - new Date(left.createdAt || left.created_at || 0).getTime());

  const getActivityDate = (activity: WorkflowTaskActivity) => activity.createdAt || activity.created_at;

  const activityDescription = (activity: WorkflowTaskActivity) => {
    const actor = activity.actor?.name || 'Employee';
    const assignee = activity.assignedEmployee?.name;
    if (activity.action === 'UNASSIGNED') {
      return `${actor} unassigned this task`;
    }
    if (activity.action === 'ASSIGNED') {
      const isSelfAssignment =
        (activity.actor_id && activity.assigned_to && Number(activity.actor_id) === Number(activity.assigned_to)) ||
        (activity.actor?.id && activity.assignedEmployee?.id && activity.actor.id === activity.assignedEmployee.id);
      if (isSelfAssignment) {
        return `${actor} assigned this task to themselves`;
      }
      return `${actor} assigned this task to ${assignee || 'employee'}`;
    }
    if (activity.action === 'COMPLETED') return `${actor} marked this task complete`;
    if (activity.action === 'COMPLETION_UNDONE') return `${actor} undid task completion`;
    return `${actor} updated this task`;
  };

  // Bulk Task Selection
  const handleSelectAllTasks = () => {
      if (selectedTaskIds.length === tasks.length) {
        setSelectedTaskIds([]);
      } else {
        setSelectedTaskIds(tasks.map((t) => Number(t.id)));
      }
    };

    const handleToggleTaskSelect = (taskId: number) => {
      setSelectedTaskIds((prev) =>
        prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      );
    };

    const handleBulkComplete = async () => {
      if (selectedTaskIds.length === 0) return;
      try {
        await fileApi.bulkCompleteTasks(file.id, selectedTaskIds);
        toast.success('Bulk Success', `Marked ${selectedTaskIds.length} task(s) as completed`);
        setSelectedTaskIds([]);
        queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] });
        queryClient.invalidateQueries({ queryKey: ['file', fileId] });
        queryClient.invalidateQueries({ queryKey: ['myTasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err: any) {
        toast.error('Bulk Action Failed', err.response?.data?.message || 'Error executing bulk completion');
      }
    };

    const handleBulkUndoComplete = async () => {
      if (selectedTaskIds.length === 0) return;
      try {
        await fileApi.bulkUndoCompleteTasks(file.id, selectedTaskIds);
        toast.success('Bulk Success', `Undid completion for ${selectedTaskIds.length} task(s)`);
        setSelectedTaskIds([]);
        queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] });
        queryClient.invalidateQueries({ queryKey: ['file', fileId] });
        queryClient.invalidateQueries({ queryKey: ['myTasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err: any) {
        toast.error('Bulk Action Failed', err.response?.data?.message || 'Error executing bulk undo completion');
      }
    };

    const handleBulkAssign = async (assigneeIdVal: string) => {
      if (selectedTaskIds.length === 0) return;
      const assignedToVal = assigneeIdVal ? Number(assigneeIdVal) : null;
      try {
        await fileApi.bulkAssignTasks(file.id, selectedTaskIds, assignedToVal);
        toast.success('Bulk Success', `Updated assignment for ${selectedTaskIds.length} task(s)`);
        setSelectedTaskIds([]);
        queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] });
        queryClient.invalidateQueries({ queryKey: ['file', fileId] });
        queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      } catch (err: any) {
        toast.error('Bulk Action Failed', err.response?.data?.message || 'Error executing bulk assignment');
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Top Navigation & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/files"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">{file.applicant_name}</h1>
                <p className="text-[11px] text-cyan-400 font-mono">{file.file_number}{file.odps_number ? ` | ODPS ${file.odps_number}` : ''}</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Applicant: <span className="text-slate-200 font-semibold">{file.applicant_name}</span> • Work: {file.work_type}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            {requiredTasks.filter((task) => task.completed_at).length}/{requiredTasks.length} required checkpoints complete
          </div>
          <div className="flex items-center gap-2">
            {hasPermission('files', 'write') && <button type="button" onClick={() => setIsEditFileModalOpen(true)} title="Edit file" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200">
              <Pencil className="w-3.5 h-3.5 text-cyan-400" /> Edit
            </button>}
            {hasPermission('files', 'delete') && <button type="button" onClick={async () => { if (!window.confirm(`Delete file ${file.file_number}? This cannot be undone.`)) return; try { await fileApi.deleteFile(file.id); await queryClient.invalidateQueries({ queryKey: ['files'] }); await queryClient.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('File Deleted', `${file.file_number} was deleted.`); navigate('/files'); } catch (err: any) { toast.error('Delete Failed', err.response?.data?.message || 'You do not have permission to delete files.'); } }} title="Delete file" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-xs font-semibold text-rose-300">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-800 overflow-x-auto pb-px">
          {[
            { key: 'overview', label: 'Overview & Property', icon: Building },
            { key: 'workflow', label: `Workflow Checklist (${tasks.length})`, icon: FileCheck },
            { key: 'payments', label: `Payments & Balance`, icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as FileWorkspaceTab)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${isActive
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant & Project Details */}
            {file.work_type === 'Building Permission' && <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <User className="w-4 h-4 text-cyan-400" />
                Applicant & Work Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Applicant Name</span>
                  <span className="text-slate-200 font-medium">{file.applicant_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Mobile Contact</span>
                  <span className="text-slate-200 font-medium">{file.applicant_mobile || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Address</span>
                  <span className="text-slate-300">{file.applicant_address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Work Type</span>
                  <span className="text-slate-200 font-medium">{file.work_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Permission Type</span>
                  <span className="text-slate-200 font-medium">{file.permission_type || 'N/A'}</span>
                </div>
              </div>
            </div>}

            {/* Property Survey & Area Parameters */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building className="w-4 h-4 text-cyan-400" />
                Property Survey & Built-up Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Revenue Survey No</span>
                  <span className="text-slate-200 font-mono">{file.revenue_survey_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">City Survey No</span>
                  <span className="text-slate-200 font-mono">{file.city_survey_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">TP Scheme No</span>
                  <span className="text-slate-200 font-mono">{file.tp_scheme_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Final Plot No</span>
                  <span className="text-slate-200 font-mono">{file.final_plot_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Plot No</span>
                  <span className="text-slate-200 font-mono">{file.plot_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Floors</span>
                  <span className="text-slate-200">{file.floors || 'N/A'}</span>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-semibold block uppercase text-[10px]">Specific Built-up Area</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">
                    {file.specific_built_up_area ? `${file.specific_built_up_area} sq.ft` : 'Not Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quotation */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  Quotation
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEstimateModalOpen(true)}
                  title="Edit Quotation"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Amount Given to Client</span>
                <span className="text-emerald-400 font-mono font-bold text-xl">
                  {formatCurrency(
                    quotations[0]?.amount ?? file.estimated_amount ?? 0
                  )}
                </span>
              </div>
              {quotations.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 border border-slate-800 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {quotation.quotation_number}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {quotation.status}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400 whitespace-nowrap">
                        {formatCurrency(quotation.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No quotation record found for this file.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Workflow Checklist */}
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Workflow Checklist ({tasks.length})</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {requiredTasks.filter((task) => task.completed_at).length} of {requiredTasks.length} required checkpoints finished
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasPermission('files', 'write') && tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllTasks}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-cyan-400 hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-cyan-500 pointer-events-none"
                    />
                    <span>{selectedTaskIds.length === tasks.length ? 'Deselect All' : `Select All (${tasks.length})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 shadow-sm"
                >
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Activity Log ({allActivities.length})</span>
                </button>
              </div>
            </div>

            {/* Sticky Modern Bulk Action Bar */}
            {selectedTaskIds.length > 0 && hasPermission('files', 'write') && (
              <div className="sticky top-2 z-20 p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 shadow-2xl shadow-cyan-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 text-xs font-extrabold shadow-sm">
                    {selectedTaskIds.length} Selected
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Bulk Action Toolbar
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkComplete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Selected Complete ({selectedTaskIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkUndoComplete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Completion ({selectedTaskIds.length})</span>
                  </button>

                  <select
                    onChange={(e) => {
                      if (e.target.value !== undefined) {
                        handleBulkAssign(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    <option value="">Bulk Assign Employee...</option>
                    <option value="">Unassign Selected Tasks</option>
                    {employeeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setSelectedTaskIds([])}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors ml-1"
                    title="Deselect All"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <EmptyState title="No checklist tasks recorded" description="Run the workflow migration and create a new file." />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const taskIdNum = Number(task.id);
                  const isSelected = selectedTaskIds.includes(taskIdNum);
                  const isHighlighted = highlightedTaskId === taskIdNum;
                  return (
                    <div
                      key={task.id}
                      id={`task-${task.id}`}
                      className={`bg-slate-900 border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4 transition-all duration-300 relative ${isSelected
                        ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-slate-900/90'
                        : isHighlighted
                          ? 'border-cyan-400 ring-4 ring-cyan-500/30 shadow-2xl shadow-cyan-500/40 scale-[1.01] bg-slate-900/90'
                          : 'border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      {isHighlighted && (
                        <span className="absolute -top-2.5 right-4 bg-cyan-400 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-lg tracking-wider animate-pulse">
                          Selected Pending Task
                        </span>
                      )}

                      {/* Checkbox for Bulk Selection */}
                      {hasPermission('files', 'write') && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleTaskSelect(taskIdNum)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500 shrink-0"
                        />
                      )}

                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.completed_at ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {task.completed_at ? <FileCheck className="w-4 h-4" /> : <span className="text-xs font-bold">{task.sequence}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-100">{task.title}</h4>
                          <span className="text-[10px] uppercase text-cyan-400">{task.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {task.activities?.[0] ? `${activityDescription(task.activities[0])} on ${formatDateTime(getActivityDate(task.activities[0]))}` : `Primary: ${task.default_designation || 'Any employee'}`}
                        </p>
                        {task.notes && <p className="text-[11px] text-slate-400 mt-1">{task.notes}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {hasPermission('files', 'write') && <>
                          {task.is_optional && <button type="button" onClick={async () => { await fileApi.triggerTask(file.id, task.id); queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] }); }} className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold ${task.is_triggered ? 'bg-slate-700 hover:bg-slate-600' : 'bg-amber-600 hover:bg-amber-500'}`}>{task.is_triggered ? 'Undo query' : 'Query occurred'}</button>}
                          {task.completed_at && <button type="button" onClick={async () => { await fileApi.undoTaskCompletion(file.id, task.id); queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] }); queryClient.invalidateQueries({ queryKey: ['file', fileId] }); }} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold">Undo complete</button>}
                          {!task.completed_at && (!task.is_optional || task.is_triggered) && <button type="button" onClick={async () => { await fileApi.completeTask(file.id, task.id); queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] }); queryClient.invalidateQueries({ queryKey: ['file', fileId] }); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">Mark complete</button>}
                          {!task.completed_at && (!task.is_optional || task.is_triggered) && (
                            <select
                              aria-label={`Assign ${task.title}`}
                              value={task.assigned_to || ''}
                              onChange={async (event) => {
                                const assignedToVal = event.target.value ? Number(event.target.value) : null;
                                await fileApi.assignTask(file.id, task.id, { assigned_to: assignedToVal as any });
                                queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] });
                                queryClient.invalidateQueries({ queryKey: ['file', fileId] });
                                queryClient.invalidateQueries({ queryKey: ['myTasks'] });
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">{task.assigned_to ? 'Unassign / No Assignee' : 'Assign Task'}</option>
                              {employeeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          title="Complete activity history"
          subtitle={`All recorded actions for ${file.file_number}`}
          maxWidth="2xl"
        >
          {allActivities.length === 0 ? (
            <EmptyState title="No activity recorded" description="Task assignments and completions will appear here." />
          ) : (
            <div className="space-y-3">
              {allActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{activityDescription(activity)}</p>
                    <p className="text-[11px] text-cyan-400 mt-1">{activity.taskTitle}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{formatDateTime(getActivityDate(activity))}</p>
                    {activity.notes && <p className="text-[11px] text-slate-400 mt-1">{activity.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Tab 5: Payments & Outstanding Balance */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Summary Math Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Quotation</span>
                <p className="text-xl font-extrabold text-slate-100">
                  {formatCurrency(paymentSummary?.totalQuotationAmount ?? file.estimated_amount ?? 0)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Paid</span>
                <p className="text-xl font-extrabold text-emerald-400">
                  {formatCurrency(paymentSummary?.totalReceivedAmount ?? 0)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-500/5 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Outstanding Balance</span>
                <p className="text-xl font-extrabold text-amber-300">
                  {formatCurrency(paymentSummary?.outstandingAmount ?? 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Payment History</h3>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
              >
                Register Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <EmptyState title="No payments recorded" description="Register advance or partial payment receipts." />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Method & Ref</th>
                      <th className="py-3 px-4">Date / Collected By</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-cyan-400 uppercase">{p.payment_type}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{p.payment_method}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.reference_number || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <div>{formatDate(p.payment_date)}</div>
                          <div className="text-[10px] text-cyan-400">{p.creator?.name || 'Employee'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{p.notes || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(p);
                              setIsPaymentModalOpen(true);
                            }}
                            title="Edit payment"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- MODALS --- */}

        <Modal
          isOpen={isEditFileModalOpen}
          onClose={() => setIsEditFileModalOpen(false)}
          title="Edit File Details"
          subtitle={`Update ${file.file_number}`}
          maxWidth="lg"
        >
          <Formik
            enableReinitialize
            initialValues={{
              file_number: file.file_number,
              odps_number: file.odps_number || '',
              work_type: file.work_type,
              applicant_name: file.applicant_name,
              applicant_address: file.applicant_address || '',
              applicant_mobile: file.applicant_mobile || '',
              revenue_survey_no: file.revenue_survey_no || '',
              city_survey_no: file.city_survey_no || '',
              tp_scheme_no: file.tp_scheme_no || '',
              final_plot_no: file.final_plot_no || '',
              plot_no: file.plot_no || '',
              permission_type: file.permission_type || '',
              floors: file.floors || '',
              specific_built_up_area: file.specific_built_up_area || '',
              estimated_amount: file.estimated_amount || '',
            }}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const res = await fileApi.updateFile(file.id, {
                  ...values,
                  specific_built_up_area: values.specific_built_up_area ? Number(values.specific_built_up_area) : undefined,
                  estimated_amount: values.estimated_amount ? Number(values.estimated_amount) : undefined,
                });
                if (res.success) {
                  toast.success('File Updated', 'File details updated successfully.');
                  queryClient.invalidateQueries({ queryKey: ['file', fileId] });
                  queryClient.invalidateQueries({ queryKey: ['fileWorkflow', fileId] });
                  queryClient.invalidateQueries({ queryKey: ['files'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  queryClient.invalidateQueries({ queryKey: ['myTasks'] });
                  setIsEditFileModalOpen(false);
                }
              } catch (err: any) {
                toast.error('Update Failed', err.response?.data?.message || 'Unable to update file.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField name="file_number" label="File Number" required />
                  <FormField name="odps_number" label="ODPS Number (Optional)" />
                  <FormSelect name="work_type" label="Work Type" options={[
                    { value: 'Building Permission', label: 'New Building Permission' },
                    { value: 'Estimate', label: 'Estimate' },
                    { value: 'Valuation', label: 'Valuation' },
                    { value: 'Design', label: 'Design' },
                  ]} required />
                  <FormField name="applicant_name" label="Applicant Name" required />
                  <FormField name="applicant_mobile" label="Applicant Mobile" />
                  <div className="sm:col-span-2"><FormTextarea name="applicant_address" label="Applicant Address" rows={2} /></div>
                  {values.work_type === 'Building Permission' && <>
                    <FormSelect name="permission_type" label="Permission Type" options={[
                      { value: 'Building Permission', label: 'New Building Permission' },
                      { value: 'Addition & Extension', label: 'Addition & Extension' },
                      { value: 'Subdivision', label: 'Subdivision' },
                      { value: 'Layout', label: 'Layout' },
                    ]} required />
                    <FormField name="revenue_survey_no" label="Revenue Survey No" />
                    <FormField name="city_survey_no" label="City Survey No" />
                    <FormField name="tp_scheme_no" label="TP Scheme No" />
                    <FormField name="final_plot_no" label="Final Plot No" />
                    <FormField name="plot_no" label="Plot No" />
                    <FormField name="floors" label="Floors" />
                    <FormField name="specific_built_up_area" label="Built-up Area (sq.ft)" type="number" step="0.01" />
                  </>}
                  <FormField name="estimated_amount" label="Quotation Amount (₹)" type="number" step="0.01" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setIsEditFileModalOpen(false)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800">Cancel</button>
                  <SubmitButton>Save File</SubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>

        {/* 0. Edit Quotation Modal */}
        <Modal
          isOpen={isEstimateModalOpen}
          onClose={() => setIsEstimateModalOpen(false)}
          title="Edit Quotation"
          subtitle={`Update the amount given to ${file.applicant_name}`}
          maxWidth="sm"
        >
          <Formik
            initialValues={{ estimated_amount: file.estimated_amount ?? '' }}
            validationSchema={Yup.object({
              estimated_amount: Yup.number()
                .typeError('Estimation amount must be a valid number')
                .positive('Estimation amount must be positive')
                .required('Estimation amount is required'),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const res = await fileApi.updateFile(file.id, {
                  estimated_amount: Number(values.estimated_amount),
                });
                if (res.success) {
                  toast.success('Estimation Updated', 'Quotation amount updated successfully.');
                  queryClient.invalidateQueries({ queryKey: ['file', fileId] });
                  queryClient.invalidateQueries({ queryKey: ['filePayments', fileId] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  setIsEstimateModalOpen(false);
                }
              } catch (err: any) {
                toast.error('Update Failed', err.response?.data?.message || 'API error');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {() => (
              <Form className="space-y-4">
                <FormField
                  name="estimated_amount"
                  label="Estimation Amount (₹)"
                  type="number"
                  step="0.01"
                  required
                />
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEstimateModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <SubmitButton>Save Estimation</SubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>

        {/* 5. Register Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setEditingPayment(null);
          }}
          title={editingPayment ? 'Edit Payment Receipt' : 'Register Payment Receipt'}
          subtitle={`Record client payment for ${file.file_number}`}
          maxWidth="lg"
        >
          <Formik
            enableReinitialize
            initialValues={{
              amount: editingPayment?.amount ?? 20000,
              payment_type: editingPayment?.payment_type ?? 'ADVANCE',
              payment_date: editingPayment?.payment_date ?? new Date().toISOString().split('T')[0],
              payment_method: editingPayment?.payment_method ?? 'UPI',
              reference_number: editingPayment?.reference_number ?? '',
              notes: editingPayment?.notes ?? '',
            }}
            validationSchema={paymentSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const payload = {
                  ...values,
                  amount: Number(values.amount),
                };
                const res = editingPayment
                  ? await paymentApi.updatePayment(file.id, editingPayment.id, payload)
                  : await paymentApi.registerPayment(file.id, payload);
                if (res.success) {
                  toast.success(
                    editingPayment ? 'Payment Updated' : 'Payment Registered',
                    `Receipt recorded for ₹${values.amount}`
                  );
                  queryClient.invalidateQueries({ queryKey: ['filePayments', fileId] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  setIsPaymentModalOpen(false);
                  setEditingPayment(null);
                }
              } catch (err: any) {
                toast.error('Payment Failed', err.response?.data?.message || 'API error');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {() => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="amount"
                    label="Payment Amount (₹)"
                    type="number"
                    step="0.01"
                    max={Math.max(
                      0,
                      Number(file.estimated_amount || 0)
                      - Number(paymentSummary?.totalReceivedAmount || 0)
                      + Number(editingPayment?.amount || 0)
                    )}
                    required
                  />
                  <FormDatePicker name="payment_date" label="Payment Date" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    name="payment_type"
                    label="Payment Category"
                    options={[
                      { value: 'ADVANCE', label: 'ADVANCE PAYMENT' },
                      { value: 'PARTIAL', label: 'PARTIAL PAYMENT' },
                      { value: 'FULL', label: 'FINAL SETTLEMENT' },
                    ]}
                    required
                  />
                  <FormSelect
                    name="payment_method"
                    label="Payment Method"
                    options={[
                      { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                      { value: 'CASH', label: 'CASH' },
                      { value: 'CHEQUE', label: 'CHEQUE' },
                      { value: 'BANK_TRANSFER', label: 'BANK TRANSFER / NEFT' },
                    ]}
                    required
                  />
                </div>

                <FormField name="reference_number" label="Reference / Transaction ID" placeholder="UPI/129837192837" />
                <FormTextarea name="notes" label="Payment Remarks" placeholder="Advance payment received..." rows={2} />

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setEditingPayment(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <SubmitButton variant="primary">{editingPayment ? 'Save Changes' : 'Register Receipt'}</SubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      </div>
    );
  };
