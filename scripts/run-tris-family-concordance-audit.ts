#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {summarizeProspectiveFamilyConcordance} from "../src/research/prospective-family-concordance";
import {auditProspectiveFamilyConcordance} from "../src/research/prospective-family-concordance-audit";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
async function json<T>(name:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,name),"utf8")) as T;}
async function jsonl<T>(name:string):Promise<T[]>{return(await readFile(resolve(dir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as T);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{summary:{lastObservedDrawId:number};manifest:{portfolioId:string}}>("latest-summary.json");\nif(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("latest-summary.json no corresponde al manifiesto del ledger.");process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),results=await jsonl<ResolvedForecast>("results.jsonl");
if(!results.length){console.error("Aún no hay resultados prospectivos resueltos; no se puede comparar concordancia observada.");process.exit(2);}
const catalog=generateIntuitionCandidates();
const observed=summarizeProspectiveFamilyConcordance(manifest,catalog,forecasts,results,latest.summary.lastObservedDrawId);
const audit=auditProspectiveFamilyConcordance(observed,{replications:Number(process.env.TRIS_FAMILY_AUDIT_REPS??2000),minimumDrawSupport:Number(process.env.TRIS_FAMILY_AUDIT_MIN_DRAWS??30),seed:Number(process.env.TRIS_FAMILY_AUDIT_SEED??20261125),hitRate:Number(process.env.TRIS_FAMILY_AUDIT_NULL_HIT_RATE??.2),pairedDependence:Number(process.env.TRIS_FAMILY_AUDIT_PAIRED_DEPENDENCE??.5)});
const out=resolve(dir,"family-concordance-audit");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),observed,audit},null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(2)+"%";
const md=["# TRIS — auditoría de concordancia observada frente al nulo sintético","","- Portafolio: "+audit.portfolioId,"- Concursos: "+audit.firstTargetDrawId+"–"+audit.lastObservedDrawId,"- Concursos comunes mínimos entre pares: "+audit.observedCommonDraws,"- Pares comparables: "+audit.comparableFamilyPairs,"- Familias: "+audit.familyCount+"; candidatos medianos por familia: "+audit.medianCandidatesPerFamily,"- Soporte mínimo requerido: "+audit.minimumDrawSupport,"- Soporte suficiente: "+(audit.sufficientSupport?"sí":"no"),"","## Observado","- Correlación media entre pares: "+(audit.observedMeanPairwiseCorrelation?.toFixed(3)??"n/d"),"- Acuerdo direccional medio: "+pct(audit.observedMeanDirectionAgreement),"","## Envolventes nulas sintéticas","| Solapamiento latente | Correlación nula P05 / mediana / P95 | Estado observado | Acuerdo nulo P05 / mediana / P95 | Estado observado | Todas las familias positivas por azar |","|---:|---|---|---|---|---:|",...audit.nullScenarios.map(s=>"| "+s.crossFamilyOverlap+" | "+[s.nullCorrelationP05,s.nullCorrelationMedian,s.nullCorrelationP95].map(x=>x===null?"n/d":x.toFixed(3)).join(" / ")+" | "+s.observedCorrelationStatus+" | "+[s.nullDirectionP05,s.nullDirectionMedian,s.nullDirectionP95].map(pct).join(" / ")+" | "+s.observedDirectionStatus+" | "+pct(s.nullAllPositiveRate)+" |"),"","## Límites",...audit.limitations.map(x=>"- "+x),"","No se ajusta el portafolio ni se interpreta esta comparación como prueba estadística confirmatoria."].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
