import Link from "next/link";
import { ScanBarcode, Search, Info, ArrowRight, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8 rounded-full bg-primary-50 p-5">
          <div className="relative">
            <ScanBarcode className="h-14 w-14 text-primary" />
            <Heart className="absolute -top-1 -right-1 h-5 w-5 text-accent fill-accent" />
          </div>
        </div>
        <h1 className="mb-5 text-3xl font-bold tracking-tight text-foreground">
          Hashimoto & PCOS
          <br />
          <span className="text-primary">Ernährungs-Tool</span>
        </h1>
        <p className="mb-10 max-w-sm text-lg text-muted-foreground leading-relaxed">
          Scanne Lebensmittel und erkenne sofort, ob sie für dich geeignet sind — wissenschaftlich fundiert, einfach erklärt.
        </p>
        
        <Link
          href="/scanner"
          className="group flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-card transition-all hover:bg-primary-600 hover:gap-4 hover:shadow-lifted active:scale-[0.98]"
        >
          Jetzt scannen
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Feature Cards */}
      <section className="grid gap-4 px-6 py-8 md:grid-cols-2">
        <div className="card-warm p-6 transition-all hover:shadow-card">
          <div className="mb-4 rounded-full bg-primary-50 p-3 w-fit">
            <ScanBarcode className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Barcode scannen</h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            Scanne den Barcode eines Produkts und erhalte sofort eine Bewertung für deine Ernährung.
          </p>
        </div>
        
        <div className="card-warm p-6 transition-all hover:shadow-card">
          <div className="mb-4 rounded-full bg-secondary/10 p-3 w-fit">
            <Search className="h-7 w-7 text-secondary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Lebensmittel suchen</h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            Durchsuche unsere Datenbank nach Lebensmitteln und vergleiche Produkte.
          </p>
        </div>
        
        <div className="card-warm p-6 md:col-span-2 transition-all hover:shadow-card">
          <div className="mb-4 rounded-full bg-accent/10 p-3 w-fit">
            <Info className="h-7 w-7 text-accent" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Wissenschaftlich fundiert</h3>
          <p className="text-base text-muted-foreground leading-relaxed">
            Alle Bewertungen basieren auf aktueller Forschung zu Hashimoto und PCOS. Keine Angst vor Fachchinesisch — alles einfach erklärt.
          </p>
        </div>
      </section>

      {/* Score Legend */}
      <section className="px-6 py-8">
        <h2 className="mb-5 text-xl font-semibold">So funktioniert die Bewertung</h2>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-sehr_gut shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <span className="text-sm font-medium text-score-sehr_gut">Sehr gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-gut shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
            <span className="text-sm font-medium text-score-gut">Gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-neutral shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">~</span>
            </div>
            <span className="text-sm font-medium text-score-neutral">Neutral</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-weniger_gut shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">!</span>
            </div>
            <span className="text-sm font-medium text-score-weniger_gut">Weniger gut</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-score-vermeiden shadow-soft flex items-center justify-center">
              <span className="text-white text-lg">✗</span>
            </div>
            <span className="text-sm font-medium text-score-vermeiden">Vermeiden</span>
          </div>
        </div>
      </section>
    </div>
  );
}
