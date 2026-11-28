import type { ResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, type InaModuleRegistry } from "./ina-registry";

export type PropagationState = "current" | "stale" | "missing" | "blocked";

export interface PropagationTarget {
  moduleId: string;
  title: string;
  expectedOutputKeys: string[];
  sourceFiles: string[];
}

export interface PropagationOutputEvidence {
  outputKey: string;
  datasetVersionId: string;
  snapshotSha256: string;
  drawCutoff: number | null;
  sampleSize: number;
}

export interface PropagationTargetResult extends PropagationTarget {
  state: PropagationState;
  outputs: PropagationOutputEvidence[];
  missingOutputKeys: string[];
  reasons: string[];
}

export interface PropagationAudit {
  schemaVersion: 1;
  generatedAt: string;
  canonical: {
    datasetVersionId: string;
    snapshotSha256: string;
    drawCutoff: number | null;
    sampleSize: number;
  };
  totals: Record<PropagationState, number>;
  targets: PropagationTargetResult[];
  registryErrors: string[];
}

/**
 * Compares registered INA consumers with outputs actually produced for one
 * canonical dataset version. Missing outputs remain missing; source-file
 * presence or a module's declared implementation status never implies freshness.
 */
export function auditInaPropagation(
  canonical: PropagationAudit["canonical"],
  outputs: readonly PropagationOutputEvidence[],
  options: { registry?: InaModuleRegistry; generatedAt?: string } = {},
): PropagationAudit {
  const registry = options.registry ?? createDefaultInaModuleRegistry();
  const targets = registry.modules.map(module => {
    const moduleOutputs = outputs.filter(output => module.produces.includes(output.outputKey));
    const missingOutputKeys = module.produces.filter(key => !outputs.some(output => output.outputKey === key));
    const reasons: string[] = [];
    for (const output of moduleOutputs) {
      if (output.datasetVersionId !== canonical.datasetVersionId) reasons.push(output.outputKey + ": dataset version mismatch");
      if (output.snapshotSha256.toLowerCase() !== canonical.snapshotSha256.toLowerCase()) reasons.push(output.outputKey + ": SHA-256 mismatch");
      if (output.drawCutoff !== canonical.drawCutoff) reasons.push(output.outputKey + ": draw cutoff mismatch");
      if (output.sampleSize !== canonical.sampleSize) reasons.push(output.outputKey + ": sample size mismatch");
    }
    if (!registry.valid) reasons.push("INA module registry is invalid");
    const hasMismatch = reasons.length > 0;
    const state: PropagationState = hasMismatch
      ? "blocked"
      : missingOutputKeys.length > 0
        ? moduleOutputs.length > 0 ? "stale" : "missing"
        : "current";
    if (missingOutputKeys.length) reasons.push("missing outputs: " + missingOutputKeys.join(", "));
    return {
      moduleId: module.moduleId,
      title: module.title,
      expectedOutputKeys: [...module.produces],
      sourceFiles: [...module.sourceFiles],
      state,
      outputs: moduleOutputs.map(output => ({ ...output })),
      missingOutputKeys,
      reasons,
    };
  });
  const totals: Record<PropagationState, number> = { current: 0, stale: 0, missing: 0, blocked: 0 };
  for (const target of targets) totals[target.state]++;
  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    canonical: { ...canonical },
    totals,
    targets,
    registryErrors: [...registry.errors],
  };
}

export function propagationEvidenceFromResearchOutputs(
  outputs: readonly ResearchOutput<unknown>[],
): PropagationOutputEvidence[] {
  return outputs.map(output => ({
    outputKey: output.outputKey,
    datasetVersionId: output.datasetVersionId,
    snapshotSha256: output.snapshotSha256,
    drawCutoff: output.drawCutoff,
    sampleSize: output.sampleSize,
  }));
}
