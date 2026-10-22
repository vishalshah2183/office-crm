import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search, ChevronLeft, ChevronRight, Eye, Calendar, User, Trash2 } from 'lucide-react';
import { fileApi } from '../../../services/fileApi';
import { formatDate } from '../../../utils/formatters';
import { Skeleton, TableSkeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuth } from '../../../app/providers/AuthContext';

export const FileListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput?.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['files', debouncedSearch, page, limit],
    queryFn: async () => {
      const res = await fileApi.getFiles({ search: debouncedSearch, page, limit });
      return res.data;
    },
    refetchOnMount: 'always'
  });

  const isDataLoading = isLoading || isFetching;

  const files = data?.files || [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * limit + 1;
  const endItem = Math.min(safePage * limit, totalItems);

  const getCreatedDate = (file: { createdAt?: string; created_at?: string }) => file.createdAt || file.created_at;

  const handleDelete = async (fileId: number, fileNumber: string) => {
    if (!window.confirm(`Delete file ${fileNumber}? This cannot be undone.`)) return;
    try {
      await fileApi.deleteFile(fileId);
      queryClient.setQueriesData<{ files: typeof files; totalPages?: number }>(
        { queryKey: ['files'] },
        (current) => current ? { ...current, files: current.files.filter((file) => file.id !== fileId) } : current
      );
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      navigate('/files', { replace: true });
    } catch {
      window.alert('Unable to delete this file. Please check your permissions and try again.');
    }
  };

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Office Files Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track active architectural building permissions, layout applications, and client project files.
          </p>
        </div>

        {hasPermission('files', 'write') && <Link
          to="/files/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New File</span>
        </Link>}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by file number, ODPS, applicant, survey number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Data Table */}
      {isDataLoading ? (
        <TableSkeleton rows={limit > 10 ? 8 : 5} />
      ) : isError ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          Failed to load office files directory.
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          title="No project files found"
          description={debouncedSearch ? 'No files match your search criteria.' : 'Start by registering your first office file.'}
          action={
            hasPermission('files', 'write') && <Link
              to="/files/new"
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg inline-block"
            >
              Create New File
            </Link>
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">File #</th>
                  <th className="py-3.5 px-4">ODPS Number</th>
                  <th className="py-3.5 px-4">Applicant Details</th>
                  <th className="py-3.5 px-4">Work / Permission</th>
                  <th className="py-3.5 px-4">Built-up Area</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    onClick={() => navigate(`/files/${file.id}`)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                      {file.file_number}
                    </td>

                    <td className="py-3.5 px-4">
                      {file.odps_number ? (
                        <span className="font-mono text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                          {file.odps_number}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not generated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{file.applicant_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{file.applicant_mobile || 'No Mobile'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{file.work_type}</div>
                      <div className="text-[11px] text-slate-400">{file.permission_type || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {file.specific_built_up_area ? `${file.specific_built_up_area} sq.ft` : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(getCreatedDate(file))}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/files/${file.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                        Open Workspace
                      </Link>
                      {hasPermission('files', 'delete') && <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(file.id, file.file_number);
                        }}
                        title={`Delete ${file.file_number}`}
                        aria-label={`Delete ${file.file_number}`}
                        className="inline-flex items-center justify-center w-7 h-7 ml-2 rounded bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <div>
                Showing <strong className="text-slate-200">{startItem}</strong> -{' '}
                <strong className="text-slate-200">{endItem}</strong> of{' '}
                <strong className="text-slate-200">{totalItems}</strong> files
              </div>

              <div className="flex items-center space-x-1.5 pl-4 border-l border-slate-800">
                <span className="text-slate-500">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={safePage <= 1 || isDataLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                <span>Prev</span>
              </button>

              {getPageNumbers(safePage, totalPages).map((pNum, i) =>
                typeof pNum === 'number' ? (
                  <button
                    key={i}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg font-semibold transition-colors text-xs ${pNum === safePage
                        ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950/50'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                  >
                    {pNum}
                  </button>
                ) : (
                  <span key={i} className="px-1.5 text-slate-500">
                    ...
                  </span>
                )
              )}

              <button
                disabled={safePage >= totalPages || isDataLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


