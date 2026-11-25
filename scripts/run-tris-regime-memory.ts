#!/usr/bin/env tsx
/** Offline regime-conditioned TRIS signal-memory report from a local CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeRegimeConditionedMemory} from "../src/research/regime-conditioned-memory";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:regime-memory -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/regime-memory");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Missing contest IDs; analysis stopped.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeRegimeConditionedMemory(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"regime-memory.json"),JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n");
const fmt=(x:number|null)=>x===null?"—":(x*100).toFixed(2)+"%";
const lines=[
 "# TRIS regime-conditioned signal memory","",
 "Source: "+basename(source),"SHA-256: "+sha,
 "Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")",
 "Discovery / validation / holdout: "+report.discoveryDraws+" / "+report.validationDraws+" / "+report.holdoutDraws,
 "Rules monitored: "+report.monitoredCandidates,"",
 "| Pos. | Digit | Regime | Signals | Favorable episodes | Reappearances | Active | Rate | Baseline |",
 "|---:|---:|---|---|---:|---:|---:|---:|---:|",
 ...report.memories.map(m=>"| R"+(m.position+1)+" | "+m.digit+" | "+m.regime+" | "+m.features.join(" + ")+" | "+m.favorableEpisodes+" | "+m.reappearances+" | "+m.activeTotal+" | "+fmt(m.rate)+" | "+fmt(m.baselineRate)+" |"),
 "","## Episode detail","",
 ...report.memories.map(m=>"### R"+(m.position+1)+" digit "+m.digit+" — "+m.regime+"\n"+m.interpretation+"\n\n"+m.blocks.map(b=>"- "+b.phase+" "+b.startDrawId+"–"+b.endDrawId+": "+b.state+", active "+b.active+"/"+b.observations+", Δ "+fmt(b.delta)).join("\n")),
 "","## Safeguards",...report.warnings.map(w=>"- "+w),
 "","Descriptive memory only; no predictive advantage is claimed."
].join("\n")+"\n";
await writeFile(resolve(out,"regime-memory.md"),lines);
console.log("Regime-conditioned memory complete: "+report.drawCount+" contests.");
console.log("SHA-256: "+sha);
console.log("Output: "+out);
