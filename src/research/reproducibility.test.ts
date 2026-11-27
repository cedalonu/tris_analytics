import test from "node:test";import assert from "node:assert/strict";
import {buildReproducibilityManifest,buildReproducibilityBundle} from "./reproducibility";
import type {ConsolidatedDiagnostics} from "./consolidated-diagnostics";
const records=[{candidateKey:"b",history:[{recordedAt:"2024-02-01",classification:"neutral",resolved:8}]},{candidateKey:"a",history:[{recordedAt:"2024-01-01",classification:"favorable-observed",resolved:12}]}];
const diag={rows:[],summary:{total:2,ok:1,review:0,issues:0,insufficient:1}} as unknown as ConsolidatedDiagnostics;
test("manifest is deterministic",()=>assert.deepEqual(buildReproducibilityManifest(records,{minimumQuality:75,minimumRevisions:3},diag),buildReproducibilityManifest(records,{minimumQuality:75,minimumRevisions:3},diag)));
test("canonicalizes input order",()=>{const a=buildReproducibilityManifest(records,{minimumQuality:75,minimumRevisions:3},diag),b=buildReproducibilityManifest([...records].reverse(),{minimumQuality:75,minimumRevisions:3},diag);assert.equal(a.snapshotFingerprint,b.snapshotFingerprint);});
test("changes fingerprint for data and config changes",()=>{const base=buildReproducibilityManifest(records,{minimumQuality:75,minimumRevisions:3},diag),changed=buildReproducibilityManifest([{...records[0],history:[{...records[0].history[0],resolved:9}]},records[1]],{minimumQuality:75,minimumRevisions:3},diag),cfg=buildReproducibilityManifest(records,{minimumQuality:85,minimumRevisions:3},diag);assert.notEqual(changed.snapshotFingerprint,base.snapshotFingerprint);assert.notEqual(cfg.snapshotFingerprint,base.snapshotFingerprint);});
test("bundle carries normalized snapshots",()=>assert.equal(buildReproducibilityBundle(records,{minimumQuality:75,minimumRevisions:3},diag).snapshots.length,2));
