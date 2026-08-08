import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarRange, Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { AttendanceReport, ReportExportMeta } from '@eduflow/shared';
import * as reportApi from '../api/reports.ts';
import type { ReportFilters } from '../api/reports.ts';
import { PageWrapper } from '../components/PageWrapper.tsx';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  StatusBadge,
  buttonPrimary,
  buttonSecondary,
  inputClass,
} from '../components/ui.tsx';

const initialFilters: ReportFilters = {
  classId: '',
  division: '',
  startDate: '',
  endDate: '',
};

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [exportMeta, setExportMeta] = useState<ReportExportMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportApi.getAttendanceReport(filters);
      setReport(data.report);
      setExportMeta(data.export);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function setFilter(field: keyof ReportFilters, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    load();
  }

  function handleReset() {
    setFilters(initialFilters);
    load();
  }

  function handleExport(format: 'csv' | 'pdf') {
    if (!report || report.rows.length === 0) return;
    const url = reportApi.getReportExportUrl(filters, format);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      <PageHeader
        title="Reports"
        subtitle="Generate and review attendance reports"
        action={
          <button onClick={() => load()} className={buttonSecondary}>
            <FileText size={16} />
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Filters */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="r-class" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
              Class
            </label>
            <input
              id="r-class"
              type="text"
              value={filters.classId ?? ''}
              onChange={(e) => setFilter('classId', e.target.value)}
              className={inputClass}
              placeholder="All"
            />
          </div>
          <div>
            <label htmlFor="r-div" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
              Division
            </label>
            <input
              id="r-div"
              type="text"
              value={filters.division ?? ''}
              onChange={(e) => setFilter('division', e.target.value)}
              className={inputClass}
              placeholder="All"
            />
          </div>
          <div>
            <label htmlFor="r-start" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
              Start Date
            </label>
            <input
              id="r-start"
              type="date"
              value={filters.startDate ?? ''}
              onChange={(e) => setFilter('startDate', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="r-end" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
              End Date
            </label>
            <input
              id="r-end"
              type="date"
              value={filters.endDate ?? ''}
              onChange={(e) => setFilter('endDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="submit" className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <CalendarRange size={16} />
            Generate
          </button>
          <button type="button" onClick={handleReset} className={buttonSecondary}>
            Reset
          </button>
        </div>
      </form>

      {loading ? (
        <Spinner label="Generating report…" />
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--theme-fg)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.totalSessions}
              </div>
              <div className="text-xs text-[var(--theme-muted)]">Sessions</div>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--theme-fg)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.totalStudents}
              </div>
              <div className="text-xs text-[var(--theme-muted)]">Students</div>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--theme-success)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.present}
              </div>
              <div className="text-xs text-[var(--theme-muted)]">Present</div>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--theme-danger)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.absent}
              </div>
              <div className="text-xs text-[var(--theme-muted)]">Absent</div>
            </div>
            <div className="rounded-lg border border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/10 p-4 text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.percentage === null ? '—' : `${report.summary.percentage.toFixed(1)}%`}
              </div>
              <div className="text-xs text-[var(--theme-muted)]">Rate</div>
            </div>
          </div>

          {/* Export actions */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3">
            <Download size={16} className="text-[var(--theme-primary)]" />
            <div className="flex-1 text-sm">
              {report.rows.length > 0 ? (
                <span className="text-[var(--theme-fg)]">
                  Download this report as PDF or CSV{exportMeta?.available ? ` (${exportMeta.formats.join(', ')})` : ''}.
                </span>
              ) : (
                <span className="text-[var(--theme-muted)]">
                  Generate a report with records to enable downloads.
                </span>
              )}
            </div>
            {report.rows.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className={buttonPrimary}
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  <FileText size={16} />
                  PDF
                </button>
                <button type="button" onClick={() => handleExport('csv')} className={buttonSecondary}>
                  <FileSpreadsheet size={16} />
                  CSV
                </button>
              </div>
            )}
          </div>

          {/* Rows */}
          {report.rows.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No records match" hint="Try adjusting the filters" />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-left text-xs uppercase tracking-wide text-[var(--theme-muted)]">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Roll No</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={`${row.sessionId}-${row.studentId}`} className="border-b border-[var(--theme-border)] last:border-0">
                      <td className="px-5 py-3 text-[var(--theme-muted)]">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-medium text-[var(--theme-fg)]">{row.name}</td>
                      <td className="px-5 py-3 text-[var(--theme-muted)]">{row.rollNumber}</td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={row.status}
                          tone={row.status === 'PRESENT' ? 'green' : row.status === 'ABSENT' ? 'red' : 'amber'}
                        />
                      </td>
                      <td className="px-5 py-3 text-right text-[var(--theme-muted)]">
                        {row.confidence === null ? '—' : `${(row.confidence * 100).toFixed(0)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </PageWrapper>
  );
}
