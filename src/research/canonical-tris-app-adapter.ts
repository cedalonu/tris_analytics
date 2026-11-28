import type { Draw } from "../research-core";

export interface LegacyTrisDraw {
  num: number;
  win: number[];
  digits: number[];
  date: string;
}

/** Lossless shape adapter for the legacy main dashboard; the canonical draw remains the source of truth. */
export function mapCanonicalDrawsToApp(draws: readonly Draw[]): LegacyTrisDraw[] {
  return draws.map(draw => ({
    num: draw.drawId,
    win: [...draw.digits],
    digits: [...draw.digits],
    date: draw.date ?? "",
  }));
}
