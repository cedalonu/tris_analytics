import type { DashboardOverview } from "./dashboard-overview";
import { buildDashboardOverview } from "./dashboard-overview";
import { createResearchOutput, type InaContext, type ResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

/** Build the dashboard's descriptive output from the shared INA context. */
export function buildInaDashboardOverview(
  context: InaContext,
  windowSize = 100,
): ResearchOutput<DashboardOverview> {
  if (!context.quality.valid) throw new Error("cannot build dashboard overview from an invalid INA context");
  const output = createResearchOutput(context, {
    outputId: "position-overview-" + (windowSize === 100 ? "default" : String(windowSize)),
    outputKey: "research.position-overview",
    moduleId: "position-overview",
    engineId: "dashboard-overview",
    engineVersion: "1.0.0",
    parameters: { windowSize },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: ["Recent window is compared with the full history in the same INA snapshot.", "Descriptive contrast only; not a forecast or significance test."],
    },
    result: buildDashboardOverview([...context.draws], windowSize),
    warnings: ["The full-history reference includes the recent window.", "Frequency displacement does not establish predictive advantage."],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("dashboard overview output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
