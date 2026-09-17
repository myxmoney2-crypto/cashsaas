const ITEMS = [
  "Claude",
  "Supabase",
  "GitHub",
  "Vercel",
  "Stripe",
  "TikTok",
  "Instagram",
  "YouTube",
];

export function Ticker() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="w-full py-3.5 border-y border-white/[0.06] overflow-hidden">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[13px] text-muted-2 font-semibold whitespace-nowrap"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
