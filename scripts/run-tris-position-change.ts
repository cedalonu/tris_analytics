#!/usr/bin/env tsx
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {detectPositionBehaviorChanges} from "../src/research/position-change-detector";
import type {ResolvedCycleSignal} from "../src/research/cycle-learning";
const dir=resolve(process.argv[2]??"data/cycles");
const raw=await readFile(resolve(dir,"outcomes.jsonl"),"utf8");
const rows=raw.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as ResolvedCycleSignal);
const report=detectPositionBehaviorChanges(rows),stamp=new Date().toISOString();
await writeFile(resolve(dir,"position-change.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(n:number|null)=>n===null?"—":(100*n).toFixed(1)+"%";
const lines=["# TRIS — detector de cambios por posición","", "- Generado: "+stamp,"- Outcomes: "+report.sourceOutcomes,"- Series: "+report.seriesCount,"",
"| Posición | Familia | Configuración | Pool | Duplicados | Concursos | Bloques | Referencia | Último | Cambio | Desv. entre concursos | Error estándar | IC aprox. 95% | Estado |",
"|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",
...report.series.map(s=>"| R"+(s.position+1)+" | "+s.family+" | "+s.configuration+" | "+s.poolRegime+" | "+s.duplicateRegime+" | "+s.totalDraws+" | "+s.blocks.length+" | "+pct(s.referenceAdvantage)+" | "+pct(s.latestAdvantage)+" | "+pct(s.change)+" | "+pct(s.blocks.at(-1)?.drawAdvantageStdDev??null)+" | "+pct(s.latestStandardError)+" | "+(s.latestInterval95?s.latestInterval95.map(pct).join(" to "):"—")+" | "+s.state+" |"),
"","## Interpretación",...report.series.map(s=>"- R"+(s.position+1)+" / "+s.family+" / "+s.state+": "+s.interpretation),"","## Advertencias",...report.warnings.map(x=>"- "+x),"","Fuente: outcomes.jsonl local; sin APIs ni descargas."].join("\n")+"\n";
await writeFile(resolve(dir,"position-change.md"),lines,"utf8");
console.log("Detector posicional actualizado: "+report.seriesCount+" series.");
