#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {compareCandidatePortfolioMethods,type CandidatePortfolio,type CandidatePortfolioMethod} from "../src/research/candidate-portfolio-selector";
const sizes=(process.env.TRIS_PORTFOLIO_SIZES??"10,20,50").split(",").map(Number);
const seedCount=Math.max(1,Math.min(1000,Number(process.env.TRIS_PORTFOLIO_RANDOM_REPS??100)));
const seeds=Array.from({length:seedCount},(_,i)=>20261125+i);
const rows=compareCandidatePortfolioMethods(sizes,seeds);
const dir=resolve(process.env.TRIS_PORTFOLIO_OUT??"reports/candidate-portfolios");await mkdir(dir,{recursive:true});
const generatedAt=new Date().toISOString();
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const summary=sizes.flatMap(size=>(["family-balanced","max-diversity","redundancy-control","random"] as CandidatePortfolioMethod[]).map(method=>{
 const group=rows.filter(r=>r.metrics.size===size&&r.method===method);
 const m=(f:(r:CandidatePortfolio)=>number)=>avg(group.map(f));
 return{size,method,repetitions:group.length,meanJaccard:m(r=>r.metrics.meanPairJaccard),meanMaxJaccard:m(r=>r.metrics.maxPairJaccard),meanCosine:m(r=>r.metrics.meanPairCosine),meanUniqueComponents:m(r=>r.metrics.uniqueComponents),meanFamilyCounts:Object.fromEntries(["transition","position-mutation","absence-return","pool-ranking"].map(f=>[f,avg(group.map(r=>r.metrics.familyCounts[f as keyof typeof r.metrics.familyCounts]))]))};
}));
const payload={generatedAt,candidateCatalogSize:1095,sizes,randomReplications:seedCount,summary,portfolios:rows};
await writeFile(resolve(dir,"latest.json"),JSON.stringify(payload,null,2)+"\n","utf8");
const md=[
 "# TRIS — experimento de carteras estructurales de hipótesis","",
 "- Generado: "+generatedAt,
 "- Catálogo de referencia: 1,095 hipótesis sintéticas/configuracionales.",
 "- Tamaños probados: "+sizes.join(", ")+". Réplicas aleatorias por tamaño: "+seedCount+".",
 "- No se usan resultados históricos, CSV, puntuaciones de acierto ni premios.",
 "",
 "## Comparación estructural",
 "| Tamaño | Método | Réplicas | Jaccard medio | Jaccard máximo medio | Coseno medio | Componentes únicos medios |",
 "|---:|---|---:|---:|---:|---:|---:|",
 ...summary.map(x=>"| "+x.size+" | "+x.method+" | "+x.repetitions+" | "+x.meanJaccard.toFixed(4)+" | "+x.meanMaxJaccard.toFixed(4)+" | "+x.meanCosine.toFixed(4)+" | "+x.meanUniqueComponents.toFixed(2)+" |"),
 "",
 "## Composición media por familia",
 "| Tamaño | Método | Transición | Mutación | Ausencia-retorno | Pool-ranking |","|---:|---|---:|---:|---:|---:|",
 ...summary.map(x=>"| "+x.size+" | "+x.method+" | "+x.meanFamilyCounts.transition.toFixed(2)+" | "+x.meanFamilyCounts["position-mutation"].toFixed(2)+" | "+x.meanFamilyCounts["absence-return"].toFixed(2)+" | "+x.meanFamilyCounts["pool-ranking"].toFixed(2)+" |"),
 "",
 "## Definición de métodos",
 "- family-balanced: selección round-robin entre familias.",
 "- max-diversity: selección greedy que maximiza la distancia Jaccard media frente a las señales ya elegidas.",
 "- redundancy-control: selección greedy que minimiza esa distancia (control deliberadamente redundante).",
 "- random: muestras aleatorias reproducibles; se muestran medias sobre múltiples semillas.",
 "",
 "## Interpretación y límites",
 "- Esta fase solo compara diversidad de configuraciones/componentes; no evalúa cobertura de dígitos, aciertos, rentabilidad ni poder predictivo.",
 "- Jaccard/coseno describen parámetros compartidos, no correlación observada. Incluso señales disjuntas pueden compartir sorteos, etiquetas y ruido.",
 "- max-diversity no se considera mejor estrategia de TRIS por obtener menor similitud estructural. Es únicamente una cartera experimental candidata para futuras pruebas walk-forward.",
 "- Antes de evaluar rendimiento se debe congelar el conjunto, definir modalidad/presupuesto, generar cada señal solo con sorteos anteriores al objetivo y comparar con baseline aleatorio y simple frecuencia en igualdad de condiciones.",
 "- El holdout histórico previo no es necesariamente virgen; toda conclusión debe confirmarse prospectivamente.",
 "- Sin APIs, red, descargas automáticas ni modificación de pesos/ledger."
].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
