#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {analyzeHistoricalRegimeComparison} from "../src/research/historical-regime-comparison";
const [input,firstArg,lastArg,minArg]=process.argv.slice(2);
if(!input||!firstArg||!lastArg){console.error("Usage: npm run research:historical-regime-comparison -- <local-Tris.csv> <firstTargetDrawId> <lastTargetDrawId> [minimumSupport=30]");process.exit(2);}
const csv=await readFile(resolve(input),"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
if(imported.validation.warnings.some(x=>x.startsWith("draw gap "))){console.error("CSV contains contest gaps; analysis blocked.");process.exit(1);}
const report=analyzeHistoricalRegimeComparison(imported.validation.valid,Number(firstArg),Number(lastArg),{minimumSupport:minArg?Number(minArg):30});
const sourceSha256=createHash("sha256").update(csv,"utf8").digest("hex"),out=resolve("reports/historical-regime-comparison");await mkdir(out,{recursive:true});
const full={generatedAt:new Date().toISOString(),source:basename(resolve(input)),sourceSha256,...report};
await writeFile(resolve(out,"latest.json"),JSON.stringify(full,null,2)+"\n");
const lines=["# Fase 112 — Comparación de regímenes históricos TRIS","","- Fuente: "+basename(resolve(input)),"- SHA-256: "+sourceSha256,"- Concursos etiquetados: "+report.summary.labeledDraws,"- Regímenes distintos: "+report.summary.regimes,"- Episodios: "+report.summary.episodes,"- Transiciones: "+report.summary.transitions,"","## Distribución de regímenes","| Régimen | Concursos | Proporción |","|---|---:|---:|",...report.regimeCounts.map(x=>"| "+x.regimeId+" | "+x.n+" | "+(x.share*100).toFixed(1)+"% |"),"","## Episodios","| # | Régimen | Inicio | Fin | N | Tipo |","|---:|---|---:|---:|---:|---|",...report.episodes.map(x=>"| "+x.episode+" | "+x.regimeId+" | "+x.startDrawId+" | "+x.endDrawId+" | "+x.length+" | "+x.status+" |"),"","## Cambios posicionales entre regímenes","| Régimen A | Régimen B | Posición | JS distancia | Δ entropía | Clasificación |","|---|---|---:|---:|---:|---|",...report.contrasts.contrasts.map(x=>"| "+x.firstRegimeId+" | "+x.secondRegimeId+" | "+x.position+" | "+(x.jensenShannonDistance?.toFixed(3)??"n/d")+" | "+(x.entropyDifferenceBits?.toFixed(3)??"n/d")+" | "+x.classification+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");console.log("Historical regime comparison written to "+out);
