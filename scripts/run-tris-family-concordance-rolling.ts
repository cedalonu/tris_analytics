#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {summarizeProspectiveFamilyConcordance} from "../src/research/prospective-family-concordance";
import {summarizeProspectiveFamilyConcordanceRolling} from "../src/research/prospective-family-concordance-rolling";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
async function json<T>(name:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,name),"utf8")) as T;}
async function jsonl<T>(name:string):Promise<T[]>{return(await readFile(resolve(dir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as T);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{summary:{lastObservedDrawId:number};manifest:{portfolioId:string}}>("latest-summary.json");
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("latest-summary.json no corresponde al manifiesto.");process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),results=await jsonl<ResolvedForecast>("results.jsonl");
if(!results.length){console.error("No hay resultados prospectivos resueltos; no se genera análisis rolling.");process.exit(2);}
const observed=summarizeProspectiveFamilyConcordance(manifest,generateIntuitionCandidates(),forecasts,results,latest.summary.lastObservedDrawId);
const rolling=summarizeProspectiveFamilyConcordanceRolling(observed,{windowSize:Number(process.env.TRIS_CONCORDANCE_ROLLING_WINDOW??25),stepSize:Number(process.env.TRIS_CONCORDANCE_ROLLING_STEP??5),minimumDrawSupport:Number(process.env.TRIS_CONCORDANCE_ROLLING_MIN_DRAWS??10)});
const out=resolve(dir,"family-concordance-rolling");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),observed,rolling},null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — concordancia en ventanas móviles prospectivas","", "- Portafolio: "+rolling.portfolioId,"- Concursos observados: "+rolling.firstTargetDrawId+"–"+rolling.lastObservedDrawId,"- Ventana: "+rolling.windowSize+" concursos; paso: "+rolling.stepSize,"- Soporte común mínimo: "+rolling.minimumDrawSupport,"","## Resumen por pareja","| Familias | Ventanas válidas | Positivas | Negativas | Mixtas | Insuficientes | Correlación media | Acuerdo medio |","|---|---:|---:|---:|---:|---:|---:|---:|",...rolling.pairs.map(p=>"| "+p.familyA+" / "+p.familyB+" | "+p.supportedWindows+" | "+p.positiveWindows+" | "+p.negativeWindows+" | "+p.mixedWindows+" | "+p.underpoweredWindows+" | "+(p.meanCorrelation?.toFixed(3)??"n/d")+" | "+pct(p.meanDirectionAgreement)+" |"),"","## Detalle de ventanas","| Pareja | Ventana | Comunes | Correlación | Acuerdo | Estado |","|---|---|---:|---:|---:|---|",...rolling.pairs.flatMap(p=>p.windows.map(w=>"| "+p.familyA+" / "+p.familyB+" | "+w.startDrawId+"–"+w.endDrawId+" | "+w.commonDraws+" | "+(w.correlation?.toFixed(3)??"n/d")+" | "+pct(w.directionAgreement)+" | "+w.status+" |")),"","## Limitaciones",...rolling.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
