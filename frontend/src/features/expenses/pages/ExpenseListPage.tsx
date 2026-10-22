import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import {
  Receipt,
  Plus,
  Calendar,
  Tag,
  RotateCcw,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  Building,
  Printer,
  Car,
  Zap,
  Monitor,
  Briefcase,
  Coins,
  MapPin,
  Filter,
  Pencil,
  Trash2,
} from 'lucide-react';
import { expenseApi, CreateExpensePayload, ExpenseCategoryBreakdown } from '../../../services/expenseApi';
import { employeeApi } from '../../../services/employeeApi';
import { expenseSchema } from '../validation/expenseSchema';
import { useToast } from '../../../components/feedback/ToastContext';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { FormField } from '../../../components/forms/FormField';
import { FormSelect } from '../../../components/forms/FormSelect';
import { FormTextarea } from '../../../components/forms/FormTextarea';
import { SubmitButton } from '../../../components/forms/SubmitButton';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuth } from '../../../app/providers/AuthContext';
import { Expense } from '../../../types';
import { CustomDatePicker } from '../../../components/forms/CustomDatePicker';
import { FormDatePicker } from '../../../components/forms/FormDatePicker';

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return {
    startDate: `${year}-${month}-01`,
    endDate: new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0],
  };
};

export const ExpenseListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasPermission, isAdmin, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilter = searchParams.get('employeeId') || '';
  const isManagerOrAdmin = isAdmin || hasRole('MANAGER') || hasRole('PROJECT_MANAGER');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleCreateNewExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (exp: Expense) => {
    if (!window.confirm(`Are you sure you want to delete this expense record (${formatCurrency(exp.amount)})?`)) return;
    try {
      await expenseApi.deleteExpense(exp.id);
      toast.success('Expense Deleted', 'Expense record removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error('Delete Failed', err.response?.data?.message || 'Error deleting expense');
    }
  };

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const currentMonth = getCurrentMonthRange();
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState<string>(currentMonth.startDate);
  const [endDate, setEndDate] = useState<string>(currentMonth.endDate);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await employeeApi.getEmployees()).data?.employees || [],
    enabled: isAdmin,
  });
  const employeeOptions = (employeesData || []).map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));

  // 9 Expense Categories
  const categoryOptions = [
    { value: 'OFFICE', label: 'Office Supplies & Stationery' },
    { value: 'PRINTING', label: 'CAD Printing & Plotting' },
    { value: 'TRAVEL', label: 'Travel & Conveyance' },
    { value: 'UTILITIES', label: 'Electricity & Utilities' },
    { value: 'HARDWARE', label: 'IT & Hardware Maintenance' },
    { value: 'SALARY', label: 'Salaries & Allowances' },
    { value: 'UPAD', label: 'UPAD / Advance Salary' },
    { value: 'SITE_VISIT', label: 'Site Visit & Field Expenses' },
    { value: 'OTHER', label: 'Miscellaneous Expense' },
  ];
  const selectableCategoryOptions = isAdmin
    ? categoryOptions
    : categoryOptions.filter((category) => category.value !== 'SALARY' && category.value !== 'UPAD');

  const getCategoryLabel = (cat: string) => {
    const key = (cat || '').toUpperCase().trim();
    switch (key) {
      case 'OFFICE':
        return 'Office Supplies & Stationery';
      case 'PRINTING':
        return 'CAD Printing & Plotting';
      case 'TRAVEL':
        return 'Travel & Conveyance';
      case 'UTILITIES':
        return 'Electricity & Utilities';
      case 'HARDWARE':
        return 'IT & Hardware Maintenance';
      case 'SALARY':
        return 'Salaries & Allowances';
      case 'UPAD':
        return 'UPAD / Advance Salary';
      case 'SITE_VISIT':
        return 'Site Visit & Field Expenses';
      case 'OTHER':
      case 'MISCELLANEOUS':
        return 'Miscellaneous Expense';
      default:
        return key || 'Miscellaneous Expense';
    }
  };

  const getCategoryIcon = (cat: string) => {
    const key = (cat || '').toUpperCase().trim();
    switch (key) {
      case 'OFFICE':
        return <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'PRINTING':
        return <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'TRAVEL':
        return <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'UTILITIES':
        return <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'HARDWARE':
        return <Monitor className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'SALARY':
        return <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'UPAD':
        return <Coins className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'SITE_VISIT':
        return <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  const getCategoryStyle = (cat: string) => {
    const key = (cat || '').toUpperCase().trim();
    switch (key) {
      case 'OFFICE':
        return {
          badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
          bar: 'from-cyan-500 to-cyan-400',
        };
      case 'PRINTING':
        return {
          badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
          bar: 'from-emerald-500 to-emerald-400',
        };
      case 'TRAVEL':
        return {
          badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
          bar: 'from-amber-500 to-amber-400',
        };
      case 'UTILITIES':
        return {
          badge: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60',
          bar: 'from-yellow-500 to-yellow-400',
        };
      case 'HARDWARE':
        return {
          badge: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
          bar: 'from-purple-500 to-purple-400',
        };
      case 'SALARY':
        return {
          badge: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
          bar: 'from-blue-500 to-blue-400',
        };
      case 'UPAD':
        return {
          badge: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
          bar: 'from-rose-500 to-rose-400',
        };
      case 'SITE_VISIT':
        return {
          badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
          bar: 'from-indigo-500 to-indigo-400',
        };
      default:
        return {
          badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
          bar: 'from-slate-500 to-slate-400',
        };
    }
  };

  // Handle Date Presets
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === 'this_week') {
      const first = now.getDate() - now.getDay();
      const firstDay = new Date(now.setDate(first)).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
      return;
    }

    if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
      return;
    }

    if (preset === 'last_month') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(year, prevMonthDate.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
      return;
    }

    if (preset === 'this_year') {
      const year = now.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
      return;
    }

    if (preset === 'last_year') {
      const prevYear = now.getFullYear() - 1;
      setStartDate(`${prevYear}-01-01`);
      setEndDate(`${prevYear}-12-31`);
      return;
    }
  };

  const resetAllFilters = () => {
    setCategoryFilter('');
    const currentMonth = getCurrentMonthRange();
    setDatePreset('this_month');
    setStartDate(currentMonth.startDate);
    setEndDate(currentMonth.endDate);
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
    setSearchParams({});
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (employeeFilter) count++;
    if (datePreset !== 'all' || startDate || endDate) count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [categoryFilter, employeeFilter, datePreset, startDate, endDate, minAmount, maxAmount]);

  // Fetch Expenses with Filter Params
  const { data: apiRes, isLoading, isFetching, isError } = useQuery({
    queryKey: ['expenses', categoryFilter, employeeFilter, startDate, endDate, minAmount, maxAmount, page],
    queryFn: async () => {
      const res = await expenseApi.getExpenses({
        category: categoryFilter || undefined,
        employeeId: employeeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount !== '' ? minAmount : undefined,
        maxAmount: maxAmount !== '' ? maxAmount : undefined,
        page,
        limit,
      });
      return res.data;
    },
    refetchOnMount: 'always',
  });

  const expensesData = apiRes?.expenses || [];
  const expenses: Expense[] = Array.isArray(expensesData) ? expensesData : [];
  const totalItems = apiRes?.totalItems ?? expenses.length;
  const totalPages = apiRes?.totalPages ?? 1;
  const totalExpenseAmount = apiRes?.totalExpenseAmount ?? expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const categoryBreakdown: ExpenseCategoryBreakdown[] = apiRes?.categoryBreakdown || [];

  // Merge all 9 categories into breakdown so all 9 categories exist visually
  const mergedCategoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; total: number; count: number }>();

    categoryOptions.forEach((opt) => {
      map.set(opt.value, { category: opt.value, total: 0, count: 0 });
    });

    categoryBreakdown.forEach((item) => {
      const rawCat = (item.category || 'OTHER').toUpperCase().trim();
      const mappedKey = rawCat === 'MISCELLANEOUS' ? 'OTHER' : rawCat;
      const existing = map.get(mappedKey);
      if (existing) {
        existing.total += item.total;
        existing.count += item.count;
      } else {
        map.set(mappedKey, { category: mappedKey, total: item.total, count: item.count });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total || b.count - a.count);
  }, [categoryBreakdown]);

  // Top spending category
  const topCategory = useMemo(() => {
    if (!mergedCategoryBreakdown || mergedCategoryBreakdown.length === 0) return null;
    const sorted = [...mergedCategoryBreakdown].filter((c) => c.total > 0);
    return sorted.length > 0 ? sorted[0] : null;
  }, [mergedCategoryBreakdown]);

  const avgExpense = totalItems > 0 ? totalExpenseAmount / totalItems : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            Office Operating Expenses
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track overheads, stationery, printing costs, utilities, travel, and miscellaneous expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasPermission('expenses', 'write') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Record New Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Analytics Summary Cards (Admins / Managers only) */}
      {isManagerOrAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Filtered Expense</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(totalExpenseAmount)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{totalItems} record(s) matching criteria</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Entries</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{totalItems}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Transactions logged</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Tag className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Average Expense</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(avgExpense)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Per expenditure record</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Top Spending Category</p>
              <h3 className="text-xs font-bold text-cyan-300 truncate mt-1">
                {topCategory ? getCategoryLabel(topCategory.category) : 'N/A'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {topCategory ? formatCurrency(topCategory.total) : 'No data'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Major Filters Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">All Expense Categories (9 Types)</option>
              {selectableCategoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

            {/* Employee Filter (admins only) */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <select
                  value={employeeFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPage(1);
                    setSearchParams(value ? { employeeId: value } : {});
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="">All Employees</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.value} value={employee.value}>
                      {employee.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* {isAdmin && employeeFilter && (
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                Employee filter shows records assigned to this employee
              </span>
            )} */}

          {/* Date Presets Dropdown / Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'this_month', label: 'This Month' },
              { key: 'last_month', label: 'Last Month' },
              { key: 'this_year', label: 'This Year' },
              { key: 'last_year', label: 'Last Year' },
              { key: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetChange(p.key as DatePreset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  datePreset === p.key
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950/60'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Toggle Additional Filters on mobile */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Amount Range</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-cyan-500 text-slate-950 font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Extended Filters: Custom Date Range & Amount Range */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 ${showFiltersMobile ? 'block' : 'hidden md:grid'}`}>
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Start Date
            </label>
            <CustomDatePicker
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setDatePreset('custom');
                setPage(1);
              }}
              placeholder="Select start date"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              End Date
            </label>
            <CustomDatePicker
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setDatePreset('custom');
                setPage(1);
              }}
              placeholder="Select end date"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Max Amount (₹)
            </label>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Active Filter Badges & Reset Button */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-[11px]">Active Filters:</span>
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] border border-slate-700">
                  Category: {getCategoryLabel(categoryFilter)}
                </span>
              )}
              {employeeFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] border border-slate-700">
                  Employee: {employeeOptions.find((employee) => String(employee.value) === employeeFilter)?.label || `#${employeeFilter}`}
                </span>
              )}
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] border border-slate-700">
                  Date: {startDate || 'Min'} to {endDate || 'Max'}
                </span>
              )}
              {(minAmount || maxAmount) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] border border-slate-700">
                  Amount: ₹{minAmount || 0} - ₹{maxAmount || '∞'}
                </span>
              )}
            </div>

            <button
              onClick={resetAllFilters}
              className="inline-flex items-center text-xs text-cyan-400 hover:text-cyan-300 font-medium shrink-0"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Analytics / Distribution Analysis Section (Admins / Managers only) */}
      {isManagerOrAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100">Category Expense Distribution Analysis</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Filtered Total: <strong className="text-cyan-300 font-mono">{formatCurrency(totalExpenseAmount)}</strong> (Across 9 Categories)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {mergedCategoryBreakdown.map((item) => {
              const percent = totalExpenseAmount > 0 ? (item.total / totalExpenseAmount) * 100 : 0;
              const style = getCategoryStyle(item.category);
              const label = getCategoryLabel(item.category);

              return (
                <div
                  key={item.category}
                  className={`p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 transition-all ${
                    item.total > 0 ? 'hover:border-slate-700' : 'opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 truncate max-w-[70%] ${style.badge}`}>
                      {getCategoryIcon(item.category)}
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0">
                      {item.count} item{item.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-xs text-slate-400">{percent.toFixed(1)}%</span>
                    <span className={`text-sm font-bold ${item.total > 0 ? 'text-slate-100' : 'text-slate-500'}`}>
                      {formatCurrency(item.total)}
                    </span>
                  </div>

                  {/* Horizontal Bar Chart Visual */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                    <div
                      className={`h-full bg-gradient-to-r ${style.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${item.total > 0 ? Math.min(100, Math.max(3, percent)) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses Data Table */}
      {isLoading || isFetching ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Failed to load expenses log from server.
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description={
            activeFiltersCount > 0
              ? 'No expenditure items match your active filters. Try resetting filters.'
              : 'Log your first office expenditure item.'
          }
          action={
            activeFiltersCount > 0 ? (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700"
              >
                Clear Filters
              </button>
            ) : (
              hasPermission('expenses', 'write') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg"
                >
                  Record First Expense
                </button>
              )
            )
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Description / Purpose</th>
                  <th className="py-3.5 px-4">Logged By</th>
                  <th className="py-3.5 px-4">Expense Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {expenses.map((exp) => {
                  const style = getCategoryStyle(exp.category);
                  const label = getCategoryLabel(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${style.badge}`}>
                          <span className="mr-1.5">{getCategoryIcon(exp.category)}</span>
                          {label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {exp.employee?.name || <span className="text-slate-500 italic">Office</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-200 font-medium max-w-sm truncate">
                        {exp.description ? exp.description : <span className="text-slate-500 italic">No details specified</span>}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {exp.creator?.name || 'System / Admin'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(exp.expense_date)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('expenses', 'write') && (
                            <button
                              type="button"
                              onClick={() => handleEditExpense(exp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/60 transition-colors"
                              title="Edit Expense"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('expenses', 'delete') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800">
              <p className="text-xs text-slate-400">
                Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
                <span className="font-semibold text-slate-200">{totalPages}</span> ({totalItems} total items)
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs hover:bg-slate-700 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs hover:bg-slate-700 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Office Expense' : 'Record Office Expense'}
        subtitle={editingExpense ? `Update details for expense record #${editingExpense.id}` : 'Log new overhead or expenditure item'}
        maxWidth="md"
      >
        <Formik
          enableReinitialize
          initialValues={{
            category: editingExpense?.category || 'OFFICE',
            amount: editingExpense ? Number(editingExpense.amount) : 1500,
            expense_date: editingExpense?.expense_date || new Date().toISOString().split('T')[0],
            description: editingExpense?.description || '',
            employee_id: editingExpense?.employee_id || (employeeFilter ? Number(employeeFilter) : ''),
          }}
          validationSchema={expenseSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const payload: CreateExpensePayload = {
                ...values,
                amount: Number(values.amount),
                employee_id: values.employee_id ? Number(values.employee_id) : undefined,
              };
              if (editingExpense) {
                const res = await expenseApi.updateExpense(editingExpense.id, payload);
                if (res.success) {
                  toast.success('Expense Updated', `Updated expense record of ${formatCurrency(values.amount)}`);
                  queryClient.invalidateQueries({ queryKey: ['expenses'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  resetForm();
                  setEditingExpense(null);
                  setIsModalOpen(false);
                }
              } else {
                const res = await expenseApi.createExpense(payload);
                if (res.success) {
                  toast.success('Expense Recorded', `Logged expense of ${formatCurrency(values.amount)} for date ${values.expense_date}`);
                  resetAllFilters();
                  queryClient.invalidateQueries({ queryKey: ['expenses'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                  resetForm();
                  setIsModalOpen(false);
                }
              }
            } catch (err: any) {
              toast.error('Failed', err.response?.data?.message || 'API error');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values }) => (
            <Form className="space-y-4">
              <FormSelect name="category" label="Expense Category" options={selectableCategoryOptions} required />
              {isAdmin && (
                <FormSelect
                  name="employee_id"
                  label="Employee (for salary or UPAD records)"
                  options={employeeOptions}
                  placeholder={values.category === 'SALARY' || values.category === 'UPAD' ? 'Select employee' : 'Select employee (optional)'}
                  required={values.category === 'SALARY' || values.category === 'UPAD'}
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="amount" label="Amount (₹)" type="number" step="0.01" required />
                <FormDatePicker name="expense_date" label="Expense Date" required />
              </div>
              <FormTextarea
                name="description"
                label="Expense Details / Purpose (Optional)"
                placeholder="Optional notes or details (e.g. stationery, printing paper)..."
                rows={3}
              />

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <SubmitButton>{editingExpense ? 'Update Expense' : 'Save Expense'}</SubmitButton>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};
