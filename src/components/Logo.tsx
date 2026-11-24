interface Props {
  compact?: boolean;
}

export function Logo({ compact }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-8 w-8 place-items-center rounded-[10px] border border-white/15 bg-white/[0.04]">
        <span className="absolute inset-[7px] rounded-[4px] border border-dashed border-white/40" />
        <span className="h-2 w-2 rounded-full bg-accent" />
      </div>
      {!compact && <span className="text-[15px] font-semibold tracking-tight">TraceSpace</span>}
    </div>
  );
}
