#!/usr/bin/env tsx
/** Offline regime-shift screening for a manually supplied local TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeRegimeChanges} from "../src/research/regime-change";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:regime -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),outDir=resolve(process.argv[3]??"reports/regime");
const csv=await readFile(source,"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=imported.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Analysis blocked: historical contest gaps detected.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeRegimeChanges(imported.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(outDir,{recursive:true});
const json=resolve(outDir,"regime-change.json"),md=resolve(outDir,"regime-change.md");
await writeFile(json,JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n","utf8");
const lines=["# TRIS regime-change screening","", "- Source: "+basename(source),"- Source SHA-256: "+sha,"- Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")","","## Comparisons","",
"| Reference | Recent | ID ranges (reference → recent) | Status | Watch features |","|---:|---:|---|---|---|",
...report.comparisons.map(c=>"| "+c.referenceDraws+" | "+c.recentDraws+" | "+c.referenceStartId+"–"+c.referenceEndId+" → "+c.recentStartId+"–"+c.recentEndId+" | "+c.status+" | "+(c.watchFeatures.join(", ")||"—")+" |"),
"",...report.comparisons.map(c=>"### "+c.referenceDraws+" vs "+c.recentDraws+" draws\n\n| Feature | TV | JS (bits) | Status |\n|---|---:|---:|---|\n"+c.metrics.map(m=>"| "+m.feature+" | "+m.totalVariation.toFixed(3)+" | "+m.jensenShannonBits.toFixed(3)+" | "+m.status+" |").join("\n")),
"","## Safeguards",...report.warnings.map(w=>"- "+w),"","Descriptive screening only; no predictive edge or confirmed regime is claimed."].join("\n")+"\n";
await writeFile(md,lines,"utf8");
console.log("Regime screening complete. Comparisons: "+report.comparisons.length);
console.log("Markdown: "+md);console.log("JSON: "+json);
