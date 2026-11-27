#!/usr/bin/env tsx
/** Phase 98: joint stability summary for phases 95, 96 and 97. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {evaluateStructuralMotifJointStability} from "../src/research/structural-motif-joint-stability";
const paths=[resolve(process.argv[2]??"reports/structural-motif-temporal-robustness/latest.json"),resolve(process.argv[3]??"reports/structural-motif-block-bootstrap/latest.json"),resolve(process.argv[4]??"reports/structural-motif-bootstrap-sensitivity/latest.json")];
async function load(path:string){try{return JSON.parse(await readFile(path,"utf8"));}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error;}}
const [p95,p96,p97]=await Promise.all(paths.map(load));
const report=evaluateStructuralMotifJointStability(p95,p96,p97),out=resolve("reports/structural-motif-joint-stability");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceReports:paths,report},null,2)+"\n");
const lines=["# Fase 98 — Estabilidad estructural conjunta","","## Fuentes",...paths.map((p,i)=>"- Fase "+(95+i)+": "+(i===0?p:p)),"","Grupos: "+report.summary.groups,"Consistencia retrospectiva: "+report.summary.consistentRetrospectiveSupport,"Evidencia mixta: "+report.summary.mixedEvidence,"Evidencia insuficiente: "+report.summary.insufficientEvidence,"","| Familia | Pos. | Fase 95 holdout Δ | Fase 96 IC 95% | Fase 97 sensibilidad | Clasificación |","|---|---:|---:|---:|---|---|",...report.groups.map(g=>{const a=g.phases.temporalHoldout,b=g.phases.blockBootstrap,c=g.phases.blockSensitivity;return"| "+g.family+" | "+(g.position+1)+" | "+(a?.deltaVsRandom===null||a?.deltaVsRandom===undefined?"—":(100*a.deltaVsRandom).toFixed(2)+" pp")+" | "+(b?(100*b.q025).toFixed(2)+" a "+(100*b.q975).toFixed(2)+" pp":"—")+" | "+(c?.conclusion??"—")+" | "+g.classification+" |";}),"","## Limitaciones",...report.limitations.map(x=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");
console.log("Phase 98: "+report.summary.consistentRetrospectiveSupport+" consistent retrospective groups; "+report.summary.mixedEvidence+" mixed; "+report.summary.insufficientEvidence+" insufficient.");
