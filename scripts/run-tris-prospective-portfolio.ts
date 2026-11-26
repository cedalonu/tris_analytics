#!/usr/bin/env tsx
/** Frozen-membership prospective portfolio monitor. Local CSV only; no APIs. */
import {readFile,writeFile,appendFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import {freezeProspectiveForecast,resolveProspectiveForecast,type FrozenForecast,type ResolvedForecast} from "../src/research/intuition-prospective";
import {createProspectivePortfolioManifest,validateProspectivePortfolioManifest,summarizeProspectivePortfolio,type ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {summarizeProspectiveFamilyConcordance} from "../src/research/prospective-family-concordance";

const input=process.argv[2];
if(!input){console.error("Uso: npm run research:prospective-portfolio -- ./data/Tris.csv [directorio-ledger]");process.exit(2);}
const csvPath=resolve(input),ledgerDir=resolve(process.argv[3]??"data/prospective-portfolio");
const csv=await readFile(csvPath,"utf8"),dataset=importTrisCsv(csv);
if(dataset.validation.errors.length){console.error(dataset.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=dataset.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Procesamiento detenido: hay concursos faltantes.\n"+gaps.slice(0,30).join("\n"));process.exit(1);}
const draws=dataset.validation.valid;
if(draws.length<200){console.error("Se requieren al menos 200 sorteos válidos.");process.exit(1);}
await mkdir(ledgerDir,{recursive:true});
const manifestPath=resolve(ledgerDir,"portfolio-manifest.json"),forecastsPath=resolve(ledgerDir,"forecasts.jsonl"),resultsPath=resolve(ledgerDir,"results.jsonl");
async function readJsonl<T>(path:string):Promise<T[]>{try{return(await readFile(path,"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return[];throw e;}}
const candidates=generateIntuitionCandidates(),stamp=new Date().toISOString(),nextTarget=draws.at(-1)!.drawId+1;
let manifest:ProspectivePortfolioManifest;
try{manifest=JSON.parse(await readFile(manifestPath,"utf8")) as ProspectivePortfolioManifest;}
catch(e){
 if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
 manifest=createProspectivePortfolioManifest(candidates,{createdAt:stamp,firstTargetDrawId:nextTarget,size:Number(process.env.TRIS_PROSPECTIVE_PORTFOLIO_SIZE??20),method:(process.env.TRIS_PROSPECTIVE_PORTFOLIO_METHOD as "family-balanced"|"max-diversity"|"redundancy-control"|"random"|undefined)??"family-balanced",seed:Number(process.env.TRIS_PROSPECTIVE_PORTFOLIO_SEED??20261125),blockSize:Number(process.env.TRIS_PROSPECTIVE_BLOCK_SIZE??25)});
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n","utf8");
}
validateProspectivePortfolioManifest(manifest,candidates);
const forecasts=await readJsonl<FrozenForecast>(forecastsPath),results=await readJsonl<ResolvedForecast>(resultsPath);
const resolvedIds=new Set(results.map(r=>r.forecastId)),drawById=new Map(draws.map(d=>[d.drawId,d]));
const newResults:ResolvedForecast[]=[];
for(const forecast of forecasts){
 if(resolvedIds.has(forecast.forecastId))continue;
 const actual=drawById.get(forecast.targetDrawId);if(!actual)continue;
 newResults.push(resolveProspectiveForecast(forecast,actual,draws.filter(d=>d.drawId<forecast.targetDrawId),stamp));
}
if(newResults.length)await appendFile(resultsPath,newResults.map(r=>JSON.stringify(r)).join("\n")+"\n","utf8");
const allResults=[...results,...newResults];
const existingNext=new Set(forecasts.filter(f=>f.targetDrawId===nextTarget).map(f=>f.candidateId));
const newForecasts:FrozenForecast[]=[];
for(const candidateId of manifest.candidateIds){
 if(existingNext.has(candidateId))continue;
 const candidate=candidates.find(c=>c.id===candidateId)!;
 const frozen=freezeProspectiveForecast(draws,candidate,nextTarget,stamp);
 if(frozen)newForecasts.push(frozen);
}
if(newForecasts.length)await appendFile(forecastsPath,newForecasts.map(f=>JSON.stringify(f)).join("\n")+"\n","utf8");
const allForecasts=[...forecasts,...newForecasts];
const summary=summarizeProspectivePortfolio(manifest,allForecasts,allResults,draws.at(-1)!.drawId);
const familyConcordance=summarizeProspectiveFamilyConcordance(manifest,candidates,allForecasts,allResults,draws.at(-1)!.drawId);
const sha256=createHash("sha256").update(csv,"utf8").digest("hex");
const report=[
 "# TRIS — seguimiento prospectivo de portafolio congelado","",
 "- CSV local: "+basename(csvPath),
 "- SHA-256 del CSV: "+sha256,
 "- Portafolio: "+manifest.portfolioId+" ("+manifest.method+", semilla "+manifest.seed+")",
 "- Candidatos congelados: "+manifest.candidateIds.length,
 "- Primer concurso objetivo: "+manifest.firstTargetDrawId,
 "- Último concurso observado: "+draws.at(-1)!.drawId,
 "- Próximo objetivo: "+nextTarget,
 "- Bloques: "+manifest.blockSize+" concursos consecutivos",
 "",
 "## Acumulado prospectivo",
 "- Pronósticos congelados: "+summary.forecastedSignals,
 "- Pronósticos resueltos: "+summary.resolvedSignals,
 "- Pendientes: "+summary.pendingSignals,
 "- No pronosticados (oportunidades omitidas): "+summary.unforecastedSignals,
 "- Cobertura resuelta sobre oportunidades posibles: "+(100*summary.coverage).toFixed(2)+"%",
 "- Aciertos del candidato: "+summary.hits+" ("+(100*summary.rate).toFixed(2)+"%)",
 "- Aciertos del baseline pareado: "+summary.baselineHits+" ("+(100*summary.baselineRate).toFixed(2)+"%)",
 "- Diferencia: "+(100*summary.difference).toFixed(2)+" puntos porcentuales",
 "",
 "## Estabilidad por bloques",
 "| Concursos | Resueltos / esperados | Cobertura | Acierto | Baseline | Diferencia | Pendientes | No pronosticados |",
 "|---|---:|---:|---:|---:|---:|---:|---:|",
 ...summary.blocks.map(b=>"| "+b.firstDrawId+"–"+b.lastDrawId+(b.partial?" (parcial)":"")+" | "+b.resolvedSignals+" / "+b.expectedSignals+" | "+(100*b.coverage).toFixed(1)+"% | "+(100*b.rate).toFixed(2)+"% | "+(100*b.baselineRate).toFixed(2)+"% | "+(100*b.difference).toFixed(2)+" pp | "+b.pendingSignals+" | "+b.unforecastedSignals+" |"),
 "",
 "## Diagnóstico",
 "- Bloques con diferencia positiva: "+summary.positiveBlocks,
 "- Bloques con diferencia negativa: "+summary.negativeBlocks,
 "- Bloques neutrales/sin datos: "+summary.neutralBlocks,
 "- Rango de tasas por bloque: "+(100*summary.rateRange).toFixed(2)+" pp",
 "- Desviación estándar descriptiva entre bloques: "+(100*summary.rateStdDev).toFixed(2)+" pp",
 "- Diferencia media no ponderada por bloque: "+(100*summary.meanBlockDifference).toFixed(2)+" pp",
 "",
 "## Salvaguardas",
 "- La composición del portafolio y las configuraciones se guardan una sola vez en portfolio-manifest.json; cambios de variables de entorno no alteran el portafolio existente.",
 "- Cada pronóstico usa solo el historial previo, conserva su SHA-256 y se resuelve únicamente contra el concurso exacto.",
 "- No se reconstruyen pronósticos de concursos pasados que no fueron congelados. Se contabilizan como oportunidades no pronosticadas.",
 "- Las tasas usan pronósticos resueltos; cobertura se calcula sobre todos los pares candidato-concurso desde el inicio congelado.",
 "- Los bloques son descriptivos, pueden depender temporalmente y no son pruebas independientes. No se calculan p-valores ni rentabilidad.",
 "- El baseline es el comparador interno de cada candidato; no es una probabilidad calibrada.",
 "- No cambiar la composición tras observar resultados. No declarar ventaja predictiva sin volumen suficiente y confirmación adicional.",
 "- Sin APIs, polling ni descargas: el CSV se proporciona manualmente."
].join("\n")+"\n";
await writeFile(resolve(ledgerDir,"latest-report.md"),report,"utf8");
const familyLines=[
 "# TRIS — concordancia prospectiva entre familias","",
 "- Portafolio: "+manifest.portfolioId,
 "- Intervalo observado: "+manifest.firstTargetDrawId+"–"+draws.at(-1)!.drawId,"",
 "## Resumen por familia",
 "| Familia | Candidatos | Señales resueltas | Concursos cubiertos | Cobertura | Acierto medio por concurso | Baseline medio | Diferencia media | + / − / 0 concursos |",
 "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
 ...familyConcordance.families.map(f=>"| "+f.family+" | "+f.candidateCount+" | "+f.resolvedSignals+" / "+f.expectedSignals+" | "+f.coveredDraws+" | "+(100*f.coverage).toFixed(1)+"% | "+(100*f.meanDrawHitRate).toFixed(2)+"% | "+(100*f.meanDrawBaselineRate).toFixed(2)+"% | "+(100*f.meanDrawDifference).toFixed(2)+" pp | "+f.positiveDraws+" / "+f.negativeDraws+" / "+f.neutralDraws+" |"),
 "",
 "## Concordancia por pares",
 "| Familia A | Familia B | Concursos comunes | Correlación de diferencias | Mismo sentido | Sentido opuesto | Neutral | Acuerdo direccional |",
 "|---|---|---:|---:|---:|---:|---:|---:|",
 ...familyConcordance.pairs.map(p=>"| "+p.familyA+" | "+p.familyB+" | "+p.commonDraws+" | "+(p.pearsonCorrelation===null?"n/d":p.pearsonCorrelation.toFixed(3))+" | "+p.sameDirectionDraws+" | "+p.oppositeDirectionDraws+" | "+p.neutralPairDraws+" | "+(p.directionAgreement===null?"n/d":(100*p.directionAgreement).toFixed(1)+"%")+" |"),
 "",
 "## Interpretación y límites",...familyConcordance.interpretation.map(x=>"- "+x),
 "- Correlación no disponible cuando hay menos de tres concursos comunes o alguna serie no varía.",
 "- No se calcula significancia estadística ni se corrige por multiplicidad; los resultados requieren acumulación prospectiva."
].join("\n")+"\n";
await writeFile(resolve(ledgerDir,"family-concordance.md"),familyLines,"utf8");
await writeFile(resolve(ledgerDir,"family-concordance.json"),JSON.stringify(familyConcordance,null,2)+"\n","utf8");
await writeFile(resolve(ledgerDir,"latest-summary.json"),JSON.stringify({generatedAt:stamp,csvSha256:sha256,manifest,summary,familyConcordance,newForecasts:newForecasts.length,newResults:newResults.length},null,2)+"\n","utf8");
console.log(report);
console.log("Nuevos pronósticos congelados: "+newForecasts.length+"; nuevos resultados resueltos: "+newResults.length);
