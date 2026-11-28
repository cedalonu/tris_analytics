#!/usr/bin/env tsx
/**
 * Static mount audit for catalogued research visual components.
 * Import + JSX references are evidence of a potential mount, not proof of
 * runtime visibility or numerical parity.
 */
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { PHASES } from "../src/ResearchPhaseCatalog";
import { findComponentReferences } from "../src/research/mount-audit";

const manifestPath=resolve(process.argv[2]??"data/canonical/source-manifest.json");
const reportDir=resolve(process.argv[3]??"reports/research-mount-audit");
const manifest=JSON.parse(await readFile(manifestPath,"utf8")) as {snapshot:string;sha256:string;rowCount:number;latestDrawId:number;fetchedAt:string};
const dashboardFiles=["src/main.tsx","src/ResearchDashboard.tsx","src/TrisOpsDashboard.tsx","src/InaCommandCenter.tsx","src/App.tsx"];
const dashboardContents=await Promise.all(dashboardFiles.map(async path=>({path,content:await readFile(resolve(path),"utf8")})));
async function fileExists(path:string){try{return(await stat(resolve(path))).isFile();}catch{return false;}}
function componentName(path:string){const basename=path.split("/").at(-1)!.replace(/\.(tsx|jsx)$/,"");return basename;}
const results=await Promise.all(PHASES.map(async phase=>{
 if(!phase.visual)return {phaseId:phase.id,title:phase.title,visualPath:null,component:null,componentState:"not_catalogued",mountState:"not_applicable",mountEvidence:[]};
 const name=componentName(phase.visual),exists=await fileExists(phase.visual);
 const evidence=findComponentReferences(name,dashboardContents);
 const mountState=!exists?"blocked":evidence.length?"reference_located":"not_located";
 return {phaseId:phase.id,title:phase.title,visualPath:phase.visual,component:name,componentState:exists?"located":"missing",mountState,mountEvidence:evidence};
}));
const counts={catalogTotal:results.length,visualCatalogued:results.filter(x=>x.visualPath).length,visualFilesLocated:results.filter(x=>x.componentState==="located").length,mountReferenceLocated:results.filter(x=>x.mountState==="reference_located").length,mountNotLocated:results.filter(x=>x.mountState==="not_located").length,mountBlocked:results.filter(x=>x.mountState==="blocked").length,visualNotCatalogued:results.filter(x=>x.mountState==="not_applicable").length};
const report={schemaVersion:1,auditType:"research-dashboard-static-mount-audit",generatedAt:new Date().toISOString(),canonical:{snapshot:manifest.snapshot,sha256:manifest.sha256,cutoff:manifest.latestDrawId,sampleSize:manifest.rowCount,fetchedAt:manifest.fetchedAt},dashboardFiles,counts,phases:results,limitations:["Static scan only: import/JSX references do not prove that a component is visible at runtime or receives current canonical data.","Does not verify engine-output numerical parity, UI interactions, or browser rendering.","A component can be conditionally mounted; this audit reports only source-level references."]};
await mkdir(reportDir,{recursive:true});
await writeFile(resolve(reportDir,"latest.json"),JSON.stringify(report,null,2)+"\n");
const md=["# Static research visual mount audit","",`- Snapshot: ${manifest.snapshot}`, `- Cutoff: ${manifest.latestDrawId}`, `- SHA-256: ${manifest.sha256}`,"","## Totals",...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),"","## Component references",...results.map(p=>`- ${p.phaseId} — ${p.title}: ${p.mountState} (${p.visualPath??"no visual catalogued"})`),"","## Limitations",...report.limitations.map(x=>"- "+x),""] .join("\n");
await writeFile(resolve(reportDir,"latest.md"),md);
console.log(md);
