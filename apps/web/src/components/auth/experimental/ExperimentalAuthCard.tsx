import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ExperimentalAuthCardProps {
  children: ReactNode;
}

export function ExperimentalAuthCard({ children }: ExperimentalAuthCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
      className="relative rounded-2xl bg-[linear-gradient(135deg,rgba(255,122,61,0.52),rgba(255,122,61,0.12)_35%,rgba(255,122,61,0.12)_65%,rgba(255,122,61,0.42))] p-px shadow-[0_20px_50px_rgba(0,0,0,0.42)]"
    >
      <div className="rounded-2xl bg-[#140A08]/70 px-6 py-7 backdrop-blur-[18px] sm:px-8 sm:py-8">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FBEFE6]/65">
          <CheckCircle2 size={13} className="text-[#FF7A3D]" aria-hidden />
          Secure faculty workspace
        </div>
        {children}
      </div>
    </motion.div>
  );
}
