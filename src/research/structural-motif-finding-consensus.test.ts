import {strict as assert} from "node:assert";
import {test} from "node:test";
import {analyzeFindingConsensus} from "./structural-motif-finding-consensus";
const phases=[95,96,97,98] as const;
function fixture(labels:Record<number,string>,runId="r1",context="same"){
 const records:any=[{schema:"tris-experiment-record-v1",runId,capturedAt:"2026-01-01T00:00:00Z",artifacts:phases.map(phase=>({phase,kind:"json",sourcePath:`p${phase}.json`,snapshotPath:`records/${runId}/p${phase}.json`}))}];
 const files:any={[runId]:{}};
 for(const phase of phases){const collection=phase<=96?"metrics":"groups",field=phase<=96?"interpretation":phase===97?"conclusion":"classification";
  files[runId][`p${phase}.json`]=JSON.stringify({method:"m",settings:{context},environment:{},[collection]:[{family:"F",position:0,[field]:labels[phase]}]});
 }
 return{records,files};
}
const good={95:"holdout-positive-and-most-training-blocks-positive",96:"interval-above-zero",97:"robust-positive-across-block-sizes",98:"consistent-retrospective-support"};
test("unknown or non-favorable labels remain mixed and literal",()=>{const x=fixture({...good,97:"new-label"});const r=analyzeFindingConsensus(x.records,x.files);assert.equal(r.groups[0].status,"mixed");assert.deepEqual(r.groups[0].unknownLabels,["97:new-label"]);});
test("missing snapshot is insufficient, not favorable",()=>{const x=fixture(good);delete x.files.r1["p96.json"];const r=analyzeFindingConsensus(x.records,x.files);assert.equal(r.groups[0].status,"insufficient");assert.ok(r.groups[0].missing.includes(96));});
test("different declared contexts across phases are flagged",()=>{const x=fixture(good);const doc=JSON.parse(x.files.r1["p98.json"]);doc.settings.context="changed";x.files.r1["p98.json"]=JSON.stringify(doc);const r=analyzeFindingConsensus(x.records,x.files);assert.equal(r.groups[0].status,"context-changed");});
test("does not invent rows when no snapshots are loaded",()=>{const x=fixture(good);const r=analyzeFindingConsensus(x.records,{});assert.equal(r.status,"insufficient");assert.equal(r.groups.length,0);});
test("phase labels are not merged into a common vocabulary",()=>{const x=fixture({...good,95:"mixed-or-fragile"});const r=analyzeFindingConsensus(x.records,x.files);assert.equal(r.groups[0].phase95,"mixed-or-fragile");assert.equal(r.groups[0].status,"mixed");});
test("a group with all known but non-positive evidence is not support",()=>{const x=fixture({95:"no-holdout-advantage-vs-random",96:"interval-includes-zero",97:"sensitive-to-block-size",98:"mixed-evidence"});const r=analyzeFindingConsensus(x.records,x.files);assert.equal(r.groups[0].status,"mixed");assert.equal(r.groups[0].favorable.phase95,false);});
