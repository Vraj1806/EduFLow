import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { CreateStudentInput } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import { PageWrapper } from '../components/PageWrapper.tsx';

export function AddStudentPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStudentInput>({
    studentId: '',
    rollNumber: '',
    name: '',
    email: '',
    class: '',
    division: '',
    semester: '',
    department: '',
  });

  function handleChange(field: keyof CreateStudentInput, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { student } = await studentApi.createStudent(formData);
      navigate(`/dashboard/students/${student.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/students')}
        className="mb-6 flex items-center gap-2 text-sm text-[var(--theme-muted)] transition-colors hover:text-[var(--theme-fg)]"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Add Student
        </h1>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">
          Create a new student profile
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--theme-danger)]/20 bg-[var(--theme-danger)]/10 p-4">
              <AlertCircle className="mt-0.5 shrink-0 text-[var(--theme-danger)]" size={18} />
              <div className="text-sm text-[var(--theme-danger)]">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student ID */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-[var(--theme-fg)]">
                Student ID <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="studentId"
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., STU001"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--theme-fg)]">
                Full Name <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., Rahul Patel"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--theme-fg)]">
                Email <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., rahul@example.com"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-[var(--theme-fg)]">
                Roll Number <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="rollNumber"
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., CE-001"
              />
            </div>

            {/* Class and Division */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-[var(--theme-fg)]">
                  Class <span className="text-[var(--theme-danger)]">*</span>
                </label>
                <input
                  id="class"
                  type="text"
                  required
                  value={formData.class}
                  onChange={(e) => handleChange('class', e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                  placeholder="e.g., 6"
                />
              </div>
              <div>
                <label htmlFor="division" className="block text-sm font-medium text-[var(--theme-fg)]">
                  Division <span className="text-[var(--theme-danger)]">*</span>
                </label>
                <input
                  id="division"
                  type="text"
                  required
                  value={formData.division}
                  onChange={(e) => handleChange('division', e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                  placeholder="e.g., A"
                />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-[var(--theme-fg)]">
                Semester <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="semester"
                type="text"
                required
                value={formData.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., 6"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-[var(--theme-fg)]">
                Department <span className="text-[var(--theme-danger)]">*</span>
              </label>
              <input
                id="department"
                type="text"
                required
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="e.g., Computer Engineering"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/students')}
                disabled={submitting}
                className="h-11 flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 flex-1 rounded-lg bg-[var(--theme-primary)] text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {submitting ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
