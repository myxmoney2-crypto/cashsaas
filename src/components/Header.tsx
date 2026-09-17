import Link from "next/link";

export function Header() {
  return (
    <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between px-6 md:px-16 py-7 relative">
      <Link
        href="/"
        className="font-display font-semibold text-[22px] text-foreground"
      >
        CashSaaS
      </Link>
      <div className="flex items-center gap-4 md:gap-7">
        <Link
          href="/#faq"
          className="hidden sm:inline text-muted-2 text-[15px] font-medium hover:text-foreground transition-colors"
        >
          Questions
        </Link>
        <Link
          href="/login"
          className="text-muted-2 text-[15px] font-medium hover:text-foreground transition-colors"
        >
          Se connecter
        </Link>
        <Link
          href="/questionnaire"
          className="bg-foreground text-background px-[22px] py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Créer mon SaaS
        </Link>
      </div>
    </div>
  );
}
