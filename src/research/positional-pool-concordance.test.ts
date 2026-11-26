import {test} from "node:test";
import {strict as assert} from "node:assert";
import type {Draw} from "../research-core";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import {analyzePositionalPoolConcordance} from "./positional-pool-concordance";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

const draws:Draw[]=Array.from({length:71},(_,i)=>({drawId:100+i,digits:[i<35?1:(i%2?8:2),2,3,4,5]}));
const labels:ProspectiveRegimeLabel[]=draws.slice(1).map(d=>({drawId:d.drawId,regimeId:"A",method:"fixture",sourceStartDrawId:d.drawId-1,sourceEndDrawId:d.drawId-1}));
test("compares past-only pools with positional dominance by fixed block",()=>{
 const stability=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 const report=analyzePositionalPoolConcordance(draws,labels,stability,{methods:["frequency","long-absence"],poolSizes:[3],minimumHistory:10});
 assert.equal(report.method,"past-only-positional-pool-concordance-v1");
 assert.ok(report.blocks.length>0);
 assert.ok(report.blocks.every(x=>x.uniformReference===.3));
 assert.ok(report.blocks.every(x=>x.tested===0||x.poolHitRate!==null));
 assert.ok(report.groups.some(x=>x.position===0&&x.method==="frequency"));
 assert.ok(report.limitations.some(x=>x.includes("resultado del objetivo nunca participa")));
});
test("rejects labels that use the target draw or duplicate labels",()=>{
 const stability=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 assert.throws(()=>analyzePositionalPoolConcordance(draws,[{...labels[0],sourceEndDrawId:labels[0].drawId}],stability),/strictly past-only/);
 assert.throws(()=>analyzePositionalPoolConcordance(draws,[labels[0],labels[0]],stability),/duplicate regime label/);
});
test("validates method and pool size configuration",()=>{
 const stability=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 assert.throws(()=>analyzePositionalPoolConcordance(draws,labels,stability,{methods:["bogus" as never]}),/valid pool methods/);
 assert.throws(()=>analyzePositionalPoolConcordance(draws,labels,stability,{poolSizes:[11]}),/poolSizes/);
});
