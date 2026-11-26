#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {calibratePositionalPoolTemporalStability} from "../src/research/positional-pool-temporal-stability-calibration";
const report=calibratePositionalPoolTemporalStability({
 replications:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_REPS??500),
 blocksPerReplication:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_BLOCKS??30),
 windowBlocks:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_WINDOW??5),
 stepBlocks:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_STEP??1),
 minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_MIN_PAIRS??3),
 seed:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_SEED??20261130),
 consistencyThreshold:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_CONSISTENCY??.7),
 nearZeroThreshold:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_NEAR_ZERO??.1)
});
const dir=resolve("reports/positional-pool-temporal-stability-calibration");await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(x:number)=>((x*100).toFixed(2)+"%");
const md=["# Calibración sintética — estabilidad temporal de concordancia posicional-pool","","- Fecha: "+stamp,"- Semilla: "+report.seed,"- Réplicas por escenario: "+report.replications,"- Bloques por réplica: "+report.blocksPerReplication,"- Ventana/paso: "+report.windowBlocks+"/"+report.stepBlocks,"- Mínimo de pares: "+report.minimumPairs,"- Consistencia de signo: "+pct(report.consistencyThreshold),"- Umbral cercano a cero: "+report.nearZeroThreshold,"","| Escenario | Alertas falsas estables | Tasa falsa (IC Wilson) | Detección positiva | Detección negativa | Inestable/insuficiente | Correlaciones válidas medias/replica |","|---|---:|---:|---:|---:|---:|---:|",...report.scenarios.map(s=>"| "+s.scenario+" | "+s.falseStableAlerts+" | "+pct(s.falseStableAlertRate)+" ("+s.falseStableAlertWilson95.map(pct).join("–")+") | "+pct(s.positiveDetectionRate)+" | "+pct(s.negativeDetectionRate)+" | "+s.unstableOrInsufficient+" | "+s.meanValidWindowCorrelations.toFixed(1)+" |"),"","## Escenarios",...report.scenarios.map(s=>"- **"+s.scenario+"**: "+s.description),"","## Limitaciones",...report.limitations.map(x=>"- "+x),"","Simulación local sintética; no se utiliza el CSV real, APIs, polling ni descargas."].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
