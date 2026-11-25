#!/usr/bin/env tsx
import {writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {simulatePositionChangeNull} from "../src/research/position-change-null-simulation";
const report=simulatePositionChangeNull({replications:Number(process.env.TRIS_NULL_REPS??1000),seriesPerReplication:Number(process.env.TRIS_NULL_SERIES??1),blocks:Number(process.env.TRIS_NULL_BLOCKS??6),hitRate:Number(process.env.TRIS_NULL_HIT_RATE??.2),seed:Number(process.env.TRIS_NULL_SEED??20261125)});
const dir=resolve("reports/position-null");await import("node:fs/promises").then(fs=>fs.mkdir(dir,{recursive:true}));
const stamp=new Date().toISOString();await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(n:number)=>((100*n).toFixed(2)+"%");
const md=["# TRIS — simulación nula de falsas alertas","", "- Fecha: "+stamp,"- Réplicas: "+report.replications,"- Series por réplica: "+report.seriesPerReplication,"- Bloques: "+report.blocks+" × "+report.drawsPerBlock+" concursos","- Probabilidad marginal idéntica: "+report.hitRate,"- Semilla: "+report.seed,"","| Métrica | Resultado |","|---|---:|","| Falsas alertas por serie | "+pct(report.falseAlertRate)+" |","| Alertas persistentes por serie | "+pct(report.persistentFalseAlertRate)+" |","| Réplicas con ≥1 alerta | "+pct(report.familyWiseFalseAlertRate)+" |","| IC Wilson 95% (por serie) | "+report.wilson95.map(pct).join(" – ")+" |","","## Estados",...Object.entries(report.stateCounts).map(([k,v])=>"- "+k+": "+v),"","## Interpretación",report.interpretation,"","No es análisis de resultados reales ni estimación de la tasa real de falsas alertas."].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
