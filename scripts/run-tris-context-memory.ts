#!/usr/bin/env tsx
/** Offline context-conditioned memory report from a local TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeContextualMemory} from "../src/research/contextual-memory";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:context-memory -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/context-memory");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Missing contest IDs; analysis stopped.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeContextualMemory(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"context-memory.json"),JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n");
const lines=["# TRIS context-conditioned temporal memory","",
 "Source: "+basename(source),"SHA-256: "+sha,"Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")","",
 ...report.scopes.flatMap(s=>{
  const ranked=[...s.comparisons].sort((a,b)=>b.contextMutualInformationBits-a.contextMutualInformationBits);
  return ["## "+s.scope+" ("+s.draws+" contests)","",
   "| Context | Lag | Source → target | N | Context MI (bits) | Eligible buckets |",
   "|---|---:|---|---:|---:|---:|",
   ...ranked.slice(0,30).map(x=>"| "+x.context+" | -"+x.lag+" | R"+(x.sourcePosition+1)+" → R"+(x.targetPosition+1)+" | "+x.observations+" | "+x.contextMutualInformationBits.toFixed(4)+" | "+x.eligibleBuckets+" |"),
   "","### Strongest bucket details","",
   ...ranked.slice(0,10).map(x=>{
    const b=[...x.buckets].sort((a,c)=>c.totalVariationVsMarginal-a.totalVariationVsMarginal)[0];
    return b?"- "+x.context+", lag -"+x.lag+", R"+(x.sourcePosition+1)+"→R"+(x.targetPosition+1)+", context "+b.contextValue+": n="+b.observations+", TV="+b.totalVariationVsMarginal.toFixed(3)+", strongest target="+(b.strongestTargetDigits[0]?.digit??"none"):"";
   }),""];
 }),
 "## Safeguards",...report.warnings.map(w=>"- "+w),
 "","Descriptive only. No predictive advantage is claimed."
 ].join("\n")+"\n";
await writeFile(resolve(out,"context-memory.md"),lines);
console.log("Context memory analysis complete: "+report.drawCount+" contests.");
console.log("SHA-256: "+sha);
console.log("Output: "+out);
