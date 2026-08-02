import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

interface ExperimentalAuthFormProps {
  children: ReactNode;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ExperimentalAuthForm({
  children,
  error,
  submitting,
  submitLabel,
  submittingLabel,
  onSubmit,
}: ExperimentalAuthFormProps) {
  const reduceMotion = useReducedMotion();

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {children}
      {error && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </motion.div>
      )}
      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={submitting || reduceMotion ? undefined : { y: -1 }}
        whileTap={submitting || reduceMotion ? undefined : { scale: 0.985 }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A3D] px-5 text-sm font-bold text-[#140A08] shadow-[0_8px_20px_rgba(255,122,61,0.22)] outline-none transition hover:shadow-[0_12px_25px_rgba(255,122,61,0.38)] focus-visible:ring-4 focus-visible:ring-[#FF7A3D]/35 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#140A08]/25 border-t-[#140A08]" />
            {submittingLabel}
          </>
        ) : (
          <>
            {submitLabel}
            <ArrowRight size={17} aria-hidden />
          </>
        )}
      </motion.button>
    </form>
  );
}

interface ExperimentalEmailFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function ExperimentalEmailField({ id, value, onChange }: ExperimentalEmailFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-[#FBEFE6]/90">
        Email address
      </label>
      <div className="relative">
        <Mail
          aria-hidden
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FBEFE6]/35"
        />
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-[#FBEFE6] placeholder:text-[#FBEFE6]/35 outline-none transition duration-150 focus:border-[#FF7A3D] focus:bg-white/[0.075] focus:ring-4 focus:ring-[#FF7A3D]/15"
          placeholder="you@institution.edu"
        />
      </div>
    </div>
  );
}
