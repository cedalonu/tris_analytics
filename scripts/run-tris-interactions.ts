#!/usr/bin/env tsx
/** Offline TRIS multi-signal interaction report from a local CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeSignalInteractions} from "../src/research/interaction-engine";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:interactions -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/interactions");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Missing contest IDs; analysis stopped.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeSignalInteractions(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"interactions.json"),JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n");
const fmt=(x:number)=>x.toFixed(4);
const lines=[
 "# TRIS multi-signal interaction screen","",
 "Source: "+basename(source),"SHA-256: "+sha,
 "Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")",
 "Rules screened: "+report.combinationsTested,"",
 "| Pos. | Digit | Signals | Discovery active / rate / Δ single | Validation active / rate / Δ single | Holdout active / rate / Δ single |",
 "|---:|---:|---|---:|---:|---:|",
 ...report.selected.map(x=>"| R"+(x.position+1)+" | "+x.digit+" | "+x.features.join(" + ")+" | "+x.discovery.active+" / "+fmt(x.discovery.rate)+" / "+fmt(x.discovery.incrementalVsBestSingle)+" | "+x.validation.active+" / "+fmt(x.validation.rate)+" / "+fmt(x.validation.incrementalVsBestSingle)+" | "+x.holdout.active+" / "+fmt(x.holdout.rate)+" / "+fmt(x.holdout.incrementalVsBestSingle)+" |"),
 "","## Safeguards",...report.warnings.map(x=>"- "+x),
 "","Descriptive screening only; no predictive advantage is claimed."
].join("\n")+"\n";
await writeFile(resolve(out,"interactions.md"),lines);
console.log("Interaction screen complete: "+report.drawCount+" contests.");
console.log("SHA-256: "+sha);
console.log("Output: "+out);
