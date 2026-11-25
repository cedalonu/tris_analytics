#!/usr/bin/env tsx
/** Offline portfolio walk-forward. Input CSV must be supplied manually by the user. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {importTrisCsv} from "../src/research/data-adapter";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import {selectCandidatePortfolio,type CandidatePortfolioMethod} from "../src/research/candidate-portfolio-selector";
import {buildPortfolioPhaseBoundaries,evaluateCandidatePortfolioWalkForward} from "../src/research/candidate-portfolio-walk-forward";
import {buildBenchmarkPortfolios} from "../src/research/candidate-portfolio-benchmarks";

const file=process.argv[2];if(!file){console.error("Uso: npm run research:portfolio-walk-forward -- ./data/Tris.csv");process.exit(2);}
const csv=await readFile(resolve(file),"utf8"),dataset=importTrisCsv(csv);
if(dataset.validation.errors.length){console.error(dataset.validation.errors.join("\n"));process.exit(1);}
if(dataset.validation.valid.length<201){console.error("Se requieren al menos 201 sorteos válidos; recibidos: "+dataset.validation.valid.length);process.exit(1);}
const draws=dataset.validation.valid;
const candidates=generateIntuitionCandidates();
const boundaries=buildPortfolioPhaseBoundaries(draws);
const sizes=(process.env.TRIS_PORTFOLIO_SIZES??"10,20").split(",").map(Number);
const randomReps=Math.max(1,Math.min(100,Number(process.env.TRIS_PORTFOLIO_RANDOM_REPS??10)));\nconst stabilityBlockSize=Math.max(2,Math.floor(Number(process.env.TRIS_STABILITY_BLOCK_SIZE??25)));
const methods:CandidatePortfolioMethod[]=["family-balanced","max-diversity","redundancy-control","random"];
const reports=[];
for(const size of sizes){
 for(const benchmark of buildBenchmarkPortfolios(candidates,size,20261125)){
  reports.push(evaluateCandidatePortfolioWalkForward(draws,benchmark.portfolio,candidates,boundaries,benchmark.name,stabilityBlockSize));
 }
 for(const method of methods){
 const seeds=method==="random"?Array.from({length:randomReps},(_,i)=>20261125+i):[20261125];
 for(const seed of seeds){
  const portfolio=selectCandidatePortfolio(method,size,seed,candidates);
  reports.push(evaluateCandidatePortfolioWalkForward(draws,portfolio,candidates,boundaries,portfolio.method,stabilityBlockSize));
 }
}
}
const generatedAt=new Date().toISOString();
const output={generatedAt,inputFile:file,source:dataset.provenance,candidateCatalogSize:candidates.length,draws:draws.length,phaseBoundaries:boundaries,portfolioSizes:sizes,randomReplications:randomReps,stabilityBlockSize,reports};
const dir=resolve(process.env.TRIS_PORTFOLIO_WF_OUT??"reports/candidate-portfolio-walk-forward");
await mkdir(dir,{recursive:true});
await writeFile(resolve(dir,"latest.json"),JSON.stringify(output,null,2)+"\n","utf8");
const rows=reports.flatMap(r=>r.phases.map(p=>({method:r.method,seed:r.seed,...p})));\nconst blockRows=reports.flatMap(r=>r.stabilityBlocks.map(b=>({method:r.method,seed:r.seed,...b})));\nconst summaryRows=reports.filter(r=>r.stability).map(r=>({method:r.method,seed:r.seed,...r.stability!}));
const lines=["# TRIS — evaluación walk-forward de portafolios","",
"- Generado: "+generatedAt,
"- Archivo local: "+file,
"- Sorteos válidos: "+draws.length+" ("+draws[0].drawId+"–"+draws.at(-1)!.drawId+")",
"- Catálogo: "+candidates.length+" candidatos; tamaños: "+sizes.join(", ")+".",
"- Separación temporal: "+boundaries.map(b=>b.phase+" "+b.firstDrawId+"–"+b.lastDrawId).join("; "),
"",
"| Método | Semilla | Fase | Candidatos | Señal-sorteos | Cobertura | Acierto | Baseline pareado | Diferencia | Omitidos |",
"|---|---:|---|---:|---:|---:|---:|---:|---:|---:|",
...rows.map(r=>"| "+r.method+" | "+r.seed+" | "+r.phase+" | "+r.candidateCount+" | "+r.signalDraws+" | "+(100*r.coverage).toFixed(1)+"% | "+(100*r.rate).toFixed(2)+"% | "+(100*r.baselineRate).toFixed(2)+"% | "+(100*r.difference).toFixed(2)+" pp | "+r.skipped+" |"),
"",
"## Advertencias",
"- La fase discovery/validation/holdout se asigna cronológicamente después de 200 sorteos iniciales; el holdout histórico no es evidencia prospectiva.",
"- Los registros candidato-sorteo están correlacionados. Las tasas agregadas y por bloque son descriptivas; no se calculan p-valores ingenuos ni se asume independencia.",\n"- La estabilidad se evalúa solo dentro del holdout y no permite reajustar o seleccionar retrospectivamente candidatos. La desviación entre bloques no es un intervalo de confianza.",\n"- Las diferencias por bloque comparan cada candidato con su baseline pareado en los mismos sorteos elegibles; los bloques no garantizan independencia temporal.",
"- Los candidatos cubren distintas familias y objetivos (secuencias, dígitos posicionales y pools); la tasa agregada no es una tasa de acierto de boleto.",
"- Se incluyen portafolios de referencia con igual presupuesto: solo frecuencia histórica, solo transiciones y pools de frecuencia reciente. Sus candidatos se muestrean sin usar resultados del periodo evaluado.",
"- Cada candidato conserva además su baseline pareado interno; ese comparador puede variar entre familias y no debe confundirse con los tres portafolios de referencia.",
"- No se calcula rentabilidad, premios ni EV. No se generan apuestas ni se modifica el ledger.",
"- Sin APIs ni descargas: el usuario entrega el CSV localmente. Revisar warnings y continuidad del archivo antes de interpretar.",
"- Los resultados no demuestran que TRIS sea predecible; confirmar cualquier señal en nuevos sorteos congelados antes de considerarla útil."
].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),lines,"utf8");
console.log(lines);
if(dataset.validation.warnings.length)console.warn("CSV warnings:\n"+dataset.validation.warnings.join("\n"));
