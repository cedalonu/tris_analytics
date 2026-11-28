import { createHash } from "node:crypto";
import { importTrisCsv } from "./data-adapter";
import { fingerprintDraws, syncTrisCsvSnapshot, type TrisSyncCheckpoint } from "./tris-csv-sync";
import type { Draw } from "../research-core";

export interface CanonicalPrefixManifest {
  schemaVersion?: number;
  sha256?: string;
  byteLength?: number;
  rowCount?: number;
  earliestDrawId?: number;
  latestDrawId?: number;
}

/** Validate the published canonical prefix against an incoming Pakin snapshot.
 * Throws before any snapshot/ledger write when the old prefix is missing,
 * malformed, altered, or internally inconsistent.
 */
export function validateCanonicalPrefix(
  previousCsv: string | null,
  previousManifestText: string | null,
  incomingDraws: Draw[],
  fetchedAt: string,
): TrisSyncCheckpoint | null {
  if (Boolean(previousCsv) !== Boolean(previousManifestText)) {
    throw new Error("Canonical CSV and manifest must either both exist or both be absent; refusing update.");
  }
  if (!previousCsv || !previousManifestText) return null;

  let manifest: CanonicalPrefixManifest;
  try { manifest = JSON.parse(previousManifestText) as CanonicalPrefixManifest; }
  catch { throw new Error("Previously published canonical manifest is invalid JSON; refusing source update."); }

  const bytes = Buffer.from(previousCsv, "utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (manifest.schemaVersion !== 1 ||
      manifest.sha256?.toLowerCase() !== sha256 ||
      manifest.byteLength !== bytes.byteLength) {
    throw new Error("Previously published canonical snapshot does not match its manifest; refusing source update.");
  }
  const imported = importTrisCsv(previousCsv);
  const gaps = imported.validation.warnings.filter(warning => warning.startsWith("draw gap "));
  const draws = imported.validation.valid;
  if (imported.validation.errors.length || gaps.length ||
      draws.length !== manifest.rowCount ||
      draws[0]?.drawId !== manifest.earliestDrawId ||
      draws.at(-1)?.drawId !== manifest.latestDrawId) {
    throw new Error("Previously published canonical history fails validation; refusing source update.");
  }
  const checkpoint: TrisSyncCheckpoint = {
    schemaVersion: 1,
    processedThroughDrawId: draws.at(-1)!.drawId,
    processedDrawCount: draws.length,
    processedPrefixSha256: fingerprintDraws(draws),
    updatedAt: fetchedAt,
  };
  // syncTrisCsvSnapshot is the single authority for append-only prefix checks.
  // It compares every historical row, not only the latest contest or count.
  syncTrisCsvSnapshot(incomingDraws, checkpoint, fetchedAt);
  return checkpoint;
}
