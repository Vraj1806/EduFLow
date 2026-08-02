import { motion, useReducedMotion } from 'framer-motion';
import { Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

const VIDEO_URL =
  'https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4';

interface ExperimentalAuthLayoutProps {
  children: ReactNode;
  eyebrow: string;
  headline: ReactNode;
  description: string;
}

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${mobile ? 'justify-center' : ''}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7A3D] shadow-[0_8px_20px_rgba(255,122,61,0.18)]">
        <Sparkles size={21} className="text-[#140A08]" strokeWidth={2.5} />
      </div>
      <span
        className="text-2xl font-bold tracking-tight text-white"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        EduFlow
      </span>
    </div>
  );
}

export function ExperimentalAuthLayout({
  children,
  eyebrow,
  headline,
  description,
}: ExperimentalAuthLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#140A08] text-[#FBEFE6]">
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
      />
      <div className="absolute inset-0 bg-[#140A08]/65" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-48 top-1/4 h-96 w-96 rounded-full bg-[#FF7A3D]/15 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -28, 0], y: [0, 18, 0], opacity: [0.4, 0.72, 0.4] }}
        transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,10,8,0.54),rgba(20,10,8,0.18)_54%,rgba(20,10,8,0.64))]" />

      <main className="relative z-10 flex min-h-screen">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="hidden w-1/2 flex-col justify-center px-12 py-16 lg:flex xl:px-20"
        >
          <Brand />
          <div className="mt-16 max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF7A3D]">
              {eyebrow}
            </p>
            <h1
              className="text-5xl font-bold leading-[1.04] tracking-tight text-white xl:text-6xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {headline}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#FBEFE6]/82 xl:text-lg">{description}</p>
          </div>
          <div className="mt-12 flex items-center gap-4 text-xs font-medium text-[#FBEFE6]/65">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#FF7A3D]" />
              Secure workspace
            </span>
            <span className="h-1 w-1 rounded-full bg-[#FBEFE6]/40" />
            <span className="flex items-center gap-2">
              <Cpu size={16} className="text-[#FF7A3D]" />
              AI-ready workflows
            </span>
          </div>
        </motion.section>

        <section className="flex w-full items-center justify-center px-5 py-8 sm:px-6 sm:py-12 lg:w-1/2 lg:justify-end lg:pr-[7vw]">
          <div className="w-full max-w-[430px]">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
              className="mb-8 lg:hidden"
            >
              <Brand mobile />
            </motion.div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
