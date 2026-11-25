#!/usr/bin/env tsx
/** Offline adaptive signal-memory report from a local TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeAdaptiveSignalMemory} from "../src/research/adaptive-signal-memory";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:adaptive-memory -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/adaptive-memory");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Missing contest IDs; analysis stopped.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeAdaptiveSignalMemory(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"adaptive-memory.json"),JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n");
const fmt=(x:number|null)=>x===null?"—":(x*100).toFixed(2)+"%";
const lines=[
 "# TRIS adaptive signal memory","",
 "Source: "+basename(source),"SHA-256: "+sha,
 "Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")",
 "Discovery / validation / holdout: "+report.discoveryDraws+" / "+report.validationDraws+" / "+report.holdoutDraws,
 "Monitored rules: "+report.monitoredCandidates,"",
 "| Pos. | Digit | Signals | State | Positive / negative blocks | Latest Δ baseline | Interpretation |",
 "|---:|---:|---|---|---:|---:|---|",
 ...report.signals.map(s=>"| R"+(s.position+1)+" | "+s.digit+" | "+s.features.join(" + ")+" | "+s.status+" | "+s.positiveBlocks+" / "+s.negativeBlocks+" | "+fmt(s.latestDelta)+" | "+s.interpretation+" |"),
 "","## Block history","",
 ...report.signals.flatMap(s=>[
  "### R"+(s.position+1)+" digit "+s.digit+" — "+s.status,
  "| Phase | Draw IDs | Active / N | Hits | Rule rate | Baseline | Best component | State |",
  "|---|---:|---:|---:|---:|---:|---:|---|",
  ...s.blocks.map(b=>"| "+b.phase+" | "+b.startDrawId+"–"+b.endDrawId+" | "+b.active+" / "+b.observations+" | "+b.hits+" | "+fmt(b.rate)+" | "+fmt(b.baselineRate)+" | "+fmt(b.bestComponentRate)+" | "+b.signal+" |"),
  ""
 ]),
 "## Safeguards",...report.warnings.map(w=>"- "+w),
 "","Descriptive monitoring only; no predictive advantage is claimed."
].join("\n")+"\n";
await writeFile(resolve(out,"adaptive-memory.md"),lines);
console.log("Adaptive signal memory complete: "+report.drawCount+" contests.");
console.log("SHA-256: "+sha);
console.log("Output: "+out);
