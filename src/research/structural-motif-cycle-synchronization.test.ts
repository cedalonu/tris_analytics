import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMotifCycleSynchronization } from "./structural-motif-cycle-synchronization";
import type { MotifWindow, TriadType } from "./structural-motifs";

function windows(sequences: Array<{ key: string; members: [string,string,string]; types: Array<TriadType|null> }>): MotifWindow[] {
  const length = sequences[0]?.types.length ?? 0;
  return Array.from({length},(_,index)=>{
    const motifs = sequences.flatMap(item => item.types[index] ? [{key:item.key,members:item.members,type:item.types[index]!}] : []);
    return {index,startDate:"",endDate:"",packageCount:9,nodes:3,edges:0,motifs,counts:{empty:0,"single-edge":0,wedge:0,triangle:0},rates:{empty:0,"single-edge":0,wedge:0,triangle:0}};
  });
}
test("finds aligned cycles with same period and rotation-equivalent sequence",()=>{
 const input=windows([
  {key:"A::B::C",members:["A","B","C"],types:["wedge","triangle","wedge","triangle"]},
  {key:"D::E::F",members:["D","E","F"],types:["triangle","wedge","triangle","wedge"]}
 ]);
 const result=analyzeMotifCycleSynchronization(input);
 assert.equal(result.pairs.length,1);
 assert.equal(result.pairs[0].samePeriod,true);
 assert.equal(result.pairs[0].sameSequenceUpToRotation,true);
 assert.equal(result.pairs[0].classification,"alineada");
});
test("reports partial synchronization when cycles overlap but differ in period",()=>{
 const input=windows([
  {key:"A::B::C",members:["A","B","C"],types:["wedge","triangle","wedge","triangle","wedge","triangle"]},
  {key:"D::E::F",members:["D","E","F"],types:["triangle","wedge","single-edge","triangle","wedge","single-edge"]}
 ]);
 const result=analyzeMotifCycleSynchronization(input);
 assert.equal(result.pairs.length,1);
 assert.equal(result.pairs[0].samePeriod,false);
 assert.equal(result.pairs[0].classification,"parcial");
});
test("does not pair a cycle with itself or non-overlapping cycles",()=>{
 const input=windows([
  {key:"A::B::C",members:["A","B","C"],types:["wedge","triangle","wedge","triangle",null,null]},
  {key:"D::E::F",members:["D","E","F"],types:[null,null,"triangle","wedge","triangle","wedge"]}
 ]);
 const result=analyzeMotifCycleSynchronization(input);
 assert.equal(result.pairs.length,1);
 assert.notEqual(result.pairs[0].left.key,result.pairs[0].right.key);
});
test("returns zeroed summary for empty windows",()=>{
 const result=analyzeMotifCycleSynchronization([]);
 assert.equal(result.summary.pairedCycles,0);
 assert.equal(result.summary.meanSynchronization,0);
});
