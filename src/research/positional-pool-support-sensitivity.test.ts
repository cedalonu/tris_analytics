import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolSupportSensitivity} from "./positional-pool-support-sensitivity";
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
function fixture(){const draws:Draw[]=[],labels:ProspectiveRegimeLabel[]=[];for(let i=0;i<180;i++){const drawId=i+31;draws.push({drawId,digits:[0,1,2,3,4].map(p=>(i*(p+3)+Math.floor(i/(p+2))+p)%10) as Draw["digits"]});labels.push({drawId,regimeId:"A",method:"test-past-only",sourceStartDrawId:drawId-30,sourceEndDrawId:drawId-1});}return{draws,labels};}
test("evaluates the complete predeclared history-support grid",()=>{const{draws,labels}=fixture(),r=analyzePositionalPoolSupportSensitivity(draws,labels,{minimumHistories:[10,20],minimumDrawSupports:[5,10],methods:["frequency"],poolSizes:[3]});assert.equal(r.summary.length,4);assert.deepEqual(r.minimumHistories,[10,20]);assert.deepEqual(r.minimumDrawSupports,[5,10]);});
test("rejects invalid support thresholds",()=>{const{draws,labels}=fixture();assert.throws(()=>analyzePositionalPoolSupportSensitivity(draws,labels,{minimumDrawSupports:[26]}));});
