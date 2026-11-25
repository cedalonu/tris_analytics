#!/usr/bin/env tsx
/** Offline collective TRIS analysis for a manually supplied local CSV. */
import { readFile,writeFile,mkdir } from "node:fs/promises";
import { resolve,basename } from "node:path";
import { createHash } from "node:crypto";
import { importTrisCsv } from "../src/research/data-adapter";
import { analyzeCollectiveBehavior } from "../src/research/collective-behavior";

const input=process.argv[2];
if(!input){console.error("Usage: npm run research:collective -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),outDir=resolve(process.argv[3]??"reports/collective");
const csv=await readFile(source,"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=imported.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Analysis blocked: historical contest gaps detected.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const draws=imported.validation.valid;
const report=analyzeCollectiveBehavior(draws);
const sourceSha256=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(outDir,{recursive:true});
const jsonPath=resolve(outDir,"collective-behavior.json");
const mdPath=resolve(outDir,"collective-behavior.md");
await writeFile(jsonPath,JSON.stringify({source:basename(source),sourceSha256,report},null,2)+"\n","utf8");
const lines=[
 "# TRIS collective digit behavior",
 "",
 "- Source file: "+basename(source),
 "- Source SHA-256: "+sourceSha256,
 "- Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")",
 "",
 "## Trailing-window overview",
 "",
 "| Window | Draws | Unique ordered outcomes | Unique unordered pools | Mean distinct digits | Duplicate-pair rate |",
 "|---:|---:|---:|---:|---:|---:|",
 ...report.windows.map(w=>"| "+w.window+" | "+w.draws+" | "+w.uniqueOrderedOutcomes+" | "+w.uniqueUnorderedPools+" | "+w.meanDistinctDigits.toFixed(3)+" | "+(w.duplicatePairRate*100).toFixed(2)+"% |"),
 "",
 "## Positional entropy (bits)",
 "",
 ...report.windows.map(w=>"- Last "+w.window+": "+w.positionalEntropyBits.map((x,i)=>"P"+(i+1)+" "+x.toFixed(3)).join(" · ")),
 "",
 "## Strongest positional pair associations",
 "",
 ...report.windows.map(w=>"### Last "+w.window+" draws\n"+(w.pairAssociations.length?w.pairAssociations.slice(0,5).map(a=>"- P"+(a.positions[0]+1)+"/P"+(a.positions[1]+1)+" digits "+a.digits.join("/")+": observed "+a.observed+", expected "+a.expected.toFixed(2)+", lift "+a.lift.toFixed(2)).join("\n"):"- No pair met the minimum support threshold.")),
 "",
 "## Cross-position migration",
 "",
 ...report.migrations.map(m=>"- Lag -"+m.lag+": "+m.observations+" position-pair observations; same digit "+(m.sameDigitRate*100).toFixed(2)+"%; mean circular distance "+m.meanCircularDistance.toFixed(3)+"; top move "+(m.topMoves[0]?m.topMoves[0].from+"→"+m.topMoves[0].to+" ("+m.topMoves[0].count+")":"none")),
 "",
 "## Safeguards",
 ...report.warnings.map(w=>"- "+w),
 "",
 "This is descriptive analysis only. It does not establish a predictive edge."
].join("\n")+"\n";
await writeFile(mdPath,lines,"utf8");
console.log("Collective analysis complete.");
console.log("Contests: "+report.drawCount);
console.log("Source SHA-256: "+sourceSha256);
console.log("Markdown report: "+mdPath);
console.log("JSON report: "+jsonPath);
