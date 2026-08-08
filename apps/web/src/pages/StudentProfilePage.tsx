import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, IdCard, Calendar, UserCheck, UserX, Camera, Trash2, AlertCircle } from 'lucide-react';
import type { Student } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import * as faceApi from '../api/face.ts';
import { PageWrapper } from '../components/PageWrapper.tsx';

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingFace, setDeletingFace] = useState(false);

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  async function loadStudent() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const { student } = await studentApi.getStudentById(id);
      setStudent(student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStudent() {
    if (!id || !student) return;
    if (!confirm(`Are you sure you want to delete ${student.name}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await studentApi.deleteStudent(id);
      navigate('/dashboard/students');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
      setDeleting(false);
    }
  }

  async function handleDeleteFace() {
    if (!id || !student) return;
    if (!confirm('Remove face registration? The student profile will remain.')) {
      return;
    }

    try {
      setDeletingFace(true);
      await faceApi.deleteFaceProfile(id);
      await loadStudent();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove face data');
    } finally {
      setDeletingFace(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-primary)]/20 border-t-[var(--theme-primary)]" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] px-6 text-[var(--theme-fg)]">
        <AlertCircle className="mb-4 text-[var(--theme-danger)]" size={48} />
        <p className="text-lg text-[var(--theme-muted)]">{error || 'Student not found'}</p>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="mt-4 text-sm text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
        >
          Back to Students
        </button>
      </div>
    );
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

      <div className="mx-auto max-w-4xl">
        {/* Student Info Card */}
        <div className="mb-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-2xl font-semibold text-[var(--theme-primary)]">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {student.name}
                </h1>
                <p className="text-sm text-[var(--theme-muted)]">
                  {student.class} {student.division} • {student.department}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteStudent}
              disabled={deleting}
              className="flex h-9 items-center gap-2 rounded-lg border border-[var(--theme-danger)]/30 bg-[var(--theme-danger)]/10 px-3 text-sm text-[var(--theme-danger)] transition-all hover:bg-[var(--theme-danger)]/20 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-[var(--theme-surface)] p-3">
              <IdCard className="text-[var(--theme-muted)]" size={18} />
              <div>
                <div className="text-xs text-[var(--theme-muted)]">Student ID</div>
                <div className="text-sm font-medium">{student.studentId}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[var(--theme-surface)] p-3">
              <IdCard className="text-[var(--theme-muted)]" size={18} />
              <div>
                <div className="text-xs text-[var(--theme-muted)]">Roll Number</div>
                <div className="text-sm font-medium">{student.rollNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[var(--theme-surface)] p-3">
              <Mail className="text-[var(--theme-muted)]" size={18} />
              <div>
                <div className="text-xs text-[var(--theme-muted)]">Email</div>
                <div className="text-sm font-medium">{student.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[var(--theme-surface)] p-3">
              <Calendar className="text-[var(--theme-muted)]" size={18} />
              <div>
                <div className="text-xs text-[var(--theme-muted)]">Semester</div>
                <div className="text-sm font-medium">{student.semester}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Face Recognition Card */}
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Face Recognition
          </h2>

          {student.faceStatus === 'REGISTERED' ? (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--theme-success)]/20 bg-[var(--theme-success)]/10 p-4">
                <UserCheck className="text-[var(--theme-success)]" size={24} />
                <div>
                  <div className="font-medium text-[var(--theme-success)]">Face Registered</div>
                  {student.faceProfile && (
                    <div className="mt-1 text-xs text-[var(--theme-muted)]">
                      Model: {student.faceProfile.modelVersion} • Registered{' '}
                      {new Date(student.faceProfile.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/dashboard/students/${id}/register-face`)}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)]"
                >
                  <Camera size={16} />
                  Re-register Face
                </button>
                <button
                  onClick={handleDeleteFace}
                  disabled={deletingFace}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--theme-danger)]/30 bg-[var(--theme-danger)]/10 text-sm font-medium text-[var(--theme-danger)] transition-all hover:bg-[var(--theme-danger)]/20 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deletingFace ? 'Removing...' : 'Remove Face Data'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <UserX className="text-amber-400" size={24} />
                <div>
                  <div className="font-medium text-amber-400">Face Not Registered</div>
                  <div className="mt-1 text-xs text-[var(--theme-muted)]">
                    Register this student's face to enable AI attendance recognition
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/dashboard/students/${id}/register-face`)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <Camera size={16} />
                Register Face
              </button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
