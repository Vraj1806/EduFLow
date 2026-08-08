import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertCircle, UserCheck, UserX } from 'lucide-react';
import type { Student, PaginationMeta } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import { PageWrapper } from '../components/PageWrapper.tsx';

export function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const pageSize = 25;

  useEffect(() => {
    loadStudents(page);
  }, [page]);

  async function loadStudents(p: number) {
    try {
      setLoading(true);
      setError(null);
      const result = await studentApi.getAllStudents(p, pageSize);
      setStudents(result.students);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setPage(1);
    if (query.trim().length === 0) {
      loadStudents(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await studentApi.searchStudents(query, 1, pageSize);
      setStudents(result.students);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    if (searchQuery.trim().length > 0) {
      setLoading(true);
      studentApi.searchStudents(searchQuery, nextPage, pageSize).then(result => {
        setStudents(result.students);
        setMeta(result.meta);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Search failed');
      }).finally(() => setLoading(false));
    }
  }

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Students
        </h1>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">
          Manage student profiles and face registration
        </p>
      </div>

      {/* Search and Add */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] pl-10 pr-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
          />
        </div>
        <button
          onClick={() => navigate('/dashboard/students/add')}
          className="flex h-11 items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-5 text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)] active:scale-95"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--theme-danger)]/20 bg-[var(--theme-danger)]/10 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-[var(--theme-danger)]" size={18} />
          <div className="text-sm text-[var(--theme-danger)]">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-primary)]/20 border-t-[var(--theme-primary)]" />
        </div>
      )}

      {/* Student List */}
      {!loading && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-surface)]">
            <Search className="text-[var(--theme-muted)]" size={24} />
          </div>
          <p className="text-[var(--theme-muted)]">
            {searchQuery ? 'No students found matching your search' : 'No students yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/dashboard/students/add')}
              className="mt-4 text-sm text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
            >
              Add your first student
            </button>
          )}
        </div>
      )}

      {!loading && students.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                      Roll No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                      Face Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--theme-border)]">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => navigate(`/dashboard/students/${student.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[var(--theme-surface)]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-sm font-semibold text-[var(--theme-primary)]">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--theme-fg)]">{student.name}</div>
                            <div className="text-xs text-[var(--theme-muted)]">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--theme-fg)]">{student.rollNumber}</td>
                      <td className="px-6 py-4 text-sm text-[var(--theme-fg)]">
                        {student.class} {student.division}
                      </td>
                      <td className="px-6 py-4">
                        {student.faceStatus === 'REGISTERED' ? (
                          <div className="flex items-center gap-2 text-sm text-[var(--theme-success)]">
                            <UserCheck size={16} />
                            <span>Registered</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-400">
                            <UserX size={16} />
                            <span>Not Registered</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--theme-muted)]">
              <span>
                Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-raised)] disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5">Page {meta.page} of {meta.totalPages}</span>
                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-raised)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
