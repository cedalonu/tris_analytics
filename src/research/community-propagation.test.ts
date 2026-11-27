import test from "node:test";import assert from "node:assert/strict";
import {simulateStructuralPropagation} from "./community-propagation";
import type {NetworkEdge,NetworkNode} from "./hypothesis-network";
const nodes=(ids:string[]):NetworkNode[]=>ids.map(id=>({id,degree:0,weightedDegree:0,supportedDegree:0,suggestiveDegree:0,x:0,y:0}));
const edge=(left:string,right:string,strength=0.8,status:"supported"|"suggestive"="supported"):NetworkEdge=>({left,right,strength,status,observations:10,adjustedPValue:0.01,persistent:true});
test("shortest-hop reach and exposure",()=>{const r=simulateStructuralPropagation(nodes(["A","B","C","D"]),[edge("A","B",.8),edge("B","C",.5),edge("C","D",.25)],{maxHops:3,minExposure:.05}).rows[0];assert.equal(r.seed,"A");assert.deepEqual(r.byHop.map(x=>x.newNodes),[1,1,1]);assert.deepEqual(r.exposed.map(x=>x.exposure),[.8,.4,.1]);});
test("excludes nodes below threshold and disconnected nodes",()=>{const r=simulateStructuralPropagation(nodes(["A","B","C","D"]),[edge("A","B",.2),edge("B","C",.2)],{maxHops:3,minExposure:.1}).rows.find(x=>x.seed==="A")!;assert.deepEqual(r.exposed.map(x=>x.id),["B"]);assert.equal(r.reachableNodes,1);});
test("suggestive edges only enter sensitivity simulation",()=>{const ns=nodes(["A","B"]),strict=simulateStructuralPropagation(ns,[],{maxHops:1}).rows.find(x=>x.seed==="A")!,relaxed=simulateStructuralPropagation(ns,[edge("A","B",.7,"suggestive")],{maxHops:1}).rows.find(x=>x.seed==="A")!;assert.equal(strict.reachableNodes,0);assert.equal(relaxed.reachableNodes,1);});
test("single node is safe",()=>{const r=simulateStructuralPropagation(nodes(["A"]),[],{}).rows[0];assert.equal(r.reachFraction,0);assert.deepEqual(r.exposed,[]);});
