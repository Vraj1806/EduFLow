import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { CreateStudentInput } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';

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
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard/students')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Add Student
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Create a new student profile
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={18} />
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student ID */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-300">
                Student ID <span className="text-red-400">*</span>
              </label>
              <input
                id="studentId"
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., STU001"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., Rahul Patel"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., rahul@example.com"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-300">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                id="rollNumber"
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., CE-001"
              />
            </div>

            {/* Class and Division */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-300">
                  Class <span className="text-red-400">*</span>
                </label>
                <input
                  id="class"
                  type="text"
                  required
                  value={formData.class}
                  onChange={(e) => handleChange('class', e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                  placeholder="e.g., 6"
                />
              </div>
              <div>
                <label htmlFor="division" className="block text-sm font-medium text-gray-300">
                  Division <span className="text-red-400">*</span>
                </label>
                <input
                  id="division"
                  type="text"
                  required
                  value={formData.division}
                  onChange={(e) => handleChange('division', e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                  placeholder="e.g., A"
                />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-300">
                Semester <span className="text-red-400">*</span>
              </label>
              <input
                id="semester"
                type="text"
                required
                value={formData.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., 6"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300">
                Department <span className="text-red-400">*</span>
              </label>
              <input
                id="department"
                type="text"
                required
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
                placeholder="e.g., Computer Engineering"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/students')}
                disabled={submitting}
                className="h-11 flex-1 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 flex-1 rounded-lg bg-[#FF7A3D] text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a] disabled:opacity-50"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {submitting ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
