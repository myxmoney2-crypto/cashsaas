export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
      <span className="text-xs tracking-[2px] text-muted-2 font-semibold uppercase">
        {children}
      </span>
    </div>
  );
}
