const NOTIFS = [
  { color: "var(--accent)", amount: "29,90 €", from: "****@gmail.com", when: "maintenant", delay: "0.1s" },
  { color: "var(--accent-2)", amount: "59,90 €", from: "****@outlook.fr", when: "il y a 12 min", delay: "0.35s" },
  { color: "#4C6FFF", amount: "14,90 €", from: "****@gmail.com", when: "il y a 1 h", delay: "0.6s" },
];

export function PhoneMockup() {
  return (
    <div className="w-[260px] sm:w-[300px] -rotate-[4deg] bg-surface border border-white/[0.08] rounded-[38px] p-3 shadow-[0_28px_56px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center px-2.5 pt-1.5 pb-2.5">
        <span className="text-foreground text-[13px] font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="10" viewBox="0 0 16 10">
            <rect x="0" y="6" width="2.4" height="4" rx="0.5" fill="#F5F6F8" />
            <rect x="3.6" y="4" width="2.4" height="6" rx="0.5" fill="#F5F6F8" />
            <rect x="7.2" y="2" width="2.4" height="8" rx="0.5" fill="#F5F6F8" />
            <rect x="10.8" y="0" width="2.4" height="10" rx="0.5" fill="#F5F6F8" />
          </svg>
          <svg width="22" height="11" viewBox="0 0 22 11">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="#F5F6F8" fill="none" />
            <rect x="2" y="2" width="14" height="7" rx="1" fill="#F5F6F8" />
            <rect x="19" y="3.2" width="1.8" height="4.6" rx="0.8" fill="#F5F6F8" />
          </svg>
        </div>
      </div>
      <div className="text-center text-foreground font-display font-semibold text-[32px] pb-3.5">
        9:41
      </div>
      <div className="flex flex-col gap-2">
        {NOTIFS.map((n, i) => (
          <div
            key={i}
            className="notif-card bg-[#F5F4F1] rounded-2xl px-3.5 py-3 flex gap-2.5 items-start"
            style={{ animationDelay: n.delay }}
          >
            <div
              className="w-7 h-7 rounded-lg text-white font-display font-semibold text-[13px] flex items-center justify-center shrink-0"
              style={{ background: n.color }}
            >
              S
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] font-bold text-[#1A1D26]">Stripe</span>
                <span className="text-[10px] text-[#8A8A8A]">{n.when}</span>
              </div>
              <div className="text-[12px] text-[#33363E] leading-snug mt-0.5">
                Paiement reçu : <strong>{n.amount}</strong> de {n.from}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
