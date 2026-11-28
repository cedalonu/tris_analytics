import type { Draw, Digit, Pos } from "../research-core";

export interface DashboardDigitDelta {
  digit: Digit;
  recentCount: number;
  recentRate: number;
  historicalCount: number;
  historicalRate: number;
  deltaPp: number;
}
export interface DashboardPositionDelta {
  position: Pos;
  sampleSize: number;
  historicalSampleSize: number;
  digits: DashboardDigitDelta[];
}
export interface DashboardOverview {
  totalDraws: number;
  latestDrawId: number | null;
  windowSize: number;
  positions: DashboardPositionDelta[];
}

/**
 * Shared descriptive output for the operational dashboard.
 * Recent window is compared with the full available history (which includes that window).
 * This is a descriptive contrast, not a forecast or a significance test.
 */
export function buildDashboardOverview(draws: Draw[], windowSize = 100): DashboardOverview {
  const ordered = [...draws].sort((a, b) => a.drawId - b.drawId);
  const recent = ordered.slice(-Math.max(1, Math.floor(windowSize)));
  const positions = Array.from({ length: 5 }, (_, position) => {
    const historicalSampleSize = ordered.length;
    const sampleSize = recent.length;
    const digits = Array.from({ length: 10 }, (_, digit) => {
      const historicalCount = ordered.filter((draw) => draw.digits[position] === digit).length;
      const recentCount = recent.filter((draw) => draw.digits[position] === digit).length;
      const historicalRate = historicalSampleSize ? historicalCount / historicalSampleSize : 0;
      const recentRate = sampleSize ? recentCount / sampleSize : 0;
      return {
        digit: digit as Digit,
        recentCount,
        recentRate,
        historicalCount,
        historicalRate,
        deltaPp: (recentRate - historicalRate) * 100,
      };
    });
    return { position: position as Pos, sampleSize, historicalSampleSize, digits };
  });
  return {
    totalDraws: ordered.length,
    latestDrawId: ordered.at(-1)?.drawId ?? null,
    windowSize: recent.length,
    positions,
  };
}
