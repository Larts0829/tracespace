import type { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function IconButton({ label, onClick, active, disabled, className = '', children }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition active:scale-95 disabled:opacity-35 ${
        active ? 'bg-accent text-ink-950' : 'text-white/80 hover:bg-white/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}
