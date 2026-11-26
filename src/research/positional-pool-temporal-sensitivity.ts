import {calibratePositionalPoolTemporalStability, type PositionalPoolCalibrationScenarioResult} from "./positional-pool-temporal-stability-calibration";

export interface PositionalPoolSensitivityOptions {
  replications?: number;
  blocksPerReplication?: number;
  windowBlocks?: number[];
  stepModes?: Array<"one"|"half"|"non-overlap">;
  consistencyThresholds?: number[];
  minimumPairs?: number;
  seed?: number;
}
export interface PositionalPoolSensitivityRow {
  windowBlocks:number;
  stepBlocks:number;
  consistencyThreshold:number;
  nullFalseStableRate:number;
  alternatingFalseStableRate:number;
  positiveDetectionRate:number;
  negativeDetectionRate:number;
  weakPositiveStableRate:number;
}
export interface PositionalPoolSensitivityReport {
  method:string;
  replications:number;
  blocksPerReplication:number;
  minimumPairs:number;
  rows:PositionalPoolSensitivityRow[];
  scenarioDefinitions:PositionalPoolCalibrationScenarioResult[];
  limitations:string[];
}
export function analyzePositionalPoolSensitivity(options:PositionalPoolSensitivityOptions={}):PositionalPoolSensitivityReport {
  const reps=options.replications??250, blocks=options.blocksPerReplication??30;
  const windows=options.windowBlocks??[5,8,10], modes=options.stepModes??["one","half","non-overlap"];
  const thresholds=options.consistencyThresholds??[.7,.8], minimumPairs=options.minimumPairs??3, seed=options.seed??20261201;
  if(!Number.isInteger(reps)||reps<1||!Number.isInteger(blocks)||blocks<3||!Number.isInteger(minimumPairs)||minimumPairs<3||!Number.isInteger(seed)) throw new Error("invalid positional pool sensitivity options");
  if(!windows.length||windows.some(w=>!Number.isInteger(w)||w<3||w>blocks)||!modes.length||!thresholds.length||thresholds.some(t=>t<=.5||t>1)) throw new Error("invalid positional pool sensitivity grid");
  const rows:PositionalPoolSensitivityRow[]=[];
  let index=0;
  for(const windowBlocks of windows) for(const mode of modes) for(const consistencyThreshold of thresholds) {
    const stepBlocks=mode==="one"?1:mode==="half"?Math.max(1,Math.floor(windowBlocks/2)):windowBlocks;
    const report=calibratePositionalPoolTemporalStability({replications:reps,blocksPerReplication:blocks,windowBlocks,stepBlocks,minimumPairs,seed:seed+index*104729,consistencyThreshold});
    const get=(name:string)=>report.scenarios.find(s=>s.scenario===name)!;
    rows.push({windowBlocks,stepBlocks,consistencyThreshold,
      nullFalseStableRate:get("null-independent").falseStableAlertRate,
      alternatingFalseStableRate:get("alternating-sign").falseStableAlertRate,
      positiveDetectionRate:get("persistent-positive").positiveDetectionRate,
      negativeDetectionRate:get("persistent-negative").negativeDetectionRate,
      weakPositiveStableRate:(get("weak-positive").detectedPositive+get("weak-positive").detectedNegative)/reps});
    index++;
  }
  return {method:"positional-pool-temporal-stability-sensitivity-grid-v1",replications:reps,blocksPerReplication:blocks,minimumPairs,rows,
    scenarioDefinitions:[{scenario:"null-independent",replications:reps,falseStableAlerts:0,detectedPositive:0,detectedNegative:0,unstableOrInsufficient:0,falseStableAlertRate:0,falseStableAlertWilson95:[0,1],positiveDetectionRate:0,positiveDetectionWilson95:[0,1],negativeDetectionRate:0,negativeDetectionWilson95:[0,1],meanValidWindowCorrelations:0,description:"Escenario nulo independiente."}],
    limitations:[
      "La cuadrícula compara sensibilidad a ventana, solapamiento y umbral; no selecciona automáticamente una configuración óptima.",
      "Las tasas proceden de escenarios sintéticos diseñados y no estiman tasas reales de falsos positivos en TRIS.",
      "Ventanas solapadas y correlaciones relacionadas no son observaciones independientes.",
      "Los resultados dependen de la semilla, del generador sintético y de los tamaños de efecto predefinidos.",
      "No se utilizan datos reales, APIs, polling ni descargas; no se modifican pronósticos, candidatos, pesos, portafolios o ledger."
    ]};
}
