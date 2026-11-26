import {test} from "node:test";
import {strict as assert} from "node:assert";
import type {Draw} from "../research-core";
import {buildPool} from "../research-core";
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
test("incremental rankings match the direct buildPool reference",()=>{
 const stability=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 const methods=["frequency","long-absence"] as const,sizes=[3];
 const report=analyzePositionalPoolConcordance(draws,labels,stability,{methods:[...methods],poolSizes:sizes,minimumHistory:10});
 for(const row of report.blocks){
  const profile=stability.regimes.find(x=>x.regimeId===row.regimeId&&x.position===row.position+1)!;
  const block=profile.blocks.find(x=>x.blockIndex===row.blockIndex)!;
  const targets=draws.filter(d=>d.drawId>=block.startDrawId&&d.drawId<=block.endDrawId&&labels.some(l=>l.drawId===d.drawId&&l.regimeId===row.regimeId));
  let hits=0,included=0,jaccard=0,jaccardN=0,previous:Set<number>|null=null,tested=0;
  for(const target of targets){
   const index=draws.findIndex(d=>d.drawId===target.drawId);
   if(index<10)continue;
   const pool=buildPool(draws.slice(0,index).map(d=>d.digits[row.position]),row.method,row.poolSize);
   tested++;
   if(pool.includes(target.digits[row.position]))hits++;
   if(pool.includes(row.positionalDominantDigit!))included++;
   const current=new Set(pool);
   if(previous){const union=new Set([...previous,...current]),intersection=[...previous].filter(d=>current.has(d)).length;jaccard+=union.size?intersection/union.size:1;jaccardN++;}
   previous=current;
  }
  assert.equal(row.tested,tested);
  assert.equal(row.poolHits,hits);
  assert.equal(row.dominantDigitPoolInclusionRate,tested?included/tested:null);
  assert.equal(row.poolHitRate,tested?hits/tested:null);
  assert.equal(row.meanPoolJaccard,jaccardN?jaccard/jaccardN:null);
  assert.equal(row.poolTurnover,jaccardN?1-jaccard/jaccardN:null);
 }
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
