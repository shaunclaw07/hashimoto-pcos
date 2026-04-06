// src/core/domain/explanations.ts
import type { Condition } from "./user-profile";

export interface ExplanationSource {
  label: string;
  url: string;
}

export interface Explanation {
  title: string;
  text: string;
  sources?: ExplanationSource[];
  conditionOverrides?: Partial<Record<Condition, string>>;
}

/** All scoring factor explanations, keyed by ScoreBreakdownItem.reason */
export const EXPLANATIONS: Record<string, Explanation> = {
  "Ballaststoffe > 6g/100g": {
    title: "Warum sind Ballaststoffe so gut für dich?",
    text: "Ballaststoffe verlangsamen die Aufnahme von Zucker ins Blut und stabilisieren den Blutzucker. Eine ballaststoffreiche Ernährung gilt als wichtiger Baustein einer Low-GI-Diät, die bei beiden Erkrankungen entzündungshemmend wirkt und die Insulinsensitivität verbessert.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
      { label: "PCOS und Low-GI-Diät (PMID 30853617)", url: "https://pubmed.ncbi.nlm.nih.gov/30853617/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS betrifft Insulinresistenz 50–70 % aller Patientinnen. Ballaststoffe verlangsamen die Zuckeraufnahme und dämpfen Insulinspitzen, was die Androgenproduktion der Ovarien senkt und Symptome wie Zyklusstörungen und Akne verbessert.",
      both: "Ballaststoffe wirken für dich doppelt: Sie verbessern die Insulinsensitivität (PCOS) und reduzieren systemische Entzündungsmarker wie CRP und IL-6, die bei Hashimoto und PCOS gemeinsam erhöht sind.",
    },
  },

  "Ballaststoffe > 3g/100g": {
    title: "Warum sind Ballaststoffe gut für dich?",
    text: "Schon moderate Ballaststoffmengen helfen, den Blutzucker zu stabilisieren. Ballaststoffe sind zentraler Bestandteil einer entzündungshemmenden Ernährung, die bei Hashimoto und PCOS die Krankheitsaktivität positiv beeinflussen kann.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
      { label: "PCOS und Low-GI-Diät (PMID 30853617)", url: "https://pubmed.ncbi.nlm.nih.gov/30853617/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS-bedingter Insulinresistenz helfen schon moderate Ballaststoffmengen, Insulinspitzen nach dem Essen zu dämpfen. Studien zeigen, dass eine Low-GI-Ernährung die Insulinsensitivität verbessert und Androgene senken kann.",
      both: "Auch moderate Ballaststoffmengen tragen zur Entzündungsreduktion bei — das ist relevant, weil CRP und IL-6 bei Hashimoto und PCOS gemeinsam erhöht sind und sich bei Komorbidität gegenseitig verstärken.",
    },
  },

  "Protein > 20g/100g": {
    title: "Warum ist Protein vorteilhaft?",
    text: "Protein sättigt langanhaltend und stabilisiert den Blutzucker, da es keine Insulinspitzen auslöst. Eiweiß liefert Aminosäuren für die Produktion von Schilddrüsenhormonen und ist Bestandteil einer Low-GI-Ernährung, die für beide Erkrankungen empfohlen wird.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
      { label: "PCOS und Low-GI-Diät (PMID 30853617)", url: "https://pubmed.ncbi.nlm.nih.gov/30853617/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS und Insulinresistenz ist proteinreiche Ernährung besonders wirksam: Protein löst kaum Insulinanstieg aus, sättigt nachhaltig und hilft, die Insulinsensitivität zu verbessern — ein Schlüsselmechanismus für die Reduktion von Androgenen und Zyklusregulierung.",
      both: "Für dich doppelt relevant: Protein unterstützt die Schilddrüsenhormon-Synthese (Hashimoto) und verbessert gleichzeitig die Insulinsensitivität (PCOS), ohne den Blutzucker zu belasten.",
    },
  },

  "Omega-3 vorhanden": {
    title: "Warum ist Omega-3 so wichtig?",
    text: "Omega-3-Fettsäuren (EPA und DHA) reduzieren Entzündungsmarker wie TNF-α, IL-6 und CRP. Sie regulieren das Gleichgewicht zwischen entzündungsfördernden Th17- und entzündungshemmenden Treg-Zellen — ein gemeinsamer immunologischer Pathway bei Hashimoto und PCOS.",
    sources: [
      { label: "Ferrari et al. (2022) — Th17/Treg Imbalance (PMID 34553676)", url: "https://pubmed.ncbi.nlm.nih.gov/34553676/" },
      { label: "Frontiers in Immunology (2023) — Oxidativer Stress & Immunfunktion", url: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2023.1211231/full" },
      { label: "Anti-inflammatorische Diäten — Übersicht (PMC11576095)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11576095/" },
    ],
  },

  "Glutenfrei-Label": {
    title: "Warum ist Glutenfreiheit positiv bewertet?",
    text: "Eine glutenfreie Ernährung kann bei Autoimmunerkrankungen das Immunsystem entlasten. Studien zeigen, dass Hashimoto-Patientinnen ein 3–5-fach erhöhtes Zöliakie-Risiko haben, und glutenfreie Kost die TPO-Antikörper senken kann.",
    sources: [
      { label: "Glutenfreie Ernährung & Schilddrüsen-Autoimmunität (PMC6825982)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6825982/" },
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
    ],
    conditionOverrides: {
      hashimoto: "Bei Hashimoto gibt es klare Evidenz für molekulare Mimikry: Gluten-Antikörper können aufgrund struktureller Ähnlichkeit auch Schilddrüsengewebe angreifen. Eine glutenarme Ernährung kann TPO-Antikörper (Anti-TPO) und TG-Antikörper langfristig senken.",
      both: "Bei Hashimoto ist glutenarme Kost besonders relevant: Molekulare Mimikry kann dazu führen, dass Gluten-Antikörper Schilddrüsengewebe angreifen. Eine Studie (PMC6825982) zeigt Reduktion der TPO-Antikörper durch Glutenkarenz.",
    },
  },

  "Bio-Label": {
    title: "Warum ist Bio-Qualität positiv?",
    text: "Biologisch angebaute Produkte enthalten weniger synthetische Pestizide. Die mediterrane Ernährung — der Goldstandard bei Hashimoto + PCOS laut aktueller Forschung — betont möglichst naturbelassene, wenig verarbeitete Lebensmittel als Grundprinzip.",
    sources: [
      { label: "Mediterrane Ernährung bei PCOS (PMID 31194381)", url: "https://pubmed.ncbi.nlm.nih.gov/31194381/" },
      { label: "Anti-inflammatorische Diäten — Übersicht (PMC11576095)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11576095/" },
    ],
  },

  "Zucker > 20g/100g": {
    title: "Warum ist so viel Zucker problematisch?",
    text: "Sehr zuckerreiche Lebensmittel sind eine der am besten belegten Ernährungsrisiken bei Hashimoto und PCOS. Zucker steigert Entzündungsmarker wie CRP und IL-6 und fördert Insulinresistenz — zwei pathophysiologische Kernmechanismen beider Erkrankungen.",
    sources: [
      { label: "Muscogiuri et al. (2019) — Insulinresistenz als Verbindungsmechanismus (PMID 29981241)", url: "https://pubmed.ncbi.nlm.nih.gov/29981241/" },
      { label: "Wang et al. (2020) — CRP & IL-6 bei PCOS+Hashimoto (PMID 33096565)", url: "https://pubmed.ncbi.nlm.nih.gov/33096565/" },
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS haben 50–70 % aller Patientinnen eine Insulinresistenz (Muscogiuri et al., 2019). Sehr zuckerreiche Lebensmittel lösen starke Insulinspitzen aus, die die Androgenproduktion der Ovarien ankurbeln. Das verstärkt Symptome wie Zyklusstörungen, Akne und Haarausfall.",
      hashimoto: "Hoher Zuckerkonsum erhöht CRP und IL-6 — Entzündungsmarker, die bei Hashimoto ohnehin erhöht sind (Wang et al., 2020). Zucker kann die autoimmune Schilddrüsenentzündung weiter befeuern und das Ansprechen auf Therapie verschlechtern.",
      both: "Besonders kritisch für dich: Zucker treibt Insulinresistenz (PCOS) und systemische Entzündung (Hashimoto) gleichzeitig an. Wang et al. (2020) zeigen, dass CRP und IL-6 bei Komorbidität signifikant stärker erhöht sind als bei jeder Erkrankung allein.",
    },
  },

  "Zucker > 10g/100g": {
    title: "Warum ist erhöhter Zuckergehalt problematisch?",
    text: "Erhöhter Zuckerkonsum fördert Insulinresistenz und chronische low-grade Inflammation — zwei Kernmechanismen, die Hashimoto und PCOS verbinden. Eine Low-GI-Ernährung mit wenig Zucker ist der am besten belegte Ernährungsansatz für beide Erkrankungen.",
    sources: [
      { label: "Muscogiuri et al. (2019) — Insulinresistenz als Verbindungsmechanismus (PMID 29981241)", url: "https://pubmed.ncbi.nlm.nih.gov/29981241/" },
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS-bedingter Insulinresistenz reagiert dein Körper besonders empfindlich auf zuckerreiche Mahlzeiten. Studien zeigen, dass Low-GI-Diäten die Insulinsensitivität verbessern, Androgene senken und Zyklusstörungen lindern können.",
      hashimoto: "Chronisch erhöhter Blutzucker fördert Entzündungsprozesse, die die Autoimmunaktivität bei Hashimoto verstärken können. Weniger Zucker reduziert CRP und IL-6 — Marker, die bei Hashimoto häufig erhöht sind.",
      both: "Für dich ist eine zuckerarme Ernährung eine der wirkungsvollsten Maßnahmen: Sie wirkt gleichzeitig auf Insulinresistenz (PCOS) und systemische Entzündung (Hashimoto).",
    },
  },

  "Zucker > 5g/100g": {
    title: "Warum wird auch wenig Zucker bewertet?",
    text: "Bei einer diagnostizierten Erkrankung wird der Zuckerkonsum genauer bewertet, da schon moderate Mengen Insulinspiegel und Entzündungsmarker beeinflussen können.",
    sources: [
      { label: "Muscogiuri et al. (2019) — Insulinresistenz als Verbindungsmechanismus (PMID 29981241)", url: "https://pubmed.ncbi.nlm.nih.gov/29981241/" },
      { label: "PCOS und Low-GI-Diät (PMID 30853617)", url: "https://pubmed.ncbi.nlm.nih.gov/30853617/" },
    ],
    conditionOverrides: {
      pcos: "Bei PCOS und Insulinresistenz können schon 5 g Zucker/100 g Insulinspitzen verursachen. Studien zur Low-GI-Diät zeigen, dass konsequent niedriger Zuckerkonsum Androgene senkt, den Zyklus reguliert und das HOMA-IR verbessert.",
      hashimoto: "Bei Hashimoto empfiehlt die Forschung eine generell zuckerarme Ernährung, da Zucker Entzündungsmarker erhöht, die die autoimmune Schilddrüsenentzündung befeuern.",
      both: "Bei beiden Erkrankungen gilt: Je weniger Zucker, desto besser. Eine konsequent zuckerarme Ernährung wirkt gleichzeitig auf Insulinresistenz (PCOS) und Entzündungsaktivität (Hashimoto).",
    },
  },

  "Gesättigte Fette > 10g/100g": {
    title: "Warum sind gesättigte Fette in hohen Mengen problematisch?",
    text: "Gesättigte Fette in hohen Mengen fördern systemische Entzündungen. Studien zu entzündungshemmenden Diäten zeigen, dass die Reduktion gesättigter Fette zugunsten ungesättigter Fette (Omega-3, Olivenöl) Entzündungsmarker wie CRP senkt — relevant bei beiden Erkrankungen.",
    sources: [
      { label: "Anti-inflammatorische Diäten — Übersicht (PMC11576095)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11576095/" },
      { label: "Mediterrane Ernährung bei PCOS (PMID 31194381)", url: "https://pubmed.ncbi.nlm.nih.gov/31194381/" },
    ],
  },

  "Salz > 2.5g/100g": {
    title: "Warum ist sehr viel Salz ungünstig?",
    text: "Hoher Salzkonsum kann Wassereinlagerungen und Ödeme begünstigen. Bei Hashimoto können Ödeme (Myxödem) durch Schilddrüsenunterfunktion ohnehin auftreten — salzreiche Ernährung kann diese Tendenz verstärken. Für die Herzgesundheit, die bei PCOS erhöhtes Risiko trägt, ist Salz ebenfalls relevant.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
      { label: "Capozzi et al. (2020) — Metabolisches Profil PCOS+Hashimoto (PMID 32635785)", url: "https://pubmed.ncbi.nlm.nih.gov/32635785/" },
    ],
  },

  "Salz > 1.5g/100g": {
    title: "Warum wird erhöhter Salzgehalt bewertet?",
    text: "Erhöhter Salzkonsum kann langfristig Blutdruck und Wassereinlagerungen begünstigen. Bei Hashimoto-bedingter Schilddrüsenunterfunktion ist die Tendenz zu Ödemen (Myxödem) ohnehin erhöht, weshalb eine salzarme Ernährung empfohlen wird.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
    ],
  },

  "Gluten in Zutaten": {
    title: "Warum wird Gluten in den Zutaten negativ bewertet?",
    text: "Gluten kann bei bestimmten Personen Immunreaktionen auslösen. Hashimoto-Patientinnen haben ein 3–5-fach erhöhtes Zöliakie-Risiko, und eine Studie (PMC6825982) zeigt, dass Glutenkarenz TPO-Antikörper senken kann — auch ohne Zöliakie-Diagnose.",
    sources: [
      { label: "Glutenfreie Ernährung & Schilddrüsen-Autoimmunität (PMC6825982)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6825982/" },
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
    ],
    conditionOverrides: {
      hashimoto: "Bei Hashimoto ist die Evidenz für molekulare Mimikry gut dokumentiert: Die Proteinstruktur von Gluten ähnelt Schilddrüsenantigenen. Antikörper gegen Gluten können deshalb auch Schilddrüsengewebe angreifen. Studien zeigen, dass eine glutenarme Ernährung TPO-Antikörper (Anti-TPO) und TG-Antikörper langfristig senken kann.",
      both: "Bei Hashimoto ist Gluten besonders problematisch: Molekulare Mimikry lässt Gluten-Antikörper auf Schilddrüsengewebe reagieren. Eine glutenarme Ernährung kann nachweislich die Schilddrüsenantikörper senken (PMC6825982).",
    },
  },

  "Laktose in Zutaten": {
    title: "Warum wird Laktose/Milch negativ bewertet?",
    text: "Viele Hashimoto-Patientinnen haben eine subklinische Laktoseintoleranz. Das Milchprotein Kasein kann bei empfindlichen Personen intestinale Entzündungen fördern, die systemische Entzündungsmarker erhöhen — ein Mechanismus, der bei Autoimmunerkrankungen relevant ist.",
    sources: [
      { label: "Diätinterventionen Hashimoto + PCOS (PMID 31272183)", url: "https://pubmed.ncbi.nlm.nih.gov/31272183/" },
      { label: "Frontiers in Immunology (2023) — Immunfunktion & Ernährung", url: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2023.1211231/full" },
    ],
    conditionOverrides: {
      hashimoto: "Bei Hashimoto ist die Laktoseintoleranz häufiger als in der Normalbevölkerung. Kasein (Milchprotein) kann ähnliche Immunreaktionen auslösen wie Gluten und die Autoimmunaktivität verstärken. Viele Betroffene berichten über Besserung von Fatigue und GI-Symptomen nach Reduktion von Milchprodukten.",
    },
  },

  ">5 Zusatzstoffe": {
    title: "Warum werden viele Zusatzstoffe negativ bewertet?",
    text: "Stark verarbeitete Lebensmittel mit vielen synthetischen Zusatzstoffen gelten als entzündungsfördernd. Die Forschung verbindet stark prozessierte Ernährung mit erhöhten CRP- und IL-6-Werten — Entzündungsmarkern, die bei Hashimoto und PCOS gemeinsam erhöht sind.",
    sources: [
      { label: "Frontiers in Immunology (2023) — Oxidativer Stress & Immunfunktion", url: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2023.1211231/full" },
      { label: "Anti-inflammatorische Diäten — Übersicht (PMC11576095)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11576095/" },
    ],
  },
};

/**
 * Returns the explanation for a scoring factor, with optional condition-specific text override.
 * Returns null if no explanation exists for the given reason.
 */
export function getExplanation(reason: string, condition?: Condition): Explanation | null {
  const explanation = EXPLANATIONS[reason];
  if (!explanation) return null;

  if (condition && explanation.conditionOverrides?.[condition]) {
    return {
      ...explanation,
      text: explanation.conditionOverrides[condition]!,
    };
  }

  return explanation;
}

/** All reason strings that have explanations */
export const EXPLAINED_REASONS = Object.keys(EXPLANATIONS);
