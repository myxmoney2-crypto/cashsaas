const ITEMS = [
  "Claude",
  "Supabase",
  "GitHub",
  "Vercel",
  "Stripe",
  "TikTok",
  "Instagram",
  "YouTube",
  "Whop",
  "Reddit",
];

export function Ticker() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div
      role="region"
      aria-label="Les outils sur lesquels tu vas construire"
      className="w-full py-3.5 border-y border-white/[0.06] overflow-hidden relative"
    >
      <div className="ticker-track">
        {items.map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= ITEMS.length}
            className="text-[13px] text-muted-2 font-semibold whitespace-nowrap"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
