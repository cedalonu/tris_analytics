/**
 * Shared verified canonical TRIS dataset loader.
 * Both the research dashboard and Intuition dashboard use this exact source,
 * SHA-256 verification, CSV adapter, and INA quarantine contract.
 */
import type { Draw } from "../research-core";
import { importTrisCsv } from "./data-adapter";
import { buildInaCore, type InaCoreResult } from "./ina-core";
import { snapshotFromCanonicalManifest, verifySnapshotBytes, type CanonicalSourceManifest } from "./ina-snapshot";

export const CANONICAL_TRIS_CSV_URL =
  "https://raw.githubusercontent.com/cedalonu/tris_analytics/research-core-v1/data/canonical/Tris.csv";
export const CANONICAL_TRIS_MANIFEST_URL =
  "https://raw.githubusercontent.com/cedalonu/tris_analytics/research-core-v1/data/canonical/source-manifest.json";

export interface CanonicalTrisDataset {
  draws: Draw[];
  manifest: CanonicalSourceManifest;
  ina: InaCoreResult;
  status: "verified";
}


/** Fail closed when manifest metadata disagrees with the parsed canonical rows. */
export function assertCanonicalManifestMatchesDraws(
  manifest: CanonicalSourceManifest,
  draws: Draw[],
  byteLength: number,
): void {
  if (manifest.schemaVersion !== 1 || !manifest.snapshot ||
      !/^([a-f0-9]{64})$/i.test(manifest.sha256) ||
      !Number.isInteger(manifest.byteLength) || manifest.byteLength < 1 ||
      !Number.isInteger(manifest.rowCount) || manifest.rowCount < 1 ||
      !Number.isInteger(manifest.earliestDrawId) || !Number.isInteger(manifest.latestDrawId) ||
      !manifest.fetchedAt || Number.isNaN(Date.parse(manifest.fetchedAt))) {
    throw new Error("El manifiesto canónico no cumple el esquema esperado.");
  }
  if (byteLength !== manifest.byteLength) throw new Error("El tamaño del CSV no coincide con el manifiesto.");
  if (draws.length !== manifest.rowCount) throw new Error("El número de sorteos no coincide con el manifiesto.");
  if (draws[0]?.drawId !== manifest.earliestDrawId ||
      draws.at(-1)?.drawId !== manifest.latestDrawId) {
    throw new Error("El rango de concursos no coincide con el manifiesto canónico.");
  }
  if (manifest.earliestDate && draws[0]?.date !== manifest.earliestDate) {
    throw new Error("La fecha del primer concurso no coincide con el manifiesto canónico.");
  }
  if (manifest.latestDate && draws.at(-1)?.date !== manifest.latestDate) {
    throw new Error("La fecha del último concurso no coincide con el manifiesto canónico.");
  }
}

export async function loadCanonicalTrisDataset(fetcher: typeof fetch = fetch): Promise<CanonicalTrisDataset> {
  const [csvResponse, manifestResponse] = await Promise.all([
    fetcher(CANONICAL_TRIS_CSV_URL, { cache: "no-store" }),
    fetcher(CANONICAL_TRIS_MANIFEST_URL, { cache: "no-store" }),
  ]);
  if (!csvResponse.ok) throw new Error("CSV canónico HTTP " + csvResponse.status);
  if (!manifestResponse.ok) throw new Error("Manifiesto canónico HTTP " + manifestResponse.status);

  const bytes = new Uint8Array(await csvResponse.arrayBuffer());
  const manifest = await manifestResponse.json() as CanonicalSourceManifest;
  if (manifest.schemaVersion !== 1 || !manifest.snapshot || !/^[a-f0-9]{64}$/i.test(manifest.sha256) ||
      !Number.isInteger(manifest.rowCount) || manifest.rowCount < 1 ||
      !Number.isInteger(manifest.byteLength) || manifest.byteLength < 1 ||
      !manifest.fetchedAt || Number.isNaN(Date.parse(manifest.fetchedAt))) {
    throw new Error("El manifiesto canónico no cumple el esquema esperado.");
  }
  if (bytes.byteLength !== manifest.byteLength) throw new Error("El tamaño del CSV no coincide con el manifiesto.");
  const snapshot = snapshotFromCanonicalManifest(manifest);
  if (!(await verifySnapshotBytes(bytes, snapshot))) throw new Error("La huella SHA-256 del CSV no coincide con el manifiesto canónico.");

  const imported = importTrisCsv(new TextDecoder().decode(bytes), manifest.fetchedAt);
  const gaps = imported.validation.warnings.filter(warning => warning.startsWith("draw gap "));
  if (imported.validation.errors.length || gaps.length) {
    throw new Error("El histórico canónico no superó la validación: " + [...imported.validation.errors, ...gaps].slice(0, 4).join("; "));
  }
  assertCanonicalManifestMatchesDraws(manifest, imported.validation.valid, bytes.byteLength);
  const ina = buildInaCore({ snapshot, validation: imported.validation });
  if (ina.status !== "ready") throw new Error("INA puso el histórico en cuarentena: " + ina.blockers.join("; "));
  return { draws: imported.validation.valid, manifest, ina, status: "verified" };
}
