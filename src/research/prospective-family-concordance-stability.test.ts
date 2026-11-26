import test from "node:test";
import assert from "node:assert/strict";
import {summarizeProspectiveFamilyConcordanceStability} from "./prospective-family-concordance-stability";
import type {ProspectiveFamilyConcordance} from "./prospective-family-concordance";
const make=(last:number):ProspectiveFamilyConcordance=>{
 const drawValues:ProspectiveFamilyConcordance["drawValues"]=[];
 for(let i=1;i<=last;i++){
  drawValues.push({drawId:i,family:"transition",candidateCount:1,resolvedCount:1,hitRate:0,baselineRate:0,meanDifference:i<=10?.2:i<=20?-.2:.1});
  drawValues.push({drawId:i,family:"pool-ranking",candidateCount:1,resolvedCount:1,hitRate:0,baselineRate:0,meanDifference:i<=10?.1:i<=20?.2:-.1});
 }
 return {portfolioId:"p",firstTargetDrawId:1,lastObservedDrawId:last,families:[],drawValues,pairs:[{familyA:"transition",familyB:"pool-ranking",commonDraws:last,pearsonCorrelation:0,sameDirectionDraws:0,oppositeDirectionDraws:0,neutralPairDraws:0,directionAgreement:0}],interpretation:[]};
};
test("stability uses fixed chronological blocks and identifies directional runs",()=>{const r=summarizeProspectiveFamilyConcordanceStability(make(25),{blockSize:10,minimumDrawSupport:8});const p=r.pairs[0];assert.equal(p.blocks.length,3);assert.equal(p.blocks[0].status,"positive");assert.equal(p.blocks[1].status,"negative");assert.equal(p.blocks[2].partial,true);assert.equal(p.longestPositiveRun,1);assert.equal(p.longestNegativeRun,1);});
test("underpowered blocks are excluded from directional summaries",()=>{const sparse=make(10);sparse.drawValues=sparse.drawValues.filter(v=>v.drawId<=4);const s=summarizeProspectiveFamilyConcordanceStability(sparse,{blockSize:10,minimumDrawSupport:8});assert.equal(s.pairs[0].underpoweredBlocks,1);assert.equal(s.pairs[0].supportedBlocks,0);});
test("invalid block configuration is rejected",()=>{assert.throws(()=>summarizeProspectiveFamilyConcordanceStability(make(10),{blockSize:2,minimumDrawSupport:4}));});
