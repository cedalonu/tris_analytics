import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolScaleSensitivity} from "./positional-pool-scale-sensitivity";
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
function fixture(n=180):{draws:Draw[];labels:ProspectiveRegimeLabel[]}{
 const draws:Draw[]=[],labels:ProspectiveRegimeLabel[]=[];
 for(let i=0;i<n;i++){const digits=[0,1,2,3,4].map(p=>(i*(p+3)+Math.floor(i/(p+2))+p)%10) as Draw["digits"];const drawId=i+31;draws.push({drawId,digits});labels.push({drawId,regimeId:"A",method:"test-past-only",sourceStartDrawId:drawId-30,sourceEndDrawId:drawId-1});}
 return{draws,labels};
}
test("rebuilds all declared block scales and is deterministic",()=>{const{draws,labels}=fixture();const opts={blockSizes:[10,20],minimumDrawSupport:5,minimumHistory:10,methods:["frequency" as const],poolSizes:[3]};const a=analyzePositionalPoolScaleSensitivity(draws,labels,opts);assert.deepEqual(a,analyzePositionalPoolScaleSensitivity(draws,labels,opts));assert.deepEqual(a.blockSizes,[10,20]);assert.ok(a.groups.length>0);assert.ok(a.groups.every(g=>g.scales.length===2));});
test("rejects duplicate and invalid scales",()=>{const{draws,labels}=fixture();assert.throws(()=>analyzePositionalPoolScaleSensitivity(draws,labels,{blockSizes:[10,10]}));assert.throws(()=>analyzePositionalPoolScaleSensitivity(draws,labels,{blockSizes:[5],minimumDrawSupport:10}));});
test("does not mutate supplied chronological data",()=>{const{draws,labels}=fixture(),before=JSON.stringify({draws,labels});analyzePositionalPoolScaleSensitivity(draws,labels,{blockSizes:[10,20],minimumDrawSupport:5,minimumHistory:10,methods:["frequency"],poolSizes:[3]});assert.equal(JSON.stringify({draws,labels}),before);});
