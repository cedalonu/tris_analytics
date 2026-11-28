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

export async function loadCanonicalTrisDataset(fetcher: typeof fetch = fetch): Promise<CanonicalTrisDataset> {
  const [csvResponse, manifestResponse] = await Promise.all([
    fetcher(CANONICAL_TRIS_CSV_URL, { cache: "no-store" }),
    fetcher(CANONICAL_TRIS_MANIFEST_URL, { cache: "no-store" }),
  ]);
  if (!csvResponse.ok) throw new Error("CSV canónico HTTP " + csvResponse.status);
  if (!manifestResponse.ok) throw new Error("Manifiesto canónico HTTP " + manifestResponse.status);

  const bytes = new Uint8Array(await csvResponse.arrayBuffer());
  const manifest = await manifestResponse.json() as CanonicalSourceManifest;
  if (manifest.schemaVersion !== 1 || !manifest.snapshot || !manifest.sha256 ||
      !Number.isInteger(manifest.rowCount) || manifest.rowCount < 1) {
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
  if (imported.validation.valid.length !== manifest.rowCount) throw new Error("El número de sorteos no coincide con el manifiesto.");
  const ina = buildInaCore({ snapshot, validation: imported.validation });
  if (ina.status !== "ready") throw new Error("INA puso el histórico en cuarentena: " + ina.blockers.join("; "));
  return { draws: imported.validation.valid, manifest, ina, status: "verified" };
}
