import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, IdCard, Calendar, UserCheck, UserX, Camera, Trash2, AlertCircle } from 'lucide-react';
import type { Student } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import * as faceApi from '../api/face.ts';

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
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF7A3D]/20 border-t-[#FF7A3D]" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0f14] px-6 text-white">
        <AlertCircle className="mb-4 text-red-400" size={48} />
        <p className="text-lg text-gray-400">{error || 'Student not found'}</p>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="mt-4 text-sm text-[#FF7A3D] hover:text-[#ff8f5a]"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/students')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      <div className="mx-auto max-w-4xl">
        {/* Student Info Card */}
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF7A3D]/10 text-2xl font-semibold text-[#FF7A3D]">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {student.name}
                </h1>
                <p className="text-sm text-gray-400">
                  {student.class} {student.division} • {student.department}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteStudent}
              disabled={deleting}
              className="flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <IdCard className="text-gray-400" size={18} />
              <div>
                <div className="text-xs text-gray-500">Student ID</div>
                <div className="text-sm font-medium">{student.studentId}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <IdCard className="text-gray-400" size={18} />
              <div>
                <div className="text-xs text-gray-500">Roll Number</div>
                <div className="text-sm font-medium">{student.rollNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <Mail className="text-gray-400" size={18} />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium">{student.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <Calendar className="text-gray-400" size={18} />
              <div>
                <div className="text-xs text-gray-500">Semester</div>
                <div className="text-sm font-medium">{student.semester}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Face Recognition Card */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Face Recognition
          </h2>

          {student.faceStatus === 'REGISTERED' ? (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <UserCheck className="text-green-400" size={24} />
                <div>
                  <div className="font-medium text-green-400">Face Registered</div>
                  {student.faceProfile && (
                    <div className="mt-1 text-xs text-gray-400">
                      Model: {student.faceProfile.modelVersion} • Registered{' '}
                      {new Date(student.faceProfile.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/dashboard/students/${id}/register-face`)}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-all hover:bg-white/10"
                >
                  <Camera size={16} />
                  Re-register Face
                </button>
                <button
                  onClick={handleDeleteFace}
                  disabled={deletingFace}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
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
                  <div className="mt-1 text-xs text-gray-400">
                    Register this student's face to enable AI attendance recognition
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/dashboard/students/${id}/register-face`)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <Camera size={16} />
                Register Face
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
