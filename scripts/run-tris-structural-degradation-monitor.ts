#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {analyzeProspectiveDegradation, type ProspectiveSnapshot} from "../src/research/structural-motif-prospective-degradation";
const [input,minimumArg,thresholdArg]=process.argv.slice(2);
if(!input)throw Error("Usage: npm run research:structural-degradation-monitor -- <snapshots.jsonl> [minimumTargets=30] [changeThreshold=0.05]");
const snapshots=(await readFile(resolve(input),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as ProspectiveSnapshot);
const report=analyzeProspectiveDegradation(snapshots,{minimumTargets:minimumArg?Number(minimumArg):30,changeThreshold:thresholdArg?Number(thresholdArg):.05});
const out=resolve("reports/structural-prospective-degradation");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify(report,null,2)+"\n");
const lines=["# Fase 111 — Monitor de degradación y recuperación TRIS","","Capturas: "+report.context.snapshots,"Corte congelado: "+report.context.cutoffDrawId,"Umbral: "+report.settings.changeThreshold,"","| Familia | Posición | Capturas | N último | Δ último | Peor Δ | Estado |","|---|---:|---:|---:|---:|---:|---|",...report.rows.map(x=>"| "+x.family+" | "+(x.position+1)+" | "+x.observations+" | "+x.latestTargets+" | "+(x.latestDelta*100).toFixed(1)+" pp | "+(x.worstObservedDelta===null?"—":(x.worstObservedDelta*100).toFixed(1)+" pp")+" | "+x.state+" |"),"","## Eventos",...report.rows.flatMap(x=>["### "+x.family+" · posición "+(x.position+1),...x.events.map((e:any)=>"- "+e.capturedAt+": "+e.from+" → "+e.to+" (Δ "+(e.delta*100).toFixed(1)+" pp; N="+e.targets+")")]),"","## Limitaciones",...report.limitations.map(x=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");console.log("Monitor written to "+out);
