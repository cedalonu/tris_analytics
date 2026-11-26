import {test} from "node:test";
import {strict as assert} from "node:assert";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

const draws:Draw[]=Array.from({length:61},(_,i)=>({drawId:100+i,digits:
  i===0?[0,0,0,0,0]:[...Array(5)].map((_,p)=>i<=30?3:(Math.floor((i-1)/10)%2===0?1:8))}));
const labels:ProspectiveRegimeLabel[]=draws.slice(1).map(d=>({
 drawId:d.drawId,regimeId:d.drawId<=130?"A":"B",method:"past-only-test",
 sourceStartDrawId:d.drawId-1,sourceEndDrawId:d.drawId-1
}));
test("detects stable dominant digit across supported fixed blocks",()=>{
 const report=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 const a=report.regimes.find(x=>x.regimeId==="A"&&x.position===1)!;
 assert.equal(a.supportedBlocks,3);
 assert.equal(a.dominantConsistency,1);
 assert.equal(a.interpretation,"stable-dominant");
 assert.equal(a.blocks[0].dominantDigit,3);
});
test("reports changing block dominance without calling it predictive",()=>{
 const report=summarizePositionalRegimeStability(draws,labels,{blockSize:10,minimumDrawSupport:5});
 const b=report.regimes.find(x=>x.regimeId==="B"&&x.position===1)!;
 assert.equal(b.supportedBlocks,3);
 assert.ok(b.dominantConsistency<1);
 assert.equal(b.interpretation,"variable-dominance");
 assert.ok(report.limitations.some(x=>x.includes("no demuestra sesgo físico")));
});
test("keeps underpowered blocks separate and validates input",()=>{
 const report=summarizePositionalRegimeStability(draws,labels,{blockSize:25,minimumDrawSupport:20});
 assert.ok(report.regimes.some(x=>x.underpoweredBlocks>0));
 assert.throws(()=>summarizePositionalRegimeStability(draws,labels,{blockSize:2,minimumDrawSupport:3}),/minimumDrawSupport/);
 assert.throws(()=>summarizePositionalRegimeStability(draws,[{...labels[0],sourceEndDrawId:labels[0].drawId}],{blockSize:10,minimumDrawSupport:3}),/strictly pre-target/);
});
