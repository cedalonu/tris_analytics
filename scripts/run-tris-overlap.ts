#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {buildCandidateRedundancyReport} from "../src/research/candidate-redundancy-matrix";
const report=buildCandidateRedundancyReport();
const dir=resolve(process.env.TRIS_OVERLAP_OUT??"reports/candidate-overlap");
await mkdir(dir,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt,...report},null,2)+"\n","utf8");
const pct=(n:number,d:number)=>d?((100*n/d).toFixed(2)+"%"):"—";
const md=[
 "# TRIS — matriz estructural de redundancia y diversidad","",
 "- Generado: "+generatedAt,
 "- Candidatas: "+report.candidateCount.toLocaleString("es-MX"),
 "- Pares no ordenados: "+report.pairCount.toLocaleString("es-MX"),
 "- Umbrales descriptivos: muy relacionadas Jaccard ≥ 0.60; relación parcial ≥ 0.25 y < 0.60; solapamiento bajo > 0 y < 0.25; disjuntas = 0.",
 "",
 "## Distribución global",
 "| Clase | Pares | Porcentaje |","|---|---:|---:|",
 ...Object.entries(report.classificationCounts).map(([k,v])=>"| "+k+" | "+v.toLocaleString("es-MX")+" | "+pct(v,report.pairCount)+" |"),
 "",
 "## Matriz por familia",
 "| Familia A | Familia B | Pares | Muy relacionadas | Parciales | Solapamiento bajo | Disjuntas | Jaccard medio |",
 "|---|---|---:|---:|---:|---:|---:|---:|",
 ...report.familyMatrix.map(x=>"| "+x.familyA+" | "+x.familyB+" | "+x.pairCount+" | "+x.highlyRelated+" | "+x.partiallyRelated+" | "+x.lowOverlap+" | "+x.disjoint+" | "+x.meanJaccard.toFixed(3)+" |"),
 "",
 "## Componentes más frecuentes",
 "| Componente | Candidatas que lo comparten |","|---|---:|",
 ...report.componentFrequency.slice(0,30).map(x=>"| "+x.component+" | "+x.candidateCount+" |"),
 "",
 "## Pares estructuralmente más redundantes",
 "| Candidata A | Candidata B | Familia A/B | Jaccard | Componentes compartidos |","|---|---|---|---:|---|",
 ...report.mostRedundantPairs.slice(0,30).map(x=>"| "+x.a+" | "+x.b+" | "+x.familyA+" / "+x.familyB+" | "+x.jaccard.toFixed(3)+" | "+x.sharedComponents.join(", ")+" |"),
 "",
 "## Pares disjuntos de ejemplo",
 "| Candidata A | Candidata B | Familia A/B |","|---|---|---|",
 ...report.mostDiversePairs.slice(0,20).map(x=>"| "+x.a+" | "+x.b+" | "+x.familyA+" / "+x.familyB+" |"),
 "",
 "## Perfiles por candidata",
 "- latest.json incluye para cada candidata el número de vecinos muy relacionados, parcialmente relacionados y con solapamiento bajo, más sus cinco vecinos estructurales más cercanos.",
 "",
 "## Interpretación y límites",
 report.interpretation,
 "La similitud se deriva exclusivamente de los parámetros/configuraciones del catálogo. No se ha consultado el CSV histórico ni se ha estimado correlación de aciertos. Una pareja estructuralmente disjunta puede compartir sorteos y datos de entrenamiento; por tanto, no debe llamarse estadísticamente independiente. No usar esta matriz para apostar ni para alterar pesos hasta contrastarla con resultados prospectivos congelados.",
 "Sin APIs, red, descargas automáticas ni consultas externas."
].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");
console.log(md);
