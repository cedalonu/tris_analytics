import type { Draw, Validation } from "../research-core";

/** A captured, immutable source artifact. SHA-256 is supplied by the ingestion layer. */
export interface DatasetSnapshot {
  snapshotId: string;
  sourceUrl: string;
  fetchedAt: string;
  sha256: string;
  byteLength?: number;
  rowCount: number;
  earliestDrawId: number | null;
  latestDrawId: number | null;
  earliestDate?: string | null;
  latestDate?: string | null;
  etag?: string | null;
}

/** Version identity shared by every INA consumer. */
export interface DatasetVersion {
  versionId: string;
  snapshotId: string;
  sha256: string;
  drawCount: number;
  drawStart: number | null;
  drawCutoff: number | null;
  createdAt: string;
  schemaVersion: "1.0";
}

export type EvidenceStatus =
  | "observed"
  | "descriptive"
  | "exploratory"
  | "backtested"
  | "holdout"
  | "prospective"
  | "accepted-experimental"
  | "quarantined";

export interface EvidenceDescriptor {
  status: EvidenceStatus;
  phase: "observation" | "exploration" | "validation" | "holdout" | "prospective";
  notes: string[];
}

export interface ResearchOutput<T> {
  outputId: string;
  moduleId: string;
  engineId: string;
  engineVersion: string;
  datasetVersionId: string;
  snapshotSha256: string;
  drawCutoff: number | null;
  sampleSize: number;
  parameters: Readonly<Record<string, string | number | boolean | null>>;
  generatedAt: string;
  evidence: EvidenceDescriptor;
  result: T;
  warnings: string[];
}

export interface InaModuleDefinition {
  moduleId: string;
  title: string;
  engineId: string;
  engineVersion: string;
  consumes: string[];
  produces: string[];
}

export interface InaContext {
  schemaVersion: "1.0";
  version: DatasetVersion;
  snapshot: DatasetSnapshot;
  draws: readonly Draw[];
  quality: {
    valid: boolean;
    warnings: string[];
    errors: string[];
    rowCountMatches: boolean;
    rangeMatches: boolean;
  };
  builtAt: string;
}

export interface InaContextInput {
  snapshot: DatasetSnapshot;
  validation: Validation;
  builtAt?: string;
}

/** Strictly checks the snapshot identity and rows before INA publishes a context. */
export function createInaContext(input: InaContextInput): InaContext {
  const { snapshot, validation } = input;
  const builtAt = input.builtAt ?? new Date().toISOString();
  if (!snapshot.snapshotId.trim()) throw new Error("snapshotId is required");
  if (!/^https?:\/\//.test(snapshot.sourceUrl)) throw new Error("sourceUrl must be an HTTP(S) URL");
  if (!Number.isFinite(Date.parse(snapshot.fetchedAt)) || !Number.isFinite(Date.parse(builtAt))) {
    throw new Error("snapshot fetchedAt and builtAt must be valid timestamps");
  }
  if (!/^[a-f0-9]{64}$/i.test(snapshot.sha256)) throw new Error("snapshot sha256 must be a 64-character hexadecimal digest");
  if (!Number.isInteger(snapshot.rowCount) || snapshot.rowCount < 0) throw new Error("snapshot rowCount must be a nonnegative integer");

  const draws = [...validation.valid].sort((a, b) => a.drawId - b.drawId);
  const rowCountMatches = draws.length === snapshot.rowCount;
  const actualStart = draws[0]?.drawId ?? null;
  const actualCutoff = draws.at(-1)?.drawId ?? null;
  const rangeMatches = actualStart === snapshot.earliestDrawId && actualCutoff === snapshot.latestDrawId;
  const errors = [...validation.errors];
  if (!rowCountMatches) errors.push(`snapshot rowCount mismatch: expected ${snapshot.rowCount}, received ${draws.length}`);
  if (!rangeMatches) errors.push("snapshot draw range does not match validated rows");

  const ids = new Set<number>();
  for (const draw of draws) {
    if (!Number.isInteger(draw.drawId) || draw.drawId <= 0) errors.push("invalid contest number in validated rows");
    if (ids.has(draw.drawId)) errors.push(`duplicate contest number ${draw.drawId} in validated rows`);
    ids.add(draw.drawId);
    if (!Array.isArray(draw.digits) || draw.digits.length !== 5 || draw.digits.some(d => !Number.isInteger(d) || d < 0 || d > 9)) {
      errors.push(`invalid five-digit result at contest ${draw.drawId}`);
    }
  }

  const version: DatasetVersion = {
    versionId: `tris:${snapshot.sha256.toLowerCase()}:${actualCutoff ?? "empty"}`,
    snapshotId: snapshot.snapshotId,
    sha256: snapshot.sha256.toLowerCase(),
    drawCount: draws.length,
    drawStart: actualStart,
    drawCutoff: actualCutoff,
    createdAt: builtAt,
    schemaVersion: "1.0",
  };

  return {
    schemaVersion: "1.0",
    version,
    snapshot: { ...snapshot },
    draws,
    quality: {
      valid: errors.length === 0,
      warnings: [...validation.warnings],
      errors,
      rowCountMatches,
      rangeMatches,
    },
    builtAt,
  };
}

/** Attach a module result to the exact INA dataset context that produced it. */
export function createResearchOutput<T>(
  context: InaContext,
  input: Omit<ResearchOutput<T>, "datasetVersionId" | "snapshotSha256" | "drawCutoff" | "sampleSize">
): ResearchOutput<T> {
  if (!context.quality.valid) throw new Error("cannot publish research output from an invalid INA context");
  if (!input.outputId.trim() || !input.moduleId.trim() || !input.engineId.trim() || !input.engineVersion.trim()) {
    throw new Error("outputId, moduleId, engineId and engineVersion are required");
  }
  if (!Number.isFinite(Date.parse(input.generatedAt))) throw new Error("generatedAt must be a valid timestamp");
  return {
    ...input,
    datasetVersionId: context.version.versionId,
    snapshotSha256: context.version.sha256,
    drawCutoff: context.version.drawCutoff,
    sampleSize: context.version.drawCount,
  };
}
