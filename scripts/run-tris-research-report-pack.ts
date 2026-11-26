#!/usr/bin/env tsx
/** Read-only aggregator for existing TRIS research report outputs; missing reports remain missing. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const reportRoot=resolve(process.argv[2]??"reports");
const names=["prospective-ledger-audit/latest.json","prospective-performance/latest.json","prospective-performance-stability/latest.json","prospective-performance-sensitivity/latest.json","prospective-coverage/latest.json"];
type Entry={name:string;status:"available"|"missing"|"invalid";summary:unknown;path:string};
const entries:Entry[]=[];
for(const name of names){
 const path=resolve(reportRoot,name);
 try{
  const raw=await readFile(path,"utf8"),data=JSON.parse(raw);
  const summary=data.summary??data;
  entries.push({name,status:"available",summary,path});
 }catch(error){
  const code=(error as NodeJS.ErrnoException).code;
  entries.push({name,status:code==="ENOENT"?"missing":"invalid",summary:code==="ENOENT"?"Report not found; no result inferred.":String(error),path});
 }
}
const report={schema:"tris-research-report-pack-v1",createdAt:new Date().toISOString(),reportRoot,available:entries.filter(x=>x.status==="available").length,missing:entries.filter(x=>x.status==="missing").length,invalid:entries.filter(x=>x.status==="invalid").length,reports:entries,interpretation:"Aggregation only. This script does not rerun experiments, infer missing data, backfill forecasts, or promote hypotheses."};
const out=resolve(reportRoot,"research-report-pack");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify(report,null,2)+"\n","utf8");
const md=["# TRIS research report pack","", "- Generado: "+report.createdAt,"- Disponibles: "+report.available,"- Ausentes: "+report.missing,"- Inválidos: "+report.invalid,"","| Reporte | Estado | Resumen |","|---|---|---|",...entries.map(e=>"| "+e.name+" | "+e.status+" | "+JSON.stringify(e.summary).slice(0,300).replace(/\\|/g,"/")+" |"),"","## Interpretación","",report.interpretation,"","## Criterios","- Reportes faltantes no se consideran aprobados ni resultados cero.","- Los datos prospectivos, holdout y validación deben permanecer separados.","- La agregación no constituye evidencia predictiva ni recomendación de apuesta."];
await writeFile(resolve(out,"latest.md"),md.join("\n")+"\n","utf8");
console.log("Research report pack: available="+report.available+" missing="+report.missing+" invalid="+report.invalid);
console.log("Output: "+out);
