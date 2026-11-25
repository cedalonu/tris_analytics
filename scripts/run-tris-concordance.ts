#!/usr/bin/env tsx
/** Offline cross-family concordance report from a supplied TRIS CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeCrossSignalConcordance} from "../src/research/cross-signal-concordance";
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:concordance -- <local-path-to-Tris.csv> [output-directory]");process.exit(2);}
const source=resolve(input),out=resolve(process.argv[3]??"reports/concordance");
const csv=await readFile(source,"utf8"),data=importTrisCsv(csv);
if(data.validation.errors.length){console.error(data.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=data.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Missing contest IDs; analysis stopped.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const report=analyzeCrossSignalConcordance(data.validation.valid),sha=createHash("sha256").update(csv,"utf8").digest("hex");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"concordance.json"),JSON.stringify({source:basename(source),sourceSha256:sha,report},null,2)+"\n");
const lines=[
 "# TRIS cross-family concordance","",
 "Source: "+basename(source),"SHA-256: "+sha,
 "Contests: "+report.drawCount+" ("+report.firstDrawId+"–"+report.lastDrawId+")",
 "Discovery / validation / holdout: "+report.discoveryValidationHoldout.discovery+" / "+report.discoveryValidationHoldout.validation+" / "+report.discoveryValidationHoldout.holdout,
 "Targets with at least one marker: "+report.screenedRecords+" / 50","",
 "| Pos. | Digit | Families | Classification | Adaptive state | Absence |",
 "|---:|---:|---:|---|---|---:|",
 ...report.records.filter(r=>r.familyCount>0).map(r=>"| R"+(r.position+1)+" | "+r.digit+" | "+r.familyCount+" | "+r.concordance+" | "+(r.adaptiveStatus??"—")+" | "+r.currentAbsence+" |"),
 "","## Family marker counts",
 ...Object.entries(report.familyCounts).map(([k,v])=>"- "+k+": "+v),
 "","## Details","",
 ...report.records.filter(r=>r.familyCount>0).map(r=>"### R"+(r.position+1)+" digit "+r.digit+" — "+r.concordance+"\n"+r.interpretation+"\n"+r.families.map(f=>"- "+f.family+": "+f.detail+" (support "+f.support+")").join("\n")+(r.conflictNotes.length?"\nConflicts:\n"+r.conflictNotes.map(x=>"- "+x).join("\n"):"")),
 "","## Safeguards",...report.warnings.map(w=>"- "+w),
 "","This is a descriptive research index, not a prediction."
].join("\n")+"\n";
await writeFile(resolve(out,"concordance.md"),lines);
console.log("Cross-family concordance complete: "+report.drawCount+" contests.");
console.log("SHA-256: "+sha);
console.log("Output: "+out);
