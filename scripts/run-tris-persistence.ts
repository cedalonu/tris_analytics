#!/usr/bin/env tsx
/** Offline persistence/reversion screening from a manually supplied TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzePersistence} from "../src/research/regime-persistence";
const input=process.argv[2];if(!input){console.error("Usage: npm run research:persistence -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/persistence"),csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));if(gaps.length){console.error("Analysis blocked: historical contest gaps detected.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzePersistence(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");await mkdir(out,{recursive:true});
const json=resolve(out,"persistence.json"),md=resolve(out,"persistence.md");
await writeFile(json,JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n","utf8");
const lines=["# TRIS persistence and reversion screening","","- Source: "+basename(source),"- Source SHA-256: "+sha,"- Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")","- Reference: first "+report.referenceDraws+" contests; subsequent blocks: "+report.blockSize,"","## Feature patterns","","| Feature | Pattern | Watch blocks | Longest run | Return block (0-based) |","|---|---|---:|---:|---:|",
...report.features.map(f=>"| "+f.feature+" | "+f.pattern+" | "+f.blocks.filter(b=>b.watch).length+" | "+f.longestWatchRun+" | "+(f.returnBlock??"—")+" |"),
"","## Block detail","",...report.features.filter(f=>f.blocks.length).map(f=>"### "+f.feature+"\n\n"+f.blocks.map((b,i)=>"- Block "+i+" ("+b.startDrawId+"–"+b.endDrawId+"): TV "+b.totalVariation.toFixed(3)+", JS "+b.jensenShannonBits.toFixed(3)+", "+(b.watch?"watch":"stable")+", "+(b.nearBaseline?"near reference":"not near reference")).join("\n")),
"","## Safeguards",...report.warnings.map(w=>"- "+w),"","Descriptive retrospective screening only; no predictive edge is claimed."].join("\n")+"\n";
await writeFile(md,lines,"utf8");console.log("Persistence analysis complete. Features: "+report.features.length);console.log("Markdown: "+md);console.log("JSON: "+json);
