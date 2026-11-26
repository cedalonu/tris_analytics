#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import type {PositionalPoolNullControlReport} from "../src/research/positional-pool-null-controls";
import type {PositionalPoolCircularShiftReport} from "../src/research/positional-pool-circular-shift";
import {comparePositionalPoolNullControls} from "../src/research/positional-pool-null-comparison";
const permutationPath=resolve(process.argv[2]??"reports/positional-pool-null-controls/latest.json");
const circularPath=resolve(process.argv[3]??"reports/positional-pool-circular-shift/latest.json");
const [pRaw,cRaw]=await Promise.all([readFile(permutationPath,"utf8"),readFile(circularPath,"utf8")]);
const p=JSON.parse(pRaw) as PositionalPoolNullControlReport;
const c=JSON.parse(cRaw) as PositionalPoolCircularShiftReport;
if(!Array.isArray(p.groups)||!Array.isArray(c.groups))throw new Error("input reports must contain groups arrays; run phases 32 and 33 first");
const report=comparePositionalPoolNullControls(p,c);
const dir=resolve("reports/positional-pool-null-comparison");await mkdir(dir,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt,permutationInput:permutationPath,circularShiftInput:circularPath,...report},null,2)+"\n","utf8");
const md=["# Fase 34 — comparación de controles nulos","",
"- Control de permutación: "+permutationPath,
"- Control de desplazamiento circular: "+circularPath,
"- Métricas comparables: "+report.matchedMetrics,
"- Métricas insuficientes/no emparejadas: "+report.unmatchedMetrics,"",
"| Régimen | Posición | Método | Pool | Métrica | Estado | Soporte perm. | Soporte shift | Corr. observada | Envolvente perm. | Envolvente shift | Cola perm. | Cola shift |",
"|---|---:|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|",
...report.groups.flatMap(g=>g.metrics.map(m=>"| "+g.regimeId+" | R"+(g.position+1)+" | "+g.method+" | "+g.poolSize+" | "+m.metric+" | "+m.status+" | "+(m.supportPermutation??"n/d")+" | "+(m.supportCircularShift??"n/d")+" | "+(m.observedPermutation?.toFixed(3)??"n/d")+" | "+(m.permutationP025?.toFixed(3)??"n/d")+" a "+(m.permutationP975?.toFixed(3)??"n/d")+" | "+(m.circularShiftP025?.toFixed(3)??"n/d")+" a "+(m.circularShiftP975?.toFixed(3)??"n/d")+" | "+(m.permutationTailRate===null?"n/d":(100*m.permutationTailRate).toFixed(2)+"%")+" | "+(m.circularShiftTailRate===null?"n/d":(100*m.circularShiftTailRate).toFixed(2)+"%")+" |")),"",
"## Interpretación",
"- outside-both-reference-envelopes: correlación observada fuera de los intervalos 2.5–97.5 de ambos controles; descripción, no significancia.",
"- outside-permutation-only / outside-circular-shift-only: resultado dependiente del control de referencia.",
"- inside-both-reference-envelopes: correlación dentro de ambos intervalos.",
"- insufficient-or-unmatched: falta grupo, soporte idéntico, correlación coincidente o desplazamiento circular evaluable.",
"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
