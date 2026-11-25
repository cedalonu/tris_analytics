#!/usr/bin/env tsx
/** Rebuild position/context memory from the append-only prospective outcomes ledger. */
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {analyzePositionContextMemory} from "../src/research/position-context-memory";
import type {ResolvedCycleSignal} from "../src/research/cycle-learning";
const dir=resolve(process.argv[2]??"data/cycles");
const source=resolve(dir,"outcomes.jsonl");
const raw=await readFile(source,"utf8");
const rows=raw.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as ResolvedCycleSignal);
const report=analyzePositionContextMemory(rows),stamp=new Date().toISOString();
await writeFile(resolve(dir,"position-context-memory.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(n:number)=>(100*n).toFixed(1)+"%";
const lines=[
 "# TRIS position and context memory","",
 "- Generated: "+stamp,
 "- Resolved outcomes: "+report.resolvedOutcomes,
 "- Position-specific trials: "+report.positionSpecificTrials,
 "- Full-result mode trials (separate): "+report.modeLevelTrials,
 "- Unique-contest minimum for summary: "+report.minimumDrawsForSummary,
 "- Chronological block size: "+report.blockSize,"",
 "## Position × family × previous-draw context",
 "| Position | Family | Configuration | Prior pool | Prior duplicates | Unique contests | Candidate trials | Mean candidate coverage | Paired baseline | Difference | Positive blocks | Negative blocks |",
 "|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|",
 ...report.positions.map(x=>"| R"+(x.position+1)+" | "+x.family+" | `"+x.configuration+"` | "+x.poolRegime+" | "+x.duplicateRegime+" | "+x.draws+" | "+x.candidateTrials+" | "+pct(x.meanCandidateHitRate)+" | "+pct(x.meanBaselineHitRate)+" | "+(100*x.difference).toFixed(1)+" pp | "+x.positiveBlocks+" | "+x.negativeBlocks+" |"),
 "","## Full-result transition modes (not assigned to a single position)",
 "| Mode | Unique contests | Candidate trials | Mean candidate coverage | Paired baseline | Difference |",
 "|---|---:|---:|---:|---:|---:|",
 ...report.modeScopes.map(x=>"| "+x.mode+" | "+x.draws+" | "+x.candidateTrials+" | "+pct(x.meanCandidateHitRate)+" | "+pct(x.meanBaselineHitRate)+" | "+(100*x.difference).toFixed(1)+" pp |"),
 "","## Interpretation limits",...report.warnings.map(x=>"- "+x),
 "","Source: append-only local outcomes ledger; no API or external download."
].join("\n")+"\n";
await writeFile(resolve(dir,"position-context-memory.md"),lines,"utf8");
console.log("Position/context memory rebuilt from "+rows.length+" resolved signal outcomes.");
