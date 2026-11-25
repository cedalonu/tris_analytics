import test from 'node:test';
import assert from 'node:assert/strict';
import {appendEvidence,assessSignal,wilsonLower} from './intuition-ledger';
const base={id:'S1',description:'test candidate',status:'hypothesis' as const,evidence:[],createdAt:'2026-01-01',updatedAt:'2026-01-01'};
test('Wilson lower bound is sensible and handles no sample',()=>{assert.equal(wilsonLower(0,0),0);assert.ok(wilsonLower(70,100)>0.6&&wilsonLower(70,100)<0.7);});
test('exploration does not promote signal',()=>{const r={...base,evidence:[{id:'e1',phase:'exploration' as const,evaluatedAt:'2026-01-02',n:100,hits:90,baselineN:100,baselineHits:50}]};assert.equal(assessSignal(r).status,'hypothesis');});
test('validation evidence may only become provisional',()=>{const r={...base,evidence:[{id:'v1',phase:'validation' as const,evaluatedAt:'2026-01-02',n:200,hits:140,baselineN:200,baselineHits:100,discordantCandidateWins:60,discordantBaselineWins:20,testCount:1}]};assert.equal(assessSignal(r).status,'provisional');});
test('prospective evidence can activate but cannot be skipped',()=>{const r={...base,evidence:[{id:'v1',phase:'validation' as const,evaluatedAt:'2026-01-02',n:200,hits:140,baselineN:200,baselineHits:100,discordantCandidateWins:60,discordantBaselineWins:20,testCount:1},{id:'p1',phase:'prospective' as const,evaluatedAt:'2026-02-02',n:200,hits:140,baselineN:200,baselineHits:100,discordantCandidateWins:60,discordantBaselineWins:20,testCount:1}]};assert.equal(assessSignal(r).status,'active');});
test('evidence append is immutable and validates duplicates',()=>{const e={id:'e1',phase:'exploration' as const,evaluatedAt:'2026-01-02',n:10,hits:5,baselineN:10,baselineHits:4};const r=appendEvidence(base,e);assert.equal(base.evidence.length,0);assert.equal(r.evidence.length,1);assert.throws(()=>appendEvidence(r,e),/already exists/);});
test('rejects impossible hit counts',()=>assert.throws(()=>appendEvidence(base,{id:'bad',phase:'validation',evaluatedAt:'2026-01-02',n:3,hits:4,baselineN:3,baselineHits:1}),/exceed/));

test('validation cannot become provisional without paired significance metadata',()=>{
 const r={...base,evidence:[{id:'v1',phase:'validation' as const,evaluatedAt:'2026-01-02',n:200,hits:140,baselineN:200,baselineHits:100}]};
 assert.notEqual(assessSignal(r).status,'provisional');
});
test('multiple-testing correction blocks weak paired evidence',()=>{
 const r={...base,evidence:[{id:'v1',phase:'validation' as const,evaluatedAt:'2026-01-02',n:200,hits:140,baselineN:200,baselineHits:100,discordantCandidateWins:60,discordantBaselineWins:20,testCount:1000}]};
 assert.notEqual(assessSignal(r).status,'provisional');
});
