import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  CreditCard,
  Receipt,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Building,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';
import { formatCurrency } from '../../../utils/formatters';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAuth } from '../../../app/providers/AuthContext';
import { CustomDatePicker } from '../../../components/forms/CustomDatePicker';

type ExpenseDatePreset = 'all' | 'this_month' | 'last_month' | 'custom';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthRange = (offset: number) => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    startDate: formatLocalDate(date),
    endDate: formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
};

export const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const currentMonth = getMonthRange(0);
  const [expenseDatePreset, setExpenseDatePreset] = useState<ExpenseDatePreset>('this_month');
  const [expenseStartDate, setExpenseStartDate] = useState(currentMonth.startDate);
  const [expenseEndDate, setExpenseEndDate] = useState(currentMonth.endDate);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', expenseStartDate, expenseEndDate],
    queryFn: async () => {
      const res = await dashboardApi.getSummary({
        startDate: expenseStartDate || undefined,
        endDate: expenseEndDate || undefined,
      });
      return res.data?.summary || res.data || {};
    },
    refetchOnMount: 'always',
  });
  const { data: myTasksRes, isLoading: isTasksLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: dashboardApi.getMyTasks,
    refetchOnMount: 'always',
  });

  const [taskSearch, setTaskSearch] = useState('');
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 6;

  const myTasks = myTasksRes?.data?.tasks || [];

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return myTasks;
    const q = taskSearch.toLowerCase();
    return myTasks.filter((t: any) => {
      const titleMatch = t.title?.toLowerCase().includes(q);
      const fileNumMatch = t.file?.file_number?.toLowerCase().includes(q);
      const applicantMatch = t.file?.applicant_name?.toLowerCase().includes(q);
      const categoryMatch = t.category?.toLowerCase().includes(q);
      return titleMatch || fileNumMatch || applicantMatch || categoryMatch;
    });
  }, [myTasks, taskSearch]);

  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  const safeTaskPage = Math.min(taskPage, totalTaskPages);

  const paginatedTasks = useMemo(() => {
    const start = (safeTaskPage - 1) * tasksPerPage;
    return filteredTasks.slice(start, start + tasksPerPage);
  }, [filteredTasks, safeTaskPage, tasksPerPage]);

  const handleExpenseDatePreset = (preset: ExpenseDatePreset) => {
    setExpenseDatePreset(preset);
    if (preset === 'all') {
      setExpenseStartDate('');
      setExpenseEndDate('');
      return;
    }
    if (preset === 'this_month') {
      const range = getMonthRange(0);
      setExpenseStartDate(range.startDate);
      setExpenseEndDate(range.endDate);
      return;
    }
    if (preset === 'last_month') {
      const range = getMonthRange(-1);
      setExpenseStartDate(range.startDate);
      setExpenseEndDate(range.endDate);
    }
  };

  if (isLoading || isTasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-slate-200 space-y-3">
        <div className="flex items-center space-x-2 text-rose-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Failed to load dashboard metrics</h3>
        </div>
        <p className="text-xs text-slate-400">{(error as any)?.message || 'Internal Server Error'}</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const summary = data || {};
  const workTypeLabels = ['Building Permission', 'Estimate', 'Valuation', 'Design'];
  const expenseTotal = summary.totalExpenses ?? summary.expensesTotal ?? 0;
  const expensePeriodLabel =
    expenseDatePreset === 'this_month'
      ? 'This month'
      : expenseDatePreset === 'last_month'
        ? 'Last month'
        : expenseDatePreset === 'all'
          ? 'All time'
          : 'Custom range';

  const statCards = [
    {
      title: 'Total Project Files',
      value: summary.totalFiles ?? summary.filesCount ?? 0,
      subtext: 'Total files in system',
      icon: FolderKanban,
      color: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
      path: '/files',
    },
    {
      title: 'Pending Files',
      value: summary.pendingFilesCount ?? 0,
      subtext: 'In-progress workflow files',
      icon: Clock,
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
      path: '/files',
    },
    {
      title: 'Completed Files',
      value: summary.completedFilesCount ?? 0,
      subtext: 'All checkpoints finished',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
      path: '/files',
    },
    ...(isAdmin
      ? [
          {
            title: 'Payments Received',
            value: formatCurrency(summary?.totalReceived ?? 0),
            subtext: `Total Quotations: ${formatCurrency(summary.totalQuotationsAmount ?? summary.quotationTotal ?? 0)}`,
            icon: CreditCard,
            color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
            path: '/files',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-600/10 to-transparent pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Real-time Metrics
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            DEEP DESIGNING STUDIO Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Monitor workflow operations, architectural files, and project tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <Link
            to="/files/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create New File</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.path}
              className={`p-5 rounded-xl bg-gradient-to-br ${card.color} border transition-all hover:scale-[1.02] hover:shadow-lg group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black tracking-tight text-slate-100">{card.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{card.subtext}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Consolidated Work Type Directory Breakdown Block */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Work Type Directory Breakdown</h3>
          </div>
          <span className="text-xs text-slate-400">
            Total {summary.totalFiles ?? 0} Project File(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {workTypeLabels.map((workType) => {
            const count = summary.filesByWorkType?.[workType] ?? 0;
            return (
              <Link
                key={workType}
                to={`/files?workType=${encodeURIComponent(workType)}`}
                className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{workType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {count}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>View directory</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* My Pending Tasks Section */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">My Pending Tasks</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {myTasks.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Assigned workflow items requiring your action</p>
            </div>
          </div>

          {myTasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tasks or file #"
                  value={taskSearch}
                  onChange={(e) => {
                    setTaskSearch(e.target.value);
                    setTaskPage(1);
                  }}
                  className="pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-52"
                />
              </div>
            </div>
          )}
        </div>

        {myTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="font-medium text-slate-400">All caught up!</p>
            <p className="text-slate-500 mt-0.5">You have no pending tasks assigned at this moment.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <p>No tasks match "{taskSearch}"</p>
            <button
              onClick={() => {
                setTaskSearch('');
                setTaskPage(1);
              }}
              className="mt-2 text-cyan-400 underline hover:text-cyan-300 text-xs font-medium"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedTasks.map((task: any) => (
                <Link
                  key={task.id}
                  to={task.file?.id ? `/files/${task.file.id}?tab=workflow&taskId=${task.id}` : '/files'}
                  className="group relative p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-cyan-500/40 hover:bg-slate-950 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {task.title}
                      </span>
                      {task.category && (
                        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate font-medium text-cyan-400/90">{task.file?.file_number || 'File'}</span>
                      {task.file?.applicant_name && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="truncate text-slate-400">{task.file.applicant_name}</span>
                        </>
                      )}
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredTasks.length > tasksPerPage && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span>
                  Showing{' '}
                  <strong className="text-slate-200">
                    {(safeTaskPage - 1) * tasksPerPage + 1}
                  </strong>{' '}
                  -{' '}
                  <strong className="text-slate-200">
                    {Math.min(safeTaskPage * tasksPerPage, filteredTasks.length)}
                  </strong>{' '}
                  of <strong className="text-slate-200">{filteredTasks.length}</strong> tasks
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                    disabled={safeTaskPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2.5 py-1 text-slate-300 font-medium">
                    {safeTaskPage} / {totalTaskPages}
                  </span>

                  <button
                    onClick={() => setTaskPage((p) => Math.min(totalTaskPages, p + 1))}
                    disabled={safeTaskPage >= totalTaskPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expenses Overview */}
      {isAdmin && (
        <section className="relative rounded-2xl border border-cyan-200/70 bg-white shadow-xl shadow-slate-200/60">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
            <div className="relative p-6 sm:p-7">
              <div className="absolute right-8 top-6 h-28 w-28 rounded-full bg-cyan-100/70 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-cyan-700">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100">
                      <Receipt className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Finance snapshot</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-slate-900">Total Office Expenses</h3>
                  <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                    Operating costs recorded for printing, supplies, travel, utilities, and CAD overheads.
                  </p>
                </div>
                <Link
                  to="/expenses"
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  View log
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="relative mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                  <p className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                    {formatCurrency(expenseTotal)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-700">
                      <CalendarDays className="h-3 w-3" />
                      {expensePeriodLabel}
                    </span>
                    <span>Tracked spend</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-20 min-h-[380px] border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Review period</p>
                  <p className="mt-1 text-[11px] text-slate-500">Filter the total by expense date</p>
                </div>
                <CalendarDays className="h-4 w-4 text-slate-400" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1">
                {[
                  { key: 'this_month', label: 'This month' },
                  { key: 'last_month', label: 'Last month' },
                  { key: 'all', label: 'All time' },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handleExpenseDatePreset(preset.key as ExpenseDatePreset)}
                    className={`rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors ${
                      expenseDatePreset === preset.key
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <CustomDatePicker
                  value={expenseStartDate}
                  onChange={(value) => {
                    setExpenseStartDate(value);
                    setExpenseDatePreset('custom');
                  }}
                  placeholder="Start date"
                  popperPlacement="bottom-start"
                  preventFlip
                />
                <CustomDatePicker
                  value={expenseEndDate}
                  onChange={(value) => {
                    setExpenseEndDate(value);
                    setExpenseDatePreset('custom');
                  }}
                  placeholder="End date"
                  popperPlacement="bottom-end"
                  preventFlip
                />
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                {expenseStartDate && expenseEndDate
                  ? `${expenseStartDate} to ${expenseEndDate}`
                  : 'Showing every recorded expense'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

