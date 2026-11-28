import type { Validation } from "../research-core";
import type { DatasetSnapshot } from "./ina-contracts";

export interface CanonicalSourceManifest {
  schemaVersion: number;
  sourceUrl: string;
  fetchedAt: string;
  sha256: string;
  byteLength: number;
  rowCount: number;
  earliestDrawId: number | null;
  latestDrawId: number | null;
  earliestDate?: string | null;
  latestDate?: string | null;
  snapshot: string;
  etag?: string | null;
  lastModified?: string | null;
}

export async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable in this environment");
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await subtle.digest("SHA-256", copy);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}

export function snapshotFromCanonicalManifest(manifest: CanonicalSourceManifest): DatasetSnapshot {
  return {
    snapshotId: manifest.snapshot,
    sourceType: "remote",
    sourceUrl: manifest.sourceUrl,
    fetchedAt: manifest.fetchedAt,
    sha256: manifest.sha256.toLowerCase(),
    byteLength: manifest.byteLength,
    rowCount: manifest.rowCount,
    earliestDrawId: manifest.earliestDrawId,
    latestDrawId: manifest.latestDrawId,
    earliestDate: manifest.earliestDate ?? null,
    latestDate: manifest.latestDate ?? null,
    etag: manifest.etag ?? null,
  };
}

export async function snapshotFromLocalCsv(
  csv: string,
  validation: Validation,
  fileName: string,
  fetchedAt = new Date().toISOString(),
): Promise<DatasetSnapshot> {
  const bytes = new TextEncoder().encode(csv);
  const sha256 = await computeSha256Hex(bytes);
  const ordered = [...validation.valid].sort((a, b) => a.drawId - b.drawId);
  const dates = ordered.map(draw => draw.date).filter((date): date is string => Boolean(date)).sort();
  return {
    snapshotId: "local:" + (fileName.trim() || "uploaded-csv") + ":" + sha256,
    sourceType: "local",
    sourceUrl: null,
    fetchedAt,
    sha256,
    byteLength: bytes.byteLength,
    rowCount: ordered.length,
    earliestDrawId: ordered[0]?.drawId ?? null,
    latestDrawId: ordered.at(-1)?.drawId ?? null,
    earliestDate: dates[0] ?? null,
    latestDate: dates.at(-1) ?? null,
  };
}

export async function verifySnapshotBytes(bytes: Uint8Array, snapshot: DatasetSnapshot): Promise<boolean> {
  return (await computeSha256Hex(bytes)) === snapshot.sha256.toLowerCase();
}
