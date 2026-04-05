import type { Condition } from "@/core/domain/user-profile";

export type SensitivityAnswer = "yes" | "no" | "unknown";

export const CONDITIONS: Array<{ value: Condition; label: string; emoji: string }> = [
  { value: "hashimoto", label: "Hashimoto-Thyreoiditis", emoji: "🦋" },
  { value: "pcos", label: "PCOS (Polyzystisches Ovarialsyndrom)", emoji: "🔵" },
  { value: "both", label: "Beides", emoji: "✦" },
];

export const SENSITIVITY_OPTIONS: Array<{ value: SensitivityAnswer; label: string }> = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nein" },
  { value: "unknown", label: "Weiß nicht" },
];
