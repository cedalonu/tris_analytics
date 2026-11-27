import test from "node:test";
import assert from "node:assert/strict";
import {compareExperimentSnapshots} from "./structural-motif-experiment-snapshot-comparison";
import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
const phases=[94,95,96,97,98,99,101];
const record=(runId:string):ExperimentRecord=>({schema:"tris-experiment-record-v1",runId,capturedAt:runId==="a"?"2026-01-01":"2026-01-02",gitRef:null,gitCommit:null,status:"complete",phaseRange:"94–101",artifacts:phases.map(phase=>({phase,kind:"json",sourcePath:"phase"+phase+".json",snapshotPath:"records/"+runId+"/artifacts/"+phase+"/json.json",sha256:"x",bytes:1,available:true})),missing:[],reproducibilityStatus:null,contentFingerprint:"x"});
const docs=(change=false)=>({
 "phase94.json":JSON.stringify({method:"m94",rows:[{targetDrawId:1,family:"A",position:0,structuralHit:true,randomMean:.2+(change?.1:0)}]}),
 "phase95.json":JSON.stringify({method:"m95",settings:{blocks:4},metrics:[{family:"A",position:0,holdout:{deltaVsRandom:.1+(change?.1:0)}}]}),
 "phase96.json":JSON.stringify({method:"m96",settings:{blockSize:3},metrics:[{family:"A",position:0,bootstrap:{q025:.01,q975:.2}}]}),
 "phase97.json":JSON.stringify({method:"m97",settings:{seed:1},groups:[{family:"A",position:0,conclusion:change?"sensitive-to-block-size":"robust-positive-across-block-sizes"}]}),
 "phase98.json":JSON.stringify({method:"m98",groups:[{family:"A",position:0,classification:"mixed-evidence"}]}),
 "phase99.json":JSON.stringify({method:"m99",summary:{status:"passed"},provenance:{phase94Sha256:change?"new":"old"}}),
 "phase101.json":JSON.stringify({method:"m101",environment:{node:"v"},phases:[{phase:94,method:"m94",settings:{seed:1},inputFiles:[{path:"input.csv",sha256:change?"new":"old"}],outputHashes:{json:"out",markdown:"md"}}]})
});
const keyed=(x:Record<string,string>)=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k.replace("phase","reports/phase").replace(".json",".json"),v]));
test("identical snapshots produce no deltas",()=>{const r=compareExperimentSnapshots(record("a"),record("b"),keyed(docs()),keyed(docs()));assert.equal(r.status,"comparable");assert.equal(r.deltas.length,0);assert.equal(r.summary.comparedPhases,7);});
test("source rows and input hashes are classified as source-data changes",()=>{const r=compareExperimentSnapshots(record("a"),record("b"),keyed(docs()),keyed(docs(true)));assert.ok(r.deltas.some(x=>x.phase===94&&x.category==="source-data"));assert.ok(r.deltas.some(x=>x.phase===101&&x.field==="inputFiles"&&x.category==="source-data"));});
test("settings and results are separated",()=>{const a=docs(),b=docs();b["phase95.json"]=b["phase95.json"].replace('"blocks":4','"blocks":5');b["phase96.json"]=b["phase96.json"].replace('"q025":0.01','"q025":0.02');const r=compareExperimentSnapshots(record("a"),record("b"),keyed(a),keyed(b));assert.ok(r.deltas.some(x=>x.category==="parameters"));assert.ok(r.deltas.some(x=>x.category==="results"));});
test("missing snapshot leaves comparison incomplete",()=>{const a=keyed(docs()),b=keyed(docs());delete b["reports/phase96.json"];const r=compareExperimentSnapshots(record("a"),record("b"),a,b);assert.equal(r.status,"incomplete");assert.equal(r.summary.missingFiles,1);});
test("method changes are not confused with result deltas",()=>{const a=docs(),b=docs();b["phase95.json"]=b["phase95.json"].replace('"m95"','"m95-new"');const r=compareExperimentSnapshots(record("a"),record("b"),keyed(a),keyed(b));assert.ok(r.deltas.some(x=>x.category==="method"));});
