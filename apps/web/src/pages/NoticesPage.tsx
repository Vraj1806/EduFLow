import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Megaphone, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import type { CreateNoticeInput, Notice } from '@eduflow/shared';
import * as noticeApi from '../api/notices.ts';
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

const emptyForm: CreateNoticeInput = {
  title: '',
  content: '',
  targetClass: '',
  targetDiv: '',
};

export function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateNoticeInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await noticeApi.getNotices();
      setNotices(data.notices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(notice: Notice) {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      targetClass: notice.targetClass ?? '',
      targetDiv: notice.targetDiv ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  function setField(field: keyof CreateNoticeInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload: CreateNoticeInput = {
        title: form.title,
        content: form.content,
        targetClass: form.targetClass || undefined,
        targetDiv: form.targetDiv || undefined,
      };
      if (editingId) {
        await noticeApi.updateNotice(editingId, payload);
      } else {
        await noticeApi.createNotice(payload);
      }
      setFormOpen(false);
      setEditingId(null);
      loadNotices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(notice: Notice) {
    try {
      await noticeApi.publishNotice(notice.id);
      loadNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish notice');
    }
  }

  async function handleDelete(notice: Notice) {
    if (!confirm(`Delete notice "${notice.title}"?`)) return;
    try {
      await noticeApi.deleteNotice(notice.id);
      loadNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notice');
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      <PageHeader
        title="Notices"
        subtitle="Create and publish notices to your classes"
        action={
          <button onClick={openCreate} className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Plus size={18} />
            New Notice
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Form */}
      {formOpen && (
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {editingId ? 'Edit Notice' : 'New Notice'}
          </h2>

          {formError && <ErrorBanner message={formError} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="n-title" className="mb-1.5 block text-sm font-medium text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="n-title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={inputClass}
                placeholder="e.g., Mid-term exam schedule"
              />
            </div>

            <div>
              <label htmlFor="n-content" className="mb-1.5 block text-sm font-medium text-gray-300">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                id="n-content"
                required
                value={form.content}
                onChange={(e) => setField('content', e.target.value)}
                className={textareaClass}
                rows={4}
                placeholder="Notice details…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="n-class" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Target Class (optional)
                </label>
                <input
                  id="n-class"
                  type="text"
                  value={form.targetClass ?? ''}
                  onChange={(e) => setField('targetClass', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 6 (blank = all classes)"
                />
              </div>
              <div>
                <label htmlFor="n-div" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Target Division (optional)
                </label>
                <input
                  id="n-div"
                  type="text"
                  value={form.targetDiv ?? ''}
                  onChange={(e) => setField('targetDiv', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., A"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className={buttonSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <Spinner label="Loading notices…" />
      ) : notices.length === 0 ? (
        <EmptyState
          title="No notices yet"
          hint="Publish your first notice to keep students informed"
          action={
            <button onClick={openCreate} className={buttonSecondary}>
              <Plus size={16} />
              New Notice
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF7A3D]/10 text-[#FF7A3D]">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {notice.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{notice.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <StatusBadge label={notice.publishedAt ? 'Published' : 'Draft'} tone={notice.publishedAt ? 'green' : 'amber'} />
                      {(notice.targetClass || notice.targetDiv) && (
                        <StatusBadge label={`${notice.targetClass ?? 'All'} ${notice.targetDiv ?? ''}`.trim()} tone="gray" />
                      )}
                      <span>
                        {notice.publishedAt
                          ? `Published ${new Date(notice.publishedAt).toLocaleDateString()}`
                          : `Created ${new Date(notice.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notice.publishedAt && (
                    <button
                      onClick={() => handlePublish(notice)}
                      className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400 transition-all hover:bg-green-500/20"
                    >
                      <Send size={15} />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(notice)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-white/10"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(notice)}
                    className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-all hover:bg-red-500/20"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
