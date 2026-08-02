import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarRange, Download, FileText } from 'lucide-react';
import type { AttendanceReport, ReportExportMeta } from '@eduflow/shared';
import * as reportApi from '../api/reports.ts';
import type { ReportFilters } from '../api/reports.ts';
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

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
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
        className="mb-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="r-class" className="mb-1.5 block text-sm font-medium text-gray-300">
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
            <label htmlFor="r-div" className="mb-1.5 block text-sm font-medium text-gray-300">
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
            <label htmlFor="r-start" className="mb-1.5 block text-sm font-medium text-gray-300">
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
            <label htmlFor="r-end" className="mb-1.5 block text-sm font-medium text-gray-300">
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
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.totalSessions}
              </div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.totalStudents}
              </div>
              <div className="text-xs text-gray-500">Students</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.present}
              </div>
              <div className="text-xs text-gray-500">Present</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.absent}
              </div>
              <div className="text-xs text-gray-500">Absent</div>
            </div>
            <div className="rounded-lg border border-[#FF7A3D]/30 bg-[#FF7A3D]/10 p-4 text-center">
              <div className="text-2xl font-bold text-[#FF7A3D]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {report.summary.percentage === null ? '—' : `${report.summary.percentage.toFixed(1)}%`}
              </div>
              <div className="text-xs text-gray-400">Rate</div>
            </div>
          </div>

          {/* Export notice */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <Download size={16} className="text-[#FF7A3D]" />
            <div>
              {exportMeta?.available ? (
                <span className="text-gray-300">
                  Export available in {exportMeta.formats.join(', ')}.
                </span>
              ) : (
                <span className="text-gray-500">Export is not available yet. {exportMeta?.note}</span>
              )}
            </div>
          </div>

          {/* Rows */}
          {report.rows.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No records match" hint="Try adjusting the filters" />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-white/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Roll No</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={`${row.sessionId}-${row.studentId}`} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 text-gray-400">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-medium text-white">{row.name}</td>
                      <td className="px-5 py-3 text-gray-400">{row.rollNumber}</td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          label={row.status}
                          tone={row.status === 'PRESENT' ? 'green' : row.status === 'ABSENT' ? 'red' : 'amber'}
                        />
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400">
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
    </div>
  );
}
