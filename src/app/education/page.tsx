import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { EXPLANATIONS } from "@/core/domain/explanations";

const POSITIVE_REASONS = [
  "Ballaststoffe > 6g/100g",
  "Ballaststoffe > 3g/100g",
  "Protein > 20g/100g",
  "Omega-3 vorhanden",
  "Glutenfrei-Label",
  "Bio-Label",
];

const NEGATIVE_REASONS = [
  "Zucker > 20g/100g",
  "Zucker > 10g/100g",
  "Zucker > 5g/100g",
  "Gesättigte Fette > 10g/100g",
  "Salz > 2.5g/100g",
  "Salz > 1.5g/100g",
  "Gluten in Zutaten",
  "Laktose in Zutaten",
  ">5 Zusatzstoffe",
];

function ExplanationCard({
  reason,
  positive,
}: {
  reason: string;
  positive: boolean;
}) {
  const explanation = EXPLANATIONS[reason];
  if (!explanation) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${positive ? "text-green-600" : "text-red-500"}`}>
          {positive ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{reason}</p>
          <h3 className="mt-1 text-sm font-medium text-muted-foreground">
            {explanation.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {explanation.text}
          </p>
          {explanation.conditionOverrides && (
            <div className="mt-3 space-y-2">
              {explanation.conditionOverrides.hashimoto && (
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs font-medium text-primary mb-1">🦋 Bei Hashimoto:</p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {explanation.conditionOverrides.hashimoto}
                  </p>
                </div>
              )}
              {explanation.conditionOverrides.pcos && (
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs font-medium text-primary mb-1">🔵 Bei PCOS:</p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {explanation.conditionOverrides.pcos}
                  </p>
                </div>
              )}
            </div>
          )}
          {explanation.sources && explanation.sources.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">📚 Quellen:</p>
              <ul className="space-y-0.5">
                {explanation.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ErklaerungPage() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <div className="mx-auto max-w-lg px-4">
        {/* Back navigation */}
        <div className="mb-6 mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Warum diese Bewertungen?</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Hier erfährst du, warum bestimmte Inhaltsstoffe deinen Score beeinflussen — und was das für Hashimoto und PCOS bedeutet.
          </p>
        </div>

        {/* Intro cards */}
        <div className="mb-8 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-1">🦋 Hashimoto-Thyreoiditis</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Eine Autoimmunerkrankung, bei der das Immunsystem die Schilddrüse angreift. Entzündungsfördernde Lebensmittel, Gluten und ein ungesundes Darmmikrobiom können die Krankheitsaktivität verstärken.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-1">🔵 PCOS (Polyzystisches Ovarialsyndrom)</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Eine hormonelle Störung, die oft mit Insulinresistenz einhergeht. Zuckerreiche Lebensmittel und fehlende Ballaststoffe können Insulinspitzen verursachen, die den Androgenspiegel erhöhen.
            </p>
          </div>
        </div>

        {/* Positive factors */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Positive Bewertungsfaktoren
          </h2>
          <div className="space-y-3">
            {POSITIVE_REASONS.map((reason) => (
              <ExplanationCard key={reason} reason={reason} positive />
            ))}
          </div>
        </section>

        {/* Negative factors */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Negative Bewertungsfaktoren
          </h2>
          <div className="space-y-3">
            {NEGATIVE_REASONS.map((reason) => (
              <ExplanationCard key={reason} reason={reason} positive={false} />
            ))}
          </div>
        </section>

        {/* Research note */}
        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            📚 Alle Erklärungen basieren auf aktueller ernährungsmedizinischer Forschung zu Hashimoto-Thyreoiditis und PCOS. Diese App ersetzt keine ärztliche Beratung.
          </p>
        </div>
      </div>
    </div>
  );
}
