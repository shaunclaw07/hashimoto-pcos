import Link from "next/link";
import { ScanBarcode, Search, Info, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 rounded-full bg-primary/10 p-4">
          <ScanBarcode className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          Hashimoto & PCOS
          <br />
          <span className="text-primary">Ernährungs-Tool</span>
        </h1>
        <p className="mb-8 max-w-sm text-muted-foreground">
          Scanne Lebensmittel und erkenne sofort ob sie für dich geeignet sind 
          - wissenschaftlich fundiert, einfach erklärt.
        </p>
        
        <Link
          href="/scanner"
          className="group flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:gap-4"
        >
          Jetzt scannen
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Feature Cards */}
      <section className="grid gap-4 px-6 py-8 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <ScanBarcode className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Barcode scannen</h3>
          <p className="text-sm text-muted-foreground">
            Scanne den Barcode eines Produkts und erhalte sofort eine Bewertung.
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <Search className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Lebensmittel suchen</h3>
          <p className="text-sm text-muted-foreground">
            Durchsuche unsere Datenbank nach Lebensmitteln und vergleiche Produkte.
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm md:col-span-2">
          <Info className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold">Wissenschaftlich fundiert</h3>
          <p className="text-sm text-muted-foreground">
            Alle Bewertungen basieren auf aktueller Forschung zu Hashimoto und PCOS. 
            Keine Angst vor Fachchinesisch - alles einfach erklärt.
          </p>
        </div>
      </section>

      {/* Score Legend */}
      <section className="px-6 py-8">
        <h2 className="mb-4 text-xl font-semibold">So funktioniert die Bewertung</h2>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[#22c55e]" />
            <span className="font-medium text-[#22c55e]">🟢</span>
            <span>Sehr gut</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[#84cc16]" />
            <span className="font-medium text-[#84cc16]">🟢</span>
            <span>Gut</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[#eab308]" />
            <span className="font-medium text-[#eab308]">🟡</span>
            <span>Neutral</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[#f97316]" />
            <span className="font-medium text-[#f97316]">🟠</span>
            <span>Weniger gut</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[#ef4444]" />
            <span className="font-medium text-[#ef4444]">🔴</span>
            <span>Vermeiden</span>
          </div>
        </div>
      </section>
    </div>
  );
}
