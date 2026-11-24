import type { ReactNode } from 'react';

interface Props {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function ToolTile({ label, icon, onClick, active, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex flex-col items-center gap-1.5 rounded-2xl py-2.5 text-[11px] transition active:scale-95 disabled:opacity-35 ${
        active ? 'bg-accent/15 text-accent' : 'bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
