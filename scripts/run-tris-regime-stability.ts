#!/usr/bin/env tsx
/** Offline descriptive regime stability report from an existing past-only labels ledger. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import type {ProspectiveRegimeLabel} from "../src/research/prospective-regime-persistence";
import {stabilizePastOnlyRegimes} from "../src/research/regime-transition-stability";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
const labels=(await readFile(resolve(dir,"regime-labels.jsonl"),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as ProspectiveRegimeLabel);
const report=stabilizePastOnlyRegimes(labels,{minConsecutive:Number(process.env.TRIS_REGIME_MIN_CONSECUTIVE??3)});
const out=resolve(dir,"regime-stability");await mkdir(out,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt,report},null,2)+"\n","utf8");
const md=["# TRIS — estabilidad temporal de regímenes","","- Concursos etiquetados: "+report.points.length,"- Racha mínima de confirmación: "+report.minConsecutive,"- Transiciones observadas: "+report.transitions,"- Transiciones confirmadas: "+report.confirmedTransitions,"- Episodios transitorios: "+report.transientEpisodes,"","## Episodios","| # | Régimen | Inicio | Fin | Longitud | Estado | Confirmado en |","|---:|---|---:|---:|---:|---|---:|",...report.episodes.map(e=>"| "+e.episodeIndex+" | "+e.regimeId+" | "+e.startDrawId+" | "+e.endDrawId+" | "+e.length+" | "+e.status+" | "+(e.confirmedAtDrawId??"n/d")+" |"),"","## Asignación online","| Concurso | Régimen observado | Estado | Racha | Régimen efectivo |","|---:|---|---|---:|---|",...report.points.map(p=>"| "+p.drawId+" | "+p.rawRegimeId+" | "+p.status+" | "+p.consecutiveCount+" | "+p.effectiveRegimeId+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x),"","Reporte descriptivo. Las primeras etiquetas de una transición no se reasignan retroactivamente."].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
