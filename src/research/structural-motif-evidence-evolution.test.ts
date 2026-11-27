import {strict as assert} from "node:assert";
import {test} from "node:test";
import {analyzeEvidenceEvolution} from "./structural-motif-evidence-evolution";
const phases=[95,96,97,98] as const;
const good={95:"holdout-positive-and-most-training-blocks-positive",96:"interval-above-zero",97:"robust-positive-across-block-sizes",98:"consistent-retrospective-support"};
function make(labels:Record<number,string|null>[],contexts?:string[]){
 const records:any[]=[]; const files:any={};
 labels.forEach((set,i)=>{
  const runId="r"+i; const context=contexts?.[i]??"same";
  const artifacts=phases.map(phase=>({phase,kind:"json",sourcePath:"p"+phase+".json",snapshotPath:"records/"+runId+"/p"+phase+".json"}));
  records.push({schema:"tris-experiment-record-v1",runId,capturedAt:"2026-01-0"+(i+1)+"T00:00:00Z",artifacts});
  files[runId]={};
  for(const phase of phases){
   const collection=phase<=96?"metrics":"groups";
   const field=phase<=96?"interpretation":phase===97?"conclusion":"classification";
   const row:any={family:"F",position:0}; row[field]=set[phase]??null;
   files[runId]["p"+phase+".json"]=JSON.stringify({method:"m",settings:{context},environment:{},[collection]:[row]});
  }
 });
 return {records,files};
}
test("detects favorable-to-other transition",()=>{const x=make([good,good,{...good,95:"mixed-or-fragile"}]);const r=analyzeEvidenceEvolution(x.records,x.files);assert.equal(r.groups[0].transitions.find(t=>t.phase===95)?.kind,"favorable-to-other");assert.equal(r.summary.favorableToOther,1);});
test("detects other-to-favorable transition",()=>{const x=make([{...good,96:"interval-includes-zero"},good,good]);const r=analyzeEvidenceEvolution(x.records,x.files);assert.equal(r.summary.otherToFavorable,1);});
test("finds cross-phase disagreement without conflating labels",()=>{const x=make([good,{...good,98:"mixed-evidence"},good]);const r=analyzeEvidenceEvolution(x.records,x.files);assert.ok(r.groups[0].conflicts.length>0);});
test("flags context changes on transitions",()=>{const x=make([good,good,good],["a","b","b"]);const r=analyzeEvidenceEvolution(x.records,x.files);assert.ok(r.summary.contextChanges>0);});
test("missing snapshots create unknown gaps, not label transitions",()=>{const x=make([good,good,good]);delete x.files.r1["p95.json"];const r=analyzeEvidenceEvolution(x.records,x.files);assert.ok(r.summary.unknownGaps>0);});
test("no files means no invented groups",()=>{const x=make([good,good,good]);const r=analyzeEvidenceEvolution(x.records,{});assert.equal(r.groups.length,0);assert.equal(r.status,"insufficient");});
