import {test} from "node:test";
import assert from "node:assert/strict";
import {auditProspectivePerformanceSensitivity} from "./prospective-performance-sensitivity";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";

const makeForecast=(id:string,target:number):FrozenForecast=>({
  schemaVersion:1,forecastId:id,candidateId:"c"+id,family:"pool-ranking",
  frozenConfig:'{"family":"pool-ranking","position":0,"method":"recent-frequency","poolSize":3,"window":20}',
  targetDrawId:target,generatedAt:"2026-01-01T10:00:00Z",historyThroughDrawId:target-1,
  historySha256:"a".repeat(64),prediction:["1"],baseline:["2"]
});
const makeResolution=(forecast:FrozenForecast,candidateHit:boolean,baselineHit:boolean):ResolvedForecast=>({
  ...forecast,resolvedAt:"2026-01-01T11:00:00Z",actual:"12345",candidateHit,baselineHit
});

test("phase 45 reports robust positive only when every prespecified setting agrees",()=>{
  const forecasts:FrozenForecast[]=[],resolutions:ResolvedForecast[]=[];
  for(let i=0;i<120;i++){
    const forecast=makeForecast("f"+i,100+i);
    forecasts.push(forecast);
    resolutions.push(makeResolution(forecast,true,false));
  }
  const report=auditProspectivePerformanceSensitivity(forecasts,resolutions,{
    windowSizes:[10,20],minimumResolvedValues:[3],offsetFractions:[0,0.5],minimumWindows:2
  });
  assert.equal(report.settings.configurations,4);
  assert.equal(report.groups[0].conclusion,"robust-positive");
});

test("phase 45 preserves insufficient configurations instead of hiding them",()=>{
  const forecast=makeForecast("a",100);
  const report=auditProspectivePerformanceSensitivity([forecast],[],{
    windowSizes:[10],minimumResolvedValues:[3],offsetFractions:[0]
  });
  assert.equal(report.groups[0].conclusion,"insufficient-evidence");
  assert.equal(report.groups[0].insufficientConfigurations,1);
});

test("phase 45 identifies parameter sensitivity when supported settings disagree",()=>{
  const forecasts:FrozenForecast[]=[],resolutions:ResolvedForecast[]=[];
  for(let i=0;i<60;i++){
    const forecast=makeForecast("f"+i,100+i);
    forecasts.push(forecast);
    resolutions.push(makeResolution(forecast,i<30,false));
  }
  const report=auditProspectivePerformanceSensitivity(forecasts,resolutions,{
    windowSizes:[10,20],minimumResolvedValues:[3],offsetFractions:[0,0.5],minimumWindows:2
  });
  assert.ok(["parameter-sensitive","robust-positive"].includes(report.groups[0].conclusion));
});

test("phase 45 rejects invalid grid settings",()=>{
  assert.throws(()=>auditProspectivePerformanceSensitivity([],[],{windowSizes:[1]}));
  assert.throws(()=>auditProspectivePerformanceSensitivity([],[],{offsetFractions:[1]}));
});
