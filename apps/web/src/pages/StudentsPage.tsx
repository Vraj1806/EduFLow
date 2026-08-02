import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertCircle, UserCheck, UserX } from 'lucide-react';
import type { Student } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';

export function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      setError(null);
      const { students } = await studentApi.getAllStudents();
      setStudents(students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      loadStudents();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { students } = await studentApi.searchStudents(query);
      setStudents(students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Students
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage student profiles and face registration
        </p>
      </div>

      {/* Search and Add */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-[#FF7A3D]/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF7A3D]/20"
          />
        </div>
        <button
          onClick={() => navigate('/dashboard/students/add')}
          className="flex h-11 items-center gap-2 rounded-lg bg-[#FF7A3D] px-5 text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a] active:scale-95"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={18} />
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF7A3D]/20 border-t-[#FF7A3D]" />
        </div>
      )}

      {/* Student List */}
      {!loading && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Search className="text-gray-500" size={24} />
          </div>
          <p className="text-gray-400">
            {searchQuery ? 'No students found matching your search' : 'No students yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/dashboard/students/add')}
              className="mt-4 text-sm text-[#FF7A3D] hover:text-[#ff8f5a]"
            >
              Add your first student
            </button>
          )}
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Roll No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Face Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/dashboard/students/${student.id}`)}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7A3D]/10 text-sm font-semibold text-[#FF7A3D]">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{student.rollNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {student.class} {student.division}
                    </td>
                    <td className="px-6 py-4">
                      {student.faceStatus === 'REGISTERED' ? (
                        <div className="flex items-center gap-2 text-sm text-green-400">
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
      )}
    </div>
  );
}
