import { motion } from 'framer-motion';
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

export function AuthExperimentLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ExperimentalAuthLayout
      eyebrow="Intelligent faculty operations"
      headline={
        <>
          Faculty automation <span className="text-[#FF7A3D]">powered by AI.</span>
        </>
      }
      description="Simplify attendance, assignments, grading, notices, and analytics while you focus on teaching."
    >
      <ExperimentalAuthCard>
        <div className="mb-7">
          <h1
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Welcome back.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#FBEFE6]/65">
            Sign in to continue to your EduFlow workspace.
          </p>
        </div>

        <ExperimentalAuthForm
          error={error}
          submitting={submitting}
          submitLabel="Sign in"
          submittingLabel="Signing in..."
          onSubmit={handleSubmit}
        >
          <ExperimentalEmailField id="experiment-login-email" value={email} onChange={setEmail} />
          <ExperimentalPasswordField
            id="experiment-login-password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            action={
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#FF7A3D] outline-none transition hover:text-[#ff8f5a] focus-visible:ring-2 focus-visible:ring-[#FF7A3D]"
              >
                Forgot?
              </Link>
            }
          />
          <label className="flex min-h-6 cursor-pointer items-center gap-2.5 text-sm text-[#FBEFE6]/75">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-[18px] w-[18px] rounded border-white/20 bg-white/5 text-[#FF7A3D] focus:ring-2 focus:ring-[#FF7A3D]/35 focus:ring-offset-0"
            />
            Remember me
          </label>
        </ExperimentalAuthForm>

        <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-[#FBEFE6]/65">
          New to EduFlow?{' '}
          <motion.span whileHover={{ x: 1 }} className="inline-block">
            <Link
              to="/register"
              className="font-semibold text-[#FF7A3D] outline-none transition hover:text-[#ff8f5a] focus-visible:ring-2 focus-visible:ring-[#FF7A3D]"
            >
              Create an account
            </Link>
          </motion.span>
        </div>
      </ExperimentalAuthCard>
    </ExperimentalAuthLayout>
  );
}
