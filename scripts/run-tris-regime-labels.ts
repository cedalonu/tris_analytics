#!/usr/bin/env tsx
/** Creates past-only regime labels from a manually supplied local CSV. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import type {ProspectiveRegimeLabel} from "../src/research/prospective-regime-persistence";
import {classifyPastOnlyRegimes} from "../src/research/past-only-regime-classifier";
const input=process.argv[2],ledger=resolve(process.argv[3]??"data/prospective-portfolio");
if(!input){console.error("Usage: npm run research:regime-labels -- <local-Tris.csv> [ledger-directory]");process.exit(2);}
const csv=await readFile(resolve(input),"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
if(imported.validation.warnings.some(x=>x.startsWith("draw gap "))){console.error("CSV contains contest gaps; regime labeling blocked.");process.exit(1);}
const manifest=JSON.parse(await readFile(resolve(ledger,"portfolio-manifest.json"),"utf8")) as ProspectivePortfolioManifest;
const latest=JSON.parse(await readFile(resolve(ledger,"latest-summary.json"),"utf8")) as {manifest:{portfolioId:string};summary:{lastObservedDrawId:number}};
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("Latest summary does not match portfolio manifest.");process.exit(1);}
const report=classifyPastOnlyRegimes(imported.validation.valid,manifest.firstTargetDrawId,latest.summary.lastObservedDrawId);
if(report.skippedDrawIds.length){console.error("Insufficient pre-target history for contests: "+report.skippedDrawIds.join(", "));process.exit(1);}
const out=resolve(ledger,"regime-labels.jsonl");await mkdir(ledger,{recursive:true});
await writeFile(out,report.labels.map(x=>JSON.stringify(x)).join("\n")+"\n","utf8");
const diag=resolve(ledger,"regime-labels-diagnostics.json");
const sha=createHash("sha256").update(csv,"utf8").digest("hex");
await writeFile(diag,JSON.stringify({source:basename(resolve(input)),sourceSha256:sha,method:report.method,warmupDraws:report.warmupDraws,labels:report.labels.length,regimeCounts:report.labels.reduce((a,x)=>({...a,[x.regimeId]:(a[x.regimeId]??0)+1}),{} as Record<string,number>),diagnostics:report.diagnostics,limitations:report.limitations},null,2)+"\n","utf8");
console.log("Past-only regime labels written: "+out);
console.log("Diagnostics: "+diag);
