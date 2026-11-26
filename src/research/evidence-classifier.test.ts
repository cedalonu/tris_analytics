import {test} from "node:test";import {strict as assert} from "node:assert";
import {classifyEvidence,EVIDENCE_MIN_RESOLVED} from "./evidence-classifier";
const base={key:"k",resolved:40,pairedDifference:0.1,stabilityStatus:"consistently-positive",sensitivityConclusion:"robust-positive",integrity:"clean",coverageRate:0.9};
test("evidence classifier requires minimum support",()=>{assert.equal(classifyEvidence({...base,resolved:EVIDENCE_MIN_RESOLVED-1}).classification,"insufficient");});
test("favorable observed requires concordant robust signals",()=>{assert.equal(classifyEvidence(base).classification,"favorable-observed");});
test("mixed stability or parameter sensitivity is contradictory",()=>{assert.equal(classifyEvidence({...base,stabilityStatus:"mixed-direction"}).classification,"contradictory");assert.equal(classifyEvidence({...base,sensitivityConclusion:"parameter-sensitive"}).classification,"contradictory");});
test("clean robust no-edge is neutral",()=>{assert.equal(classifyEvidence({...base,pairedDifference:0,stabilityStatus:"no-directional-edge",sensitivityConclusion:"robust-no-edge"}).classification,"neutral");});
test("negative concordance is unfavorable observed",()=>{assert.equal(classifyEvidence({...base,pairedDifference:-0.1,stabilityStatus:"consistently-negative",sensitivityConclusion:"robust-negative"}).classification,"unfavorable-observed");});
test("ledger warnings block directional conclusion",()=>{assert.equal(classifyEvidence({...base,integrity:"warnings"}).classification,"insufficient");});
