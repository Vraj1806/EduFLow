import { HelpCircle, Mail, FileText, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/ui.tsx';
import { PageWrapper } from '../components/PageWrapper.tsx';

export function HelpPage() {
  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      <PageHeader title="Help / Support" subtitle="Documentation, contact information, and quick guides" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[var(--theme-primary)]" />
            <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Quick Start
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-[var(--theme-muted)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary)]" />
              <span>
                <strong className="text-[var(--theme-fg)]">Add students</strong> — Go to Students, click Add Student, fill in the form, and register a face photo for each student.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary)]" />
              <span>
                <strong className="text-[var(--theme-fg)]">Take attendance</strong> — Open Attendance, select a class, and upload or capture a classroom photo. EduFlow will detect and match registered faces automatically.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary)]" />
              <span>
                <strong className="text-[var(--theme-fg)]">Review analytics</strong> — The Analytics page shows attendance rates, trends, and per-class breakdowns.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-primary)]" />
              <span>
                <strong className="text-[var(--theme-fg)]">Manage assignments</strong> — Create, update, and track assignment deadlines from the Assignments page.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={18} className="text-[var(--theme-primary)]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Contact Support
              </h2>
            </div>
            <p className="mb-4 text-sm text-[var(--theme-muted)]">
              For bug reports, feature requests, or account issues, reach out to the EduFlow support team.
            </p>
            <a
              href="mailto:support@eduflow.local"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
            >
              <Mail size={14} />
              support@eduflow.local
            </a>
          </div>

          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-[var(--theme-primary)]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Learn More
              </h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Vraj1806/EduFLow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
                >
                  GitHub Repository <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <span className="text-[var(--theme-muted)]">
                  EduFlow uses AI-powered face recognition to automate classroom attendance tracking.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
