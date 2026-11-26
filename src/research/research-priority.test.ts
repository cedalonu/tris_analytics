import test from "node:test";import assert from "node:assert/strict";import {assessResearchPriority} from "./research-priority";
const sample=(n=4,cl="favorable-observed")=>({candidateKey:"H-A",history:Array.from({length:n},(_,i)=>({candidateKey:"H-A",recordedAt:`2026-11-${String(i+1).padStart(2,"0")}T00:00:00Z`,classification:cl,resolved:i+2}))});
test("eligible candidate receives queue category",()=>{const r=assessResearchPriority(sample());assert.equal(r.eligibility,"eligible");assert.notEqual(r.queue,"Fuera de cola");});
test("structural defect excludes from queue",()=>{const x=sample();x.history[1].recordedAt=x.history[0].recordedAt;assert.equal(assessResearchPriority(x).queue,"Fuera de cola");});
test("short history remains outside queue",()=>assert.equal(assessResearchPriority(sample(2)).queue,"Fuera de cola"));
test("components are transparent",()=>{const r=assessResearchPriority(sample());assert.equal(r.quality,100);assert.equal(r.depth,50);assert.equal(r.stability,100);assert.equal(r.notes.length,4);});
test("neutral descriptor coding",()=>assert.equal(assessResearchPriority(sample(3,"neutral")).descriptor,45));