#!/usr/bin/env tsx
/** Read-only aggregator plus conservative evidence labels; does not rerun experiments. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {classifyEvidence,type EvidenceDecision} from "../src/research/evidence-classifier";
const reportRoot=resolve(process.argv[2]??"reports");
const names=["prospective-ledger-audit/latest.json","prospective-performance/latest.json","prospective-performance-stability/latest.json","prospective-performance-sensitivity/latest.json","prospective-coverage/latest.json"];
type Entry={name:string;status:"available"|"missing"|"invalid";summary:unknown;data?:any;path:string};
const entries:Entry[]=[];
for(const name of names){const path=resolve(reportRoot,name);try{const data=JSON.parse(await readFile(path,"utf8"));entries.push({name,status:"available",summary:data.summary??data.report?.summary??data,data,path});}catch(error){const code=(error as NodeJS.ErrnoException).code;entries.push({name,status:code==="ENOENT"?"missing":"invalid",summary:code==="ENOENT"?"Report not found; no result inferred.":String(error),path});}}
const find=(n:string)=>entries.find(e=>e.name===n);
const perf=find(names[1]),stab=find(names[2]),sens=find(names[3]),audit=find(names[0]),cov=find(names[4]);
const stabGroups=new Map<string,any>((stab?.data?.groups??[]).map((g:any)=>[g.key,g]));
const sensGroups=new Map<string,any>((sens?.data?.groups??[]).map((g:any)=>[g.key,g]));
const coverageRate=typeof cov?.data?.report?.summary?.coverageRate==="number"?cov.data.report.summary.coverageRate:typeof cov?.data?.summary?.coverageRate==="number"?cov.data.summary.coverageRate:null;
const integrity=audit?.data?.summary?.integrity??null;
const evidence:EvidenceDecision[]=(perf?.data?.groups??[]).map((g:any)=>{const s=stabGroups.get(g.key),p=sensGroups.get(g.key);return classifyEvidence({key:g.key,resolved:g.resolved,pairedDifference:g.pairedDifference,stabilityStatus:s?.status??null,sensitivityConclusion:p?.conclusion??null,integrity,coverageRate});});
const counts=Object.fromEntries(["insufficient","neutral","favorable-observed","unfavorable-observed","contradictory"].map(k=>[k,evidence.filter(e=>e.classification===k).length]));
const report={schema:"tris-research-report-pack-v2",createdAt:new Date().toISOString(),reportRoot,available:entries.filter(x=>x.status==="available").length,missing:entries.filter(x=>x.status==="missing").length,invalid:entries.filter(x=>x.status==="invalid").length,reports:entries.map(({data,...rest})=>rest),evidenceSummary:counts,evidence,interpretation:"Aggregation and conservative descriptive classification only. No prediction claim, experiment rerun, ledger backfill, or hypothesis promotion."};
const out=resolve(reportRoot,"research-report-pack");await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify(report,null,2)+"\n","utf8");
const md=["# TRIS research report pack","", "- Generated: "+report.createdAt,"- Reports available: "+report.available,"- Missing: "+report.missing,"- Invalid: "+report.invalid,"","## Descriptive evidence classification","", "| Configuration | Label | Resolved N | Reasons |","|---|---|---:|---|",...evidence.map(e=>"| "+e.key.replace(/\|/g," /")+" | "+e.classification+" | "+e.resolved+" | "+e.reasons.join("; ").replace(/\|/g," /")+" |"),"","## Report inventory","", "| Report | Status | Summary |","|---|---|---|",...entries.map(e=>"| "+e.name+" | "+e.status+" | "+JSON.stringify(e.summary).slice(0,300).replace(/\|/g," /")+" |"),"","## Interpretation","",report.interpretation,"","## Safeguards","- Missing reports are not approval and are not zero results.","- Holdout, historical and prospective evidence remain distinct.","- Directional labels require clean ledger integrity, minimum resolved sample, coverage, stability and parameter-sensitivity agreement.","- Threshold: minimum 30 resolved cases and ≥80% observed coverage; operational gate, not a power guarantee.","- Favorable/unfavorable observed labels are descriptive, not predictive or betting advice."];
await writeFile(resolve(out,"latest.md"),md.join("\n")+"\n","utf8");console.log("Report pack v2: "+report.available+" available, "+report.missing+" missing, "+report.invalid+" invalid; evidence labels "+JSON.stringify(counts));console.log("Output: "+out);
