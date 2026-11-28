import type { ResearchOutput, InaModuleDefinition } from "./ina-contracts";

export interface InaDependencyEdge {
  fromModuleId: string;
  toModuleId: string;
  dependencyKey: string;
}

export interface InaModuleRegistry {
  modules: InaModuleDefinition[];
  externalInputs: string[];
  edges: InaDependencyEdge[];
  topologicalOrder: string[];
  valid: boolean;
  errors: string[];
}

export function createInaModuleRegistry(
  modules: InaModuleDefinition[],
  externalInputs: string[] = [],
): InaModuleRegistry {
  const errors: string[] = [];
  const byId = new Map<string, InaModuleDefinition>();
  const producerByKey = new Map<string, string>();
  const external = new Set(externalInputs);

  for (const module of modules) {
    if (!module.moduleId.trim() || !module.engineId.trim() || !module.engineVersion.trim()) {
      errors.push("moduleId, engineId and engineVersion are required");
      continue;
    }
    if (byId.has(module.moduleId)) errors.push("duplicate moduleId: " + module.moduleId);
    byId.set(module.moduleId, module);
    if (module.consumes.includes(module.moduleId) || module.produces.includes(module.moduleId)) {
      errors.push("module " + module.moduleId + " cannot use its moduleId as a dependency key");
    }
    for (const key of module.produces) {
      if (producerByKey.has(key)) errors.push("multiple producers for dependency key: " + key);
      else producerByKey.set(key, module.moduleId);
      if (external.has(key)) errors.push("dependency key is both external and internally produced: " + key);
    }
  }

  const edges: InaDependencyEdge[] = [];
  for (const module of modules) {
    for (const key of module.consumes) {
      const producer = producerByKey.get(key);
      if (!producer && !external.has(key)) {
        errors.push("unresolved dependency " + key + " consumed by " + module.moduleId);
      } else if (producer) {
        if (producer === module.moduleId) errors.push("module " + module.moduleId + " consumes its own output " + key);
        else edges.push({ fromModuleId: producer, toModuleId: module.moduleId, dependencyKey: key });
      }
    }
  }

  const indegree = new Map<string, number>(modules.map(module => [module.moduleId, 0]));
  const outgoing = new Map<string, string[]>(modules.map(module => [module.moduleId, []]));
  for (const edge of edges) {
    if (!indegree.has(edge.fromModuleId) || !indegree.has(edge.toModuleId)) continue;
    indegree.set(edge.toModuleId, (indegree.get(edge.toModuleId) ?? 0) + 1);
    outgoing.get(edge.fromModuleId)?.push(edge.toModuleId);
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id).sort();
  const topologicalOrder: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    topologicalOrder.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const degree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
    queue.sort();
  }
  if (topologicalOrder.length !== modules.length) errors.push("module dependency cycle detected");

  return {
    modules: modules.map(module => ({
      ...module,
      consumes: [...module.consumes],
      produces: [...module.produces],
      sourceFiles: [...module.sourceFiles],
    })),
    externalInputs: [...external].sort(),
    edges,
    topologicalOrder,
    valid: errors.length === 0,
    errors,
  };
}

