#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import type {PositionalPoolConcordanceReport} from "../src/research/positional-pool-concordance";
import {analyzePositionalPoolTemporalSplit} from "../src/research/positional-pool-temporal-split";
const inputPath=resolve(process.argv[2]??"data/prospective-portfolio/regime-analysis/latest.json");
const raw=JSON.parse(await readFile(inputPath,"utf8")) as {positionalPoolConcordance?:PositionalPoolConcordanceReport};
if(!raw.positionalPoolConcordance||!Array.isArray(raw.positionalPoolConcordance.blocks))throw new Error("input must contain positionalPoolConcordance.blocks; run research:regime-analysis first");
const report=analyzePositionalPoolTemporalSplit(raw.positionalPoolConcordance.blocks,{
 minimumPairsPerHalf:Number(process.env.TRIS_POSITIONAL_POOL_SPLIT_MIN_PAIRS??3),
 minimumAbsoluteCorrelation:Number(process.env.TRIS_POSITIONAL_POOL_SPLIT_MIN_CORRELATION??.3)
});
const dir=resolve("reports/positional-pool-temporal-split");await mkdir(dir,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt,inputPath,...report},null,2)+"\n","utf8");
const md=["# Fase 35 — robustez por división cronológica","",
"- Entrada: "+inputPath,
"- Regla: primera mitad cronológica = descubrimiento; segunda mitad = validación descriptiva",
"- Métricas evaluadas: "+report.evaluatedMetrics,
"- Métricas con soporte insuficiente: "+report.insufficientMetrics,"",
"| Régimen | Posición | Método | Pool | Métrica | Estado | N descubrimiento | N validación | Correlación descubrimiento | Correlación validación | Cambio |",
"|---|---:|---|---:|---|---|---:|---:|---:|---:|---:|",
...report.groups.flatMap(g=>g.metrics.map(m=>"| "+g.regimeId+" | R"+(g.position+1)+" | "+g.method+" | "+g.poolSize+" | "+m.metric+" | "+m.status+" | "+m.discoveryBlocks+" | "+m.validationBlocks+" | "+(m.discoveryCorrelation?.toFixed(3)??"n/d")+" | "+(m.validationCorrelation?.toFixed(3)??"n/d")+" | "+(m.correlationChange?.toFixed(3)??"n/d")+" |")),"",
"## Interpretación",
"- same-direction-both-periods: la asociación supera el umbral descriptivo en ambas mitades y conserva el signo.",
"- discovery-only: la asociación aparece en la primera mitad, pero no alcanza el umbral en validación.",
"- validation-only: no aparece con ese umbral en descubrimiento y sí en validación.",
"- opposite-directions: ambas mitades superan el umbral, pero con signos opuestos.",
"- below-descriptive-threshold-both: ninguna mitad supera el umbral.",
"- insufficient-support: alguna mitad no alcanza el soporte mínimo o la correlación no se puede calcular.",
"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
