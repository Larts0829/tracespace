import type { CSSProperties } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, suffix = '', disabled, onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className={`block ${disabled ? 'opacity-40' : ''}`}>
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em]">
        <span className="text-white/50">{label}</span>
        <span className="tabular-nums text-white/85">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        className="ts-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ '--fill': `${pct}%` } as CSSProperties}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  );
}
