#!/usr/bin/env tsx
/** Generate per-configuration evidence dossiers from existing report pack only. */
import {readFile,mkdir,writeFile} from "node:fs/promises";import {resolve} from "node:path";
import {appendEvidenceSnapshot,createSnapshot,type EvidenceDossier} from "../src/research/evidence-dossier";
const root=resolve(process.argv[2]??"reports");const packPath=resolve(root,"research-report-pack/latest.json");const pack=JSON.parse(await readFile(packPath,"utf8"));const out=resolve(root,"evidence-dossiers");await mkdir(out,{recursive:true});
const now=pack.createdAt??new Date().toISOString();let created=0,duplicates=0;
for(const decision of pack.evidence??[]){const safe=decision.key.replace(/[^a-zA-Z0-9._-]/g,"_");const path=resolve(out,safe+".json");let prior:EvidenceDossier|null=null;try{prior=JSON.parse(await readFile(path,"utf8"));}catch{}
 const snap=createSnapshot(decision.key,decision,pack.schema,now);const next=appendEvidenceSnapshot(prior,snap);if(next.integrity==="duplicate-snapshot"){duplicates++;continue;}if(next.integrity==="candidate-mismatch")throw new Error("Dossier candidate mismatch for "+decision.key);
 await writeFile(path,JSON.stringify(next,null,2)+"\n","utf8");created++;
}
const summary={schema:"tris-evidence-dossier-index-v1",createdAt:now,sourcePack:pack.schema,dossiersWritten:created,duplicatesSkipped:duplicates,totalCandidates:(pack.evidence??[]).length,interpretation:"Append-only descriptive history of report classifications; not predictive evidence and not a modification of frozen forecast ledgers."};
await writeFile(resolve(out,"index.json"),JSON.stringify(summary,null,2)+"\n","utf8");await writeFile(resolve(out,"index.md"),["# Evidence dossier index","", "- Generated: "+now,"- Dossiers written: "+created,"- Duplicate snapshots skipped: "+duplicates,"- Candidates: "+summary.totalCandidates,"","This index tracks classification snapshots only; it does not change forecasts, parameters, or frozen ledgers."].join("\n")+"\n","utf8");console.log("Evidence dossiers: "+created+" written; "+duplicates+" duplicate snapshots skipped.");
