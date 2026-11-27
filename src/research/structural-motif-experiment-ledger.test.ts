import test from "node:test";
import assert from "node:assert/strict";
import {summarizeExperimentLedger,type ExperimentRecord} from "./structural-motif-experiment-ledger";
const record=(runId:string,capturedAt:string,status:"complete"|"incomplete"="complete",fingerprint="abc"):ExperimentRecord=>({schema:"tris-experiment-record-v1",runId,capturedAt,gitRef:"research-core-v1",gitCommit:null,status,phaseRange:"94–101",artifacts:[],missing:[],reproducibilityStatus:"reproducible",contentFingerprint:fingerprint});
test("ledger sorts chronologically and retains all events",()=>{const r=summarizeExperimentLedger([record("b","2026-02-02"),record("a","2026-02-01")]);assert.deepEqual(r.records.map(x=>x.runId),["a","b"]);assert.equal(r.summary.runs,2);});
test("identical fingerprints remain separate executions",()=>{const r=summarizeExperimentLedger([record("a","2026-02-01"),record("b","2026-02-02")]);assert.equal(r.summary.runs,2);assert.equal(r.summary.uniqueFingerprints,1);});
test("incomplete experiments remain visible and counted",()=>{const r=summarizeExperimentLedger([record("a","2026-02-01","incomplete")]);assert.equal(r.summary.incomplete,1);assert.equal(r.records[0].status,"incomplete");});
test("empty ledger returns explicit empty summary",()=>{const r=summarizeExperimentLedger([]);assert.equal(r.summary.runs,0);assert.equal(r.summary.firstCapturedAt,null);assert.equal(r.summary.lastCapturedAt,null);});
