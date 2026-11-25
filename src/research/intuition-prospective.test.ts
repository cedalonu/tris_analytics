import test from "node:test";
import assert from "node:assert/strict";
import type { Draw } from "../research-core";
import { generateIntuitionCandidates } from "./intuition-candidate-generator";
import { freezeProspectiveForecast, resolveProspectiveForecast } from "./intuition-prospective";

const history:Draw[]=Array.from({length:220},(_,i)=>({
 drawId:9000+i,
 digits:[(i%10),((i+1)%10),((i+2)%10),((i+3)%10),((i+4)%10)] as Draw["digits"],
 date:"2026-11-24"
}));
const candidate=(family:"transition"|"position-mutation"|"absence-return"|"pool-ranking",config:Record<string,unknown>)=>({
 id:"candidate-"+family,family,title:"test",description:"test",
 config:{family,...config} as never,
 frozenConfig:JSON.stringify({family,...config})
});

test("catalog includes temporal lags one through five",()=>{
 const catalog=generateIntuitionCandidates({includePools:false});
 const lags=new Set(catalog.filter(c=>c.family==="transition").map(c=>c.config.lag));
 assert.deepEqual([...lags].sort(),[1,2,3,4,5]);
 const mutationLags=new Set(catalog.filter(c=>c.family==="position-mutation").map(c=>c.config.lag));
 assert.deepEqual([...mutationLags].sort(),[1,2,3,4,5]);
});

test("freezes an exact next-contest prediction and resolves without changing it",()=>{
 const c=candidate("transition",{mode:"last4",lag:1});
 const frozen=freezeProspectiveForecast(history,c,9220,"2026-11-25T10:00:00.000Z");
 assert.ok(frozen);
 assert.equal(frozen!.targetDrawId,9220);
 assert.equal(frozen!.historyThroughDrawId,9219);
 const prediction=[...frozen!.prediction];
 const actual:Draw={drawId:9220,digits:[9,0,1,2,3]};
 const resolved=resolveProspectiveForecast(frozen!,actual,history,"2026-11-25T10:05:00.000Z");
 assert.equal(resolved.actual,"90123");
 assert.deepEqual(frozen!.prediction,prediction);
 assert.equal(resolved.candidateHit,true);
});

test("refuses a target other than the next consecutive contest",()=>{
 assert.throws(()=>freezeProspectiveForecast(history,candidate("pool-ranking",{position:0,method:"frequency",poolSize:3,window:50}),9221,"2026-11-25T10:00:00.000Z"),/next consecutive/);
});

test("resolves digit-pool forecasts against the correct position",()=>{
 const c=candidate("pool-ranking",{position:4,method:"frequency",poolSize:10,window:50});
 const frozen=freezeProspectiveForecast(history,c,9220,"2026-11-25T10:00:00.000Z");
 assert.ok(frozen);
 const resolved=resolveProspectiveForecast(frozen!,{drawId:9220,digits:[9,8,7,6,5]},history,"2026-11-25T10:01:00.000Z");
 assert.equal(resolved.candidateHit,true);
 assert.equal(resolved.baselineHit,true);
});

test("insufficient conditional transition context is not recorded as a forecast",()=>{
 const c=candidate("transition",{mode:"full5",lag:5});
 const constant:Draw[]=Array.from({length:220},(_,i)=>({drawId:10000+i,digits:[i%10,Math.floor(i/10)%10,Math.floor(i/100)%10,Math.floor(i/1000)%10,Math.floor(i/10000)%10] as Draw["digits"]}));
 const frozen=freezeProspectiveForecast(constant,c,10220,"2026-11-25T10:00:00.000Z");
 assert.equal(frozen,null);
});

test("refuses to resolve if the pre-result history has changed",()=>{
 const c=candidate("pool-ranking",{position:2,method:"frequency",poolSize:4,window:50});
 const frozen=freezeProspectiveForecast(history,c,9220,"2026-11-25T10:00:00.000Z");
 assert.ok(frozen);
 const changed=history.map(d=>({...d,digits:[...d.digits] as Draw["digits"]}));
 changed[10].digits=[9,9,9,9,9];
 assert.throws(()=>resolveProspectiveForecast(frozen!,{drawId:9220,digits:[1,2,3,4,5]},changed,"2026-11-25T10:01:00.000Z"),/history differs/);
});
