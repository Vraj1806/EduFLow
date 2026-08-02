import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Assignment, CreateAssignmentInput } from '@eduflow/shared';
import * as assignmentApi from '../api/assignments.ts';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  StatusBadge,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  textareaClass,
} from '../components/ui.tsx';

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm: CreateAssignmentInput = {
  title: '',
  description: '',
  classId: '',
  division: '',
  deadline: '',
};

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAssignmentInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assignmentApi.getAssignments();
      setAssignments(data.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(assignment: Assignment) {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      division: assignment.division,
      deadline: toDatetimeLocal(new Date(assignment.deadline)),
    });
    setFormError(null);
    setFormOpen(true);
  }

  function setField(field: keyof CreateAssignmentInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = { ...form, deadline: new Date(form.deadline).toISOString() };
      if (editingId) {
        await assignmentApi.updateAssignment(editingId, payload);
      } else {
        await assignmentApi.createAssignment(payload);
      }
      setFormOpen(false);
      setEditingId(null);
      loadAssignments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(assignment: Assignment) {
    if (!confirm(`Delete assignment "${assignment.title}"?`)) return;
    try {
      await assignmentApi.deleteAssignment(assignment.id);
      loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your classes"
        action={
          <button onClick={openCreate} className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Plus size={18} />
            New Assignment
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Form */}
      {formOpen && (
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {editingId ? 'Edit Assignment' : 'New Assignment'}
          </h2>

          {formError && <ErrorBanner message={formError} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={inputClass}
                placeholder="e.g., Chapter 5 — Algebra Worksheet"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                required
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={textareaClass}
                rows={3}
                placeholder="Instructions for the assignment…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="a-class" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Class <span className="text-red-400">*</span>
                </label>
                <input
                  id="a-class"
                  type="text"
                  required
                  value={form.classId}
                  onChange={(e) => setField('classId', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 6"
                />
              </div>
              <div>
                <label htmlFor="a-division" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Division <span className="text-red-400">*</span>
                </label>
                <input
                  id="a-division"
                  type="text"
                  required
                  value={form.division}
                  onChange={(e) => setField('division', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., A"
                />
              </div>
              <div>
                <label htmlFor="a-deadline" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  id="a-deadline"
                  type="datetime-local"
                  required
                  value={form.deadline}
                  onChange={(e) => setField('deadline', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
                className={buttonSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <Spinner label="Loading assignments…" />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          hint="Create your first assignment to get started"
          action={
            <button onClick={openCreate} className={buttonSecondary}>
              <Plus size={16} />
              New Assignment
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((assignment) => {
            const deadline = new Date(assignment.deadline);
            const overdue = deadline < now;
            return (
              <div key={assignment.id} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {assignment.title}
                  </h3>
                  {overdue ? <StatusBadge label="Overdue" tone="red" /> : <StatusBadge label="Upcoming" tone="green" />}
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-gray-400">{assignment.description}</p>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-300">
                  <StatusBadge label={`${assignment.classId} ${assignment.division}`} tone="orange" />
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <CalendarClock size={15} />
                    Due {deadline.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(assignment)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-white/10"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(assignment)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/20"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && assignments.length > 0 && assignments.some((a) => new Date(a.deadline) >= now) && (
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle size={15} />
          Deadline reminders will be automated through the notification service in a future phase.
        </div>
      )}
    </div>
  );
}
