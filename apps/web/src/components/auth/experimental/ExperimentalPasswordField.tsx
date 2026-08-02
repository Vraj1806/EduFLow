import { motion } from 'framer-motion';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ExperimentalPasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  action?: ReactNode;
}

export function ExperimentalPasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  value,
  onChange,
  minLength,
  action,
}: ExperimentalPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[#FBEFE6]/90">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <LockKeyhole
          aria-hidden
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#FBEFE6]/35"
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 pl-11 pr-12 text-sm text-[#FBEFE6] placeholder:text-[#FBEFE6]/35 outline-none transition duration-150 focus:border-[#FF7A3D] focus:bg-white/[0.075] focus:ring-4 focus:ring-[#FF7A3D]/15"
          placeholder={placeholder}
        />
        <motion.button
          type="button"
          onClick={() => setVisible((current) => !current)}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#FBEFE6]/45 outline-none transition hover:bg-white/[0.07] hover:text-[#FF7A3D] focus-visible:ring-2 focus-visible:ring-[#FF7A3D]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </motion.button>
      </div>
    </div>
  );
}