export function validateResearchOutputRegistration<T>(
  output: ResearchOutput<T>,
  registry: InaModuleRegistry,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!registry.valid) errors.push("INA module registry is invalid");
  const module = registry.modules.find(item => item.moduleId === output.moduleId);
  if (!module) {
    errors.push("unregistered module: " + output.moduleId);
  } else {
    if (module.engineId !== output.engineId) errors.push("output engineId does not match registered module");
    if (module.engineVersion !== output.engineVersion) errors.push("output engineVersion does not match registered module");
    if (!module.produces.includes(output.outputKey)) errors.push("module does not declare output key: " + output.outputKey);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Initial registry describes the target shared dataflow.
 * A "partial" module has code but has not yet been migrated to consume INA's context.
 */
export const INA_MODULE_DEFINITIONS: InaModuleDefinition[] = [
  {
    moduleId: "source-integrity",
    title: "Captura y validación del histórico",
    engineId: "tris-csv-ingestion",
    engineVersion: "1.0.0",
    consumes: ["source.raw-csv"],
    produces: ["dataset.snapshot", "dataset.validated-draws"],
    status: "partial",
    sourceFiles: ["src/research/data-adapter.ts", "src/research/tris-csv-sync.ts", ".github/workflows/tris-live-prospective.yml"],
  },
  {
    moduleId: "ina-core",
    title: "INA Core — conocimiento histórico descriptivo",
    engineId: "ina-core-position-profile",
    engineVersion: "1.0.0",
    consumes: ["dataset.snapshot", "dataset.validated-draws"],
    produces: ["ina.history", "ina.position-profile"],
    status: "implemented",
    sourceFiles: ["src/research/ina-contracts.ts", "src/research/ina-core.ts"],
  },
  {
    moduleId: "position-overview",
    title: "Desplazamiento de frecuencias por posición",
    engineId: "dashboard-overview",
    engineVersion: "1.0.0",
    consumes: ["ina.history"],
    produces: ["research.position-overview"],
    status: "implemented",
    sourceFiles: ["src/research/dashboard-overview.ts", "src/ResearchSignalOverview.tsx"],
  },
  {
    moduleId: "pool-research",
    title: "Pools, cobertura y evaluación walk-forward",
    engineId: "pool-research-family",
    engineVersion: "1.0.0",
    consumes: ["ina.history", "ina.position-profile"],
    produces: ["research.pool-evaluation"],
    status: "partial",
    sourceFiles: ["src/research/pool-analysis.ts", "src/research/candidate-portfolio-walk-forward.ts"],
  },
  {
    moduleId: "positional-transitions",
    title: "Transiciones y dependencia posicional",
    engineId: "positional-transition-family",
    engineVersion: "1.0.0",
    consumes: ["ina.history", "ina.position-profile"],
    produces: ["research.positional-transitions"],
    status: "partial",
    sourceFiles: ["src/research/positional-transition-persistence.ts", "src/research/joint-positional-interactions.ts"],
  },
  {
    moduleId: "memory-research",
    title: "Memoria temporal, contextual y de hipótesis",
    engineId: "research-memory-family",
    engineVersion: "1.0.0",
    consumes: ["ina.history"],
    produces: ["research.memory-state"],
    status: "partial",
    sourceFiles: ["src/research/temporal-memory.ts", "src/research/contextual-memory.ts", "src/research/intuition-ledger.ts"],
  },
  {
    moduleId: "prospective-evaluator",
    title: "Evaluador prospectivo y ledger congelado",
    engineId: "prospective-evaluation-family",
    engineVersion: "1.0.0",
    consumes: ["ina.history", "forecast.frozen-ledger"],
    produces: ["research.prospective-evaluation"],
    status: "partial",
    sourceFiles: ["src/research/intuition-prospective.ts", "src/research/frozen-forecast-union-evaluator.ts"],
  },
  {
    moduleId: "operational-dashboard",
    title: "Dashboard operativo",
    engineId: "tris-ops-dashboard",
    engineVersion: "1.0.0",
    consumes: [
      "ina.position-profile",
      "research.position-overview",
      "research.pool-evaluation",
      "research.positional-transitions",
      "research.memory-state",
      "research.prospective-evaluation",
    ],
    produces: ["ui.operational-dashboard"],
    status: "partial",
    sourceFiles: ["src/TrisOpsDashboard.tsx", "src/IntuitionDashboard.tsx", "src/ResearchDashboard.tsx"],
  },
];

export const INA_EXTERNAL_INPUTS = ["source.raw-csv", "forecast.frozen-ledger"];

export function createDefaultInaModuleRegistry(): InaModuleRegistry {
  return createInaModuleRegistry(INA_MODULE_DEFINITIONS, INA_EXTERNAL_INPUTS);
}
