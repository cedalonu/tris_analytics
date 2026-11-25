#!/usr/bin/env tsx
/** Offline temporal-memory report from a manually supplied local TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeTemporalMemory} from "../src/research/temporal-memory";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:memory -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/temporal-memory");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error("CSV validation errors:\n"+data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Analysis blocked: missing contest IDs.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeTemporalMemory(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
const json=resolve(out,"temporal-memory.json"),md=resolve(out,"temporal-memory.md");
await writeFile(json,JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n","utf8");
const lines=[
 "# TRIS temporal-memory analysis","",
 "- Source: "+basename(source),"- Source SHA-256: "+sha,
 "- Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId),
 "",
 "## Scope overview","",
 "| Scope | Draws | Contest range | Position-pair / lag comparisons |",
 "|---|---:|---|---:|",
 ...report.scopes.map(s=>"| "+s.scope+" | "+s.draws+" | "+s.firstDrawId+"–"+s.lastDrawId+" | "+s.comparisons.length+" |"),
 "",
 "## Strongest dependencies by scope","",
 ...report.scopes.flatMap(s=>{
  const ranked=[...s.comparisons].sort((a,b)=>b.mutualInformationBits-a.mutualInformationBits);
  return ["### "+s.scope,
   "| Lag | Source → target | N | Mutual information (bits) | Same-digit rate | Strongest supported move |",
   "|---:|---|---:|---:|---:|---|",
   ...ranked.slice(0,15).map(x=>{
    const top=x.strongestTransitions[0];
    return "| -"+x.lag+" | R"+(x.sourcePosition+1)+" → R"+(x.targetPosition+1)+" | "+x.observations+" | "+x.mutualInformationBits.toFixed(4)+" | "+(x.sourcePosition===x.targetPosition?(x.sameDigitRate*100).toFixed(2)+"%":"—")+" | "+(top?"("+top.from+"→"+top.to+") n="+top.count+", rate="+(top.conditionalRate*100).toFixed(1)+"%, lift="+top.liftVsTargetMarginal.toFixed(2):"none with support ≥ 5")+" |";
   }),""
  ];
 }),
 "## Safeguards",...report.warnings.map(w=>"- "+w),
 "","Descriptive historical analysis only; no predictive edge is claimed."
].join("\n")+"\n";
await writeFile(md,lines,"utf8");
console.log("Temporal-memory analysis complete.");
console.log("Contests: "+report.drawCount);
console.log("Source SHA-256: "+sha);
console.log("Markdown: "+md);
console.log("JSON: "+json);
