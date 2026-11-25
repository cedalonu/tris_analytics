#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {simulatePositionChangeNull} from "../src/research/position-change-null-simulation";
const replications=Number(process.env.TRIS_NULL_REPS??500),seriesPerReplication=Number(process.env.TRIS_NULL_SERIES??25),blocks=Number(process.env.TRIS_NULL_BLOCKS??6),seed=Number(process.env.TRIS_NULL_SEED??20261125);
const hitRates=(process.env.TRIS_NULL_HIT_RATES??"0.1,0.2,0.5").split(",").map(Number);
const scenarios=hitRates.map((hitRate,index)=>simulatePositionChangeNull({replications,seriesPerReplication,blocks,hitRate,seed:seed+index}));
const dir=resolve("reports/position-null");await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString();await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:stamp,scenarios},null,2)+"\n","utf8");
const pct=(n:number)=>((100*n).toFixed(2)+"%");
const md=["# TRIS — simulación nula de falsas alertas","", "- Fecha: "+stamp,"- Réplicas por escenario: "+replications,"- Series por réplica: "+seriesPerReplication,"- Total series simuladas: "+(replications*seriesPerReplication*scenarios.length).toLocaleString("es-MX"),"- Bloques: "+blocks+" × 25 concursos","- Semilla base: "+seed,"","| Tasa marginal idéntica candidato/baseline | Falsas alertas/serie | Persistentes/serie | Réplicas con ≥1 alerta | IC Wilson 95% por serie |","|---:|---:|---:|---:|---:|",...scenarios.map(r=>"| "+r.hitRate+" | "+pct(r.falseAlertRate)+" | "+pct(r.persistentFalseAlertRate)+" | "+pct(r.familyWiseFalseAlertRate)+" | "+r.wilson95.map(pct).join(" – ")+" |"),"","## Interpretación por escenario",...scenarios.map(r=>"- **p="+r.hitRate+"**: "+r.interpretation),"","## Advertencia","Simulación sintética sin ventaja sistemática. La independencia entre candidato y baseline es un supuesto; no representa necesariamente su dependencia real ni modela autocorrelación. No es análisis de resultados reales ni tasa real de falsas alertas."].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
