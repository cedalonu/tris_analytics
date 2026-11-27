import test from "node:test";import assert from "node:assert/strict";
import {buildConsolidatedDiagnostics} from "./consolidated-diagnostics";
const hist=(n:number)=>Array.from({length:n},(_,i)=>({candidateKey:"x",recordedAt:new Date(Date.UTC(2021,0,i+1)).toISOString(),classification:"neutral",resolved:i+1}));
test("flags short histories",()=>{const r=buildConsolidatedDiagnostics([{candidateKey:"x",history:hist(1)}]);assert.equal(r.rows[0].status,"INSUFICIENTE");assert.equal(r.summary.insufficient,1);});
test("is deterministic",()=>{const x=[{candidateKey:"x",history:hist(5)}];assert.deepEqual(buildConsolidatedDiagnostics(x),buildConsolidatedDiagnostics(x));});
test("includes integrated module fields",()=>{const r=buildConsolidatedDiagnostics([{candidateKey:"x",history:hist(4)}]).rows[0];for(const k of ["robustness","rankSensitivity","temporal","degradation"])assert.ok(k in r);});
test("detects integrity defects",()=>{const h=hist(3);h[1].recordedAt=h[0].recordedAt;const r=buildConsolidatedDiagnostics([{candidateKey:"x",history:h}]).rows[0];assert.ok(r.findings.includes("Integridad estructural requiere corrección"));assert.ok(["PROBLEMA","REVISAR"].includes(r.status));});
