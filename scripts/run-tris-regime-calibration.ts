#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {calibratePastOnlyRegimeClassifier} from "../src/research/past-only-regime-calibration";
const report=calibratePastOnlyRegimeClassifier({
 replications:Number(process.env.TRIS_REGIME_CALIBRATION_REPS??500),
 targetsPerReplication:Number(process.env.TRIS_REGIME_CALIBRATION_TARGETS??25),
 seed:Number(process.env.TRIS_REGIME_CALIBRATION_SEED??20261127)
});
const dir=resolve("reports/regime-calibration");await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(x:number)=>((x*100).toFixed(2)+"%");
const md=["# Calibración sintética del clasificador de regímenes past-only","","- Fecha: "+stamp,"- Semilla: "+report.seed,"- Réplicas por escenario: "+report.replications,"- Objetivos por réplica: "+report.targetsPerReplication,"- Ventana histórica: "+report.window+" concursos","","| Escenario | Observaciones | Alertas | Tasa | Wilson 95% descriptivo |","|---|---:|---:|---:|---:|",...report.scenarios.map(s=>"| "+s.name+" | "+s.observations+" | "+s.alertCount+" | "+pct(s.rate)+" | "+s.wilson95.map(pct).join(" – ")+" |"),"", "## Definición de escenarios",...report.scenarios.map(s=>"- **"+s.name+"**: "+s.description),"","## Limitaciones",...report.limitations.map(x=>"- "+x),"","No se usan resultados reales ni se ajustan umbrales. No hay APIs ni descargas."].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");
console.log(md);
