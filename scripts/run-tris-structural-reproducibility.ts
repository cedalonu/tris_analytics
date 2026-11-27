#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {compareStructuralReproducibility,type ReproducibilityPhase,type StructuralReproducibilityManifest} from "../src/research/structural-motif-reproducibility";
const root=resolve("reports/structural-motif-reproducibility"),baselinePath=resolve(root,"baseline.json"),latestPath=resolve(root,"latest.json");
const expectedMethods:Record<number,string>={94:"structural-motif-matched-random-control-v1",95:"structural-motif-temporal-robustness-v1",96:"structural-motif-block-bootstrap-v1",97:"structural-motif-bootstrap-sensitivity-v1",98:"structural-motif-joint-stability-v1",99:"structural-motif-research-chain-audit-v1"};
const defs=[{phase:94,label:"Control aleatorio emparejado",dir:"structural-motif-random-control"},{phase:95,label:"Holdout y bloques temporales",dir:"structural-motif-temporal-robustness"},{phase:96,label:"Bootstrap por bloques",dir:"structural-motif-block-bootstrap"},{phase:97,label:"Sensibilidad del bootstrap",dir:"structural-motif-bootstrap-sensitivity"},{phase:98,label:"Estabilidad conjunta",dir:"structural-motif-joint-stability"},{phase:99,label:"Auditoría de cadena",dir:"structural-motif-research-chain-audit"}];
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
async function read(path:string){try{return await readFile(path,"utf8");}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e;}}
function sourcePaths(wrapper:any,phase:number):string[]{const raw=wrapper?.sourceReport??wrapper?.sourceReports;if(typeof raw==="string")return[raw];if(Array.isArray(raw))return raw.filter((x:any)=>typeof x==="string");if(raw&&typeof raw==="object")return Object.values(raw).filter((x:any)=>typeof x==="string") as string[];return[];}
async function capture():Promise<StructuralReproducibilityManifest>{
 const phases:ReproducibilityPhase[]=[];
 for(const def of defs){const base=resolve("reports",def.dir),jsonPath=resolve(base,"latest.json"),mdPath=resolve(base,"latest.md"),issues:string[]=[];
  const [json,md]=await Promise.all([read(jsonPath),read(mdPath)]);let wrapper:any=null;
  if(!json)issues.push("No existe "+jsonPath);else try{wrapper=JSON.parse(json);}catch{issues.push("JSON inválido: "+jsonPath);}
  const inputFiles=[] as {path:string;sha256:string}[];
  if(wrapper){const paths=sourcePaths(wrapper,def.phase);if(!paths.length)issues.push("No hay sourceReport(s) declarados.");for(const p of paths){const abs=resolve(p),content=await read(abs);if(content===null)issues.push("No existe la entrada "+abs);else inputFiles.push({path:abs,sha256:hash(content)});}}
  if(!md)issues.push("No existe "+mdPath);
  const report=wrapper?.report??wrapper;
  if(report?.method!==expectedMethods[def.phase])issues.push("Método no esperado: "+String(report?.method)+"; se esperaba "+expectedMethods[def.phase]);
  phases.push({phase:def.phase,label:def.label,method:report?.method??null,settings:report?.settings??null,inputFiles,outputHashes:{json:json===null?null:hash(json),markdown:md===null?null:hash(md)},available:issues.length===0&&report?.method===expectedMethods[def.phase],issues});
 }
 const pkg=JSON.parse((await read("package.json"))??"{}");
 return{method:"structural-motif-reproducibility-manifest-v1",createdForComparison:false,environment:{node:process.version,platform:process.platform,arch:process.arch,packageVersion:pkg.version??null},phases};
}
const args=process.argv.slice(2),mode=args.includes("--capture-baseline")?"capture":args.includes("--compare")?"compare":"compare",replace=args.includes("--replace-baseline");
await mkdir(root,{recursive:true});
const current=await capture();
if(mode==="capture"){
 const old=await read(baselinePath);if(old&&!replace){console.error("Ya existe baseline.json. Usa --replace-baseline solo si deseas sustituir explícitamente la referencia.");process.exit(2);}
 const missing=current.phases.filter(p=>!p.available);if(missing.length){console.error("No se captura una línea base incompleta. Fases con problemas: "+missing.map(p=>p.phase+": "+p.issues.join("; ")).join(" | "));process.exit(2);}
 const baseline={...current,createdForComparison:false};await writeFile(baselinePath,JSON.stringify(baseline,null,2)+"\n");
 const result={method:"structural-motif-reproducibility-comparison-v1",status:"baseline-captured",summary:{reproducible:0,nonReproducible:0,changedInputs:0,changedSettings:0,changedContext:0,notEvaluable:0},environmentChanged:false,phases:current.phases.map(p=>({phase:p.phase,label:p.label,status:"baseline-captured",reason:"Referencia inicial guardada.",current:p})),limitations:["La captura establece una referencia; todavía no prueba reproducibilidad."]};
 await writeFile(latestPath,JSON.stringify({manifest:current,report:result},null,2)+"\n");console.log("Fase101: línea base capturada para las seis fases 94–99.");process.exit(0);
}
const baselineText=await read(baselinePath);let baseline:StructuralReproducibilityManifest|null=null;if(baselineText)try{baseline=JSON.parse(baselineText);}catch{}
const report=compareStructuralReproducibility(baseline,current),payload={manifest:current,report};
await writeFile(latestPath,JSON.stringify(payload,null,2)+"\n");
const lines=["# Fase 101 — Reproducibilidad de la cadena TRIS","","Estado: **"+report.status+"**","","| Fase | Estado | Entrada(s) | Parámetros | Salida JSON | Salida Markdown |","|---:|---|---:|---|---|---|",...report.phases.map((p:any)=>"| "+p.phase+" · "+p.label+" | "+p.status+" | "+(p.current?.inputFiles?.length??0)+" | "+(p.current?.settings?"registrados":"no declarados")+" | "+(p.current?.outputHashes?.json?"SHA-256":"ausente")+" | "+(p.current?.outputHashes?.markdown?"SHA-256":"ausente")+" |"),"","## Resumen","- Reproducibles: "+report.summary.reproducible,"- No reproducibles: "+report.summary.nonReproducible,"- Entradas cambiadas: "+report.summary.changedInputs,"- Parámetros cambiados: "+report.summary.changedSettings,"- Contexto cambiado: "+report.summary.changedContext,"- No evaluables: "+report.summary.notEvaluable,"- Entorno diferente: "+(report.environmentChanged?"sí":"no"),"","## Detalle",...report.phases.map((p:any)=>"- Fase "+p.phase+": "+p.reason),"","## Limitaciones",...report.limitations.map(x=>"- "+x)];
await writeFile(resolve(root,"latest.md"),lines.join("\n")+"\n");
console.log("Fase101: "+report.status+"; "+report.summary.reproducible+" reproducibles; "+report.summary.nonReproducible+" no reproducibles; "+report.summary.notEvaluable+" no evaluables.");
