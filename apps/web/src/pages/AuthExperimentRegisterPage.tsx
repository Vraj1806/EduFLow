import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext.tsx';
import { ExperimentalAuthCard } from '../components/auth/experimental/ExperimentalAuthCard.tsx';
import {
  ExperimentalAuthForm,
  ExperimentalEmailField,
} from '../components/auth/experimental/ExperimentalAuthForm.tsx';
import { ExperimentalAuthLayout } from '../components/auth/experimental/ExperimentalAuthLayout.tsx';
import { ExperimentalPasswordField } from '../components/auth/experimental/ExperimentalPasswordField.tsx';

export function AuthExperimentRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ExperimentalAuthLayout
      eyebrow="Build your faculty workspace"
      headline={
        <>
          Bring more focus to <span className="text-[#FF7A3D]">every classroom.</span>
        </>
      }
      description="Join EduFlow to streamline academic workflows with a practical, secure AI assistant."
    >
      <ExperimentalAuthCard>
        <div className="mb-7">
          <h1
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Create your account.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#FBEFE6]/65">
            Start your EduFlow workspace in a few moments.
          </p>
        </div>

        <ExperimentalAuthForm
          error={error}
          submitting={submitting}
          submitLabel="Create account"
          submittingLabel="Creating account..."
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label htmlFor="experiment-register-name" className="text-sm font-medium text-[#FBEFE6]/90">
              Full name
            </label>
            <div className="relative">
              <UserRound
                aria-hidden
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FBEFE6]/35"
              />
              <input
                id="experiment-register-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-[#FBEFE6] placeholder:text-[#FBEFE6]/35 outline-none transition duration-150 focus:border-[#FF7A3D] focus:bg-white/[0.075] focus:ring-4 focus:ring-[#FF7A3D]/15"
                placeholder="Your full name"
              />
            </div>
          </div>
          <ExperimentalEmailField id="experiment-register-email" value={email} onChange={setEmail} />
          <ExperimentalPasswordField
            id="experiment-register-password"
            label="Password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={setPassword}
          />
          <ExperimentalPasswordField
            id="experiment-register-confirm"
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={setConfirm}
          />
        </ExperimentalAuthForm>

        <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-[#FBEFE6]/65">
          Already have an account?{' '}
          <motion.span whileHover={{ x: 1 }} className="inline-block">
            <Link
              to="/login"
              className="font-semibold text-[#FF7A3D] outline-none transition hover:text-[#ff8f5a] focus-visible:ring-2 focus-visible:ring-[#FF7A3D]"
            >
              Sign in
            </Link>
          </motion.span>
        </div>
      </ExperimentalAuthCard>
    </ExperimentalAuthLayout>
  );
}
