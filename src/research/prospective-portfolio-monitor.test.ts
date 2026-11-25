import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {createProspectivePortfolioManifest,validateProspectivePortfolioManifest,summarizeProspectivePortfolio} from "./prospective-portfolio-monitor";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";

const catalog=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0,1],absenceThresholds:[1],poolMethods:["frequency"],poolSizes:[2,3],windows:[20]});
const manifest=createProspectivePortfolioManifest(catalog,{createdAt:"2026-11-25T12:00:00.000Z",firstTargetDrawId:9001,size:2,blockSize:2});
function forecast(candidateId:string,targetDrawId:number,forecastId:string):FrozenForecast{
 return{schemaVersion:1,forecastId,candidateId,family:catalog.find(c=>c.id===candidateId)!.family,frozenConfig:manifest.candidateConfigs[candidateId],targetDrawId,generatedAt:"2026-11-25T12:00:00.000Z",historyThroughDrawId:targetDrawId-1,historySha256:"a".repeat(64),prediction:["1"],baseline:["2"]};
}
function result(f:FrozenForecast,candidateHit:boolean,baselineHit:boolean):ResolvedForecast{
 return{...f,resolvedAt:"2026-11-25T13:00:00.000Z",actual:"1",candidateHit,baselineHit};
}

test("prospective portfolio manifest freezes membership and config fingerprints",()=>{
 validateProspectivePortfolioManifest(manifest,catalog);
 assert.equal(manifest.candidateIds.length,2);
 const changed={...catalog[0],frozenConfig:"{}"};
 assert.throws(()=>validateProspectivePortfolioManifest(manifest,[changed,...catalog.slice(1)]),/config changed/);
 assert.throws(()=>validateProspectivePortfolioManifest({...manifest,candidateIds:[manifest.candidateIds[0],manifest.candidateIds[0]]},catalog),/unique/);
});

test("prospective monitor counts missing forecasts, pending results and paired outcomes separately",()=>{
 const ids=manifest.candidateIds;
 const f1=forecast(ids[0],9001,"f1"),f2=forecast(ids[1],9001,"f2"),f3=forecast(ids[0],9002,"f3"),f4=forecast(ids[1],9002,"f4");
 const forecasts=[f1,f2,f3,f4],results=[result(f1,true,false),result(f2,false,true),result(f3,true,true)];
 const summary=summarizeProspectivePortfolio(manifest,forecasts,results,9002);
 assert.equal(summary.forecastedSignals,4);
 assert.equal(summary.resolvedSignals,3);
 assert.equal(summary.pendingSignals,1);
 assert.equal(summary.unforecastedSignals,0);
 assert.equal(summary.hits,2);
 assert.equal(summary.baselineHits,2);
 assert.equal(summary.coverage,3/4);
 assert.equal(summary.blocks.length,1);
 assert.equal(summary.blocks[0].expectedSignals,4);
 assert.equal(summary.blocks[0].partial,true);
});

test("prospective monitor exposes missed contests as zero coverage opportunities",()=>{
 const id=manifest.candidateIds[0],f=forecast(id,9001,"f1");
 const summary=summarizeProspectivePortfolio(manifest,[f],[result(f,true,false)],9003);
 assert.equal(summary.blocks.length,2);
 assert.equal(summary.blocks[0].resolvedSignals,1);
 assert.equal(summary.blocks[0].expectedSignals,4);
 assert.equal(summary.blocks[0].unforecastedSignals,3);
 assert.equal(summary.blocks[1].resolvedSignals,0);
 assert.equal(summary.blocks[1].coverage,0);
 assert.equal(summary.unforecastedSignals,5);
});

test("prospective monitor rejects duplicate or mismatched ledger rows",()=>{
 const id=manifest.candidateIds[0],f=forecast(id,9001,"f1");
 assert.throws(()=>summarizeProspectivePortfolio(manifest,[f,f],[result(f,true,false)],9001),/duplicate candidate forecast/);
 assert.throws(()=>summarizeProspectivePortfolio(manifest,[f],[{...result(f,true,false),forecastId:"wrong"}],9001),/no matching/);
});
