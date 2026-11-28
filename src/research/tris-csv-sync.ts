/**
 * Local CSV update tracker for TRIS. No APIs, polling, or network access.
 * It detects appended contests while protecting the already processed prefix.
 * CONCURSO is the contest key; the CSV ID column is not imported or consulted.
 */
import { createHash } from "node:crypto";
import type { Draw } from "../research-core";

export interface TrisSyncCheckpoint {
  schemaVersion: 1;
  processedThroughDrawId: number;
  processedDrawCount: number;
  processedPrefixSha256: string;
  updatedAt: string;
}
export interface TrisSyncResult {
  status: "initialized" | "unchanged" | "updated";
  latestDrawId: number;
  previousDrawId: number | null;
  newDraws: Draw[];
  drawsByDate: Record<string, number>;
  warnings: string[];
  checkpoint: TrisSyncCheckpoint;
}
const canonicalRows = (draws: Draw[]) => draws.map(draw =>
  [draw.drawId, draw.digits.join(""), draw.date ?? ""].join("|")
).join("\n") + (draws.length ? "\n" : "");
export const fingerprintDraws = (draws: Draw[]) =>
  createHash("sha256").update(canonicalRows(draws), "utf8").digest("hex");

export function syncTrisCsvSnapshot(
  draws: Draw[], previous: TrisSyncCheckpoint | null, now = new Date().toISOString()
): TrisSyncResult {
  if (!Array.isArray(draws) || !draws.length) throw new Error("CSV contains no valid TRIS draws");
  for (let index = 0; index < draws.length; index++) {
    const draw = draws[index];
    if (!draw || !Number.isInteger(draw.drawId) || draw.drawId <= 0 ||
        !Array.isArray(draw.digits) || draw.digits.length !== 5 ||
        draw.digits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)) {
      throw new Error("invalid validated draw at index " + index);
    }
    if (index && draw.drawId !== draws[index - 1].drawId + 1) {
      throw new Error("missing contest ID between " + draws[index - 1].drawId + " and " + draw.drawId);
    }
    if (draw.date && Number.isNaN(Date.parse(draw.date))) {
      throw new Error("invalid draw date at contest " + draw.drawId);
    }
  }

  let status: TrisSyncResult["status"], newDraws: Draw[], previousDrawId: number | null = null;
  if (!previous) {
    status = "initialized";
    newDraws = draws.slice();
  } else {
    if (previous.schemaVersion !== 1 || !Number.isInteger(previous.processedThroughDrawId) ||
        previous.processedThroughDrawId <= 0 || !Number.isInteger(previous.processedDrawCount) ||
        previous.processedDrawCount < 1 || !/^[a-f0-9]{64}$/i.test(previous.processedPrefixSha256) ||
        !previous.updatedAt || Number.isNaN(Date.parse(previous.updatedAt))) {
      throw new Error("unsupported or malformed TRIS sync checkpoint");
    }
    previousDrawId = previous.processedThroughDrawId;
    const prefix = draws.filter(draw => draw.drawId <= previousDrawId!);
    if (prefix.length !== previous.processedDrawCount || prefix.at(-1)?.drawId !== previousDrawId) {
      throw new Error("CSV no longer contains the complete processed prefix; restore history before syncing");
    }
    if (fingerprintDraws(prefix) !== previous.processedPrefixSha256.toLowerCase()) {
      throw new Error("previously processed CSV rows changed; refusing incremental sync");
    }
    newDraws = draws.filter(draw => draw.drawId > previousDrawId!);
    if (newDraws.length && newDraws[0].drawId !== previousDrawId + 1) {
      throw new Error("new contests are not contiguous with the previous checkpoint");
    }
    status = newDraws.length ? "updated" : "unchanged";
  }

  const counts: Record<string, number> = {};
  for (const draw of newDraws) if (draw.date) {
    const day = draw.date.slice(0, 10);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  const warnings: string[] = [];
  for (const [day, count] of Object.entries(counts)) if (count > 5) {
    warnings.push(day + " contains " + count + " new contests; all records are retained for review.");
  }
  if (newDraws.length > 5) {
    warnings.push("More than five new contests arrived in one sync; all are retained and processed in contest-ID order.");
  }
  const checkpoint: TrisSyncCheckpoint = {
    schemaVersion: 1,
    processedThroughDrawId: draws.at(-1)!.drawId,
    processedDrawCount: draws.length,
    processedPrefixSha256: fingerprintDraws(draws),
    updatedAt: now,
  };
  return { status, latestDrawId: draws.at(-1)!.drawId, previousDrawId, newDraws, drawsByDate: counts, warnings, checkpoint };
}
