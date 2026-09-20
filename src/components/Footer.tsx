import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] mt-auto">
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-16 py-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        <div>
          <div className="font-display font-semibold text-xl text-foreground">CashSaaS</div>
          <p className="text-sm text-muted mt-1 mb-0 max-w-[320px]">
            Ton idée, ton code et ton plan pour lancer ton premier SaaS.
          </p>
        </div>
        <nav aria-label="Informations">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm list-none p-0 m-0">
            <li>
              <Link href="/remboursement" className="text-muted hover:text-foreground underline underline-offset-4">
                Conditions de remboursement
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="text-muted hover:text-foreground underline underline-offset-4">
                Mentions légales
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="w-full max-w-[1280px] mx-auto px-6 md:px-16 pb-8 m-0 text-xs text-muted-2">
        © {new Date().getFullYear()} CashSaaS
      </p>
    </footer>
  );
}
