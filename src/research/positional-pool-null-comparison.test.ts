import {test} from "node:test";
import {strict as assert} from "node:assert";
import {comparePositionalPoolNullControls} from "./positional-pool-null-comparison";
import type {PositionalPoolNullControlReport} from "./positional-pool-null-controls";
import type {PositionalPoolCircularShiftReport} from "./positional-pool-circular-shift";
const permutation:PositionalPoolNullControlReport={method:"perm",seed:1,replications:99,minimumPairs:3,limitations:[],groups:[{regimeId:"A",position:0,method:"frequency",poolSize:3,metrics:[
 {metric:"dominant-share-inclusion",support:12,observedCorrelation:.8,nullMean:0,nullSd:.2,nullP025:-.4,nullMedian:0,nullP975:.4,exceedances:0,replications:99,empiricalTwoSidedTailRate:.01},
 {metric:"dominant-transition-turnover",support:12,observedCorrelation:.1,nullMean:0,nullSd:.2,nullP025:-.4,nullMedian:0,nullP975:.4,exceedances:40,replications:99,empiricalTwoSidedTailRate:.41},
 {metric:"inclusion-hit-rate",support:12,observedCorrelation:-.7,nullMean:0,nullSd:.2,nullP025:-.4,nullMedian:0,nullP975:.4,exceedances:1,replications:99,empiricalTwoSidedTailRate:.02}
]}]};
const circular:PositionalPoolCircularShiftReport={method:"shift",seed:2,replications:99,minimumPairs:5,limitations:[],groups:[{regimeId:"A",position:0,method:"frequency",poolSize:3,metrics:[
 {metric:"dominant-share-inclusion",support:12,observedCorrelation:.8,nullMean:0,nullSd:.2,nullP025:-.3,nullMedian:0,nullP975:.3,exceedances:0,replications:99,empiricalTwoSidedTailRate:.01,status:"evaluated"},
 {metric:"dominant-transition-turnover",support:12,observedCorrelation:.1,nullMean:0,nullSd:.2,nullP025:-.4,nullMedian:0,nullP975:.4,exceedances:40,replications:99,empiricalTwoSidedTailRate:.41,status:"evaluated"},
 {metric:"inclusion-hit-rate",support:12,observedCorrelation:-.7,nullMean:0,nullSd:.2,nullP025:-.8,nullMedian:0,nullP975:.8,exceedances:1,replications:99,empiricalTwoSidedTailRate:.02,status:"evaluated"}
]}]};
test("dual comparison classifies only matched metrics against both reference envelopes",()=>{const r=comparePositionalPoolNullControls(permutation,circular);assert.equal(r.matchedMetrics,3);assert.equal(r.unmatchedMetrics,0);assert.deepEqual(r.groups[0].metrics.map(x=>x.status),["outside-both-reference-envelopes","inside-both-reference-envelopes","outside-permutation-only"]);});
test("missing groups, support mismatch, and non-contiguous shifts remain unmatched",()=>{const c={...circular,groups:[{...circular.groups[0],metrics:circular.groups[0].metrics.map((m,i)=>({...m,support:i===0?11:m.support,status:i===1?"non-contiguous-blocks" as const:m.status}))}]};const r=comparePositionalPoolNullControls(permutation,c);assert.equal(r.matchedMetrics,1);assert.equal(r.unmatchedMetrics,2);assert.equal(r.groups[0].metrics[0].status,"insufficient-or-unmatched");assert.equal(r.groups[0].metrics[1].status,"insufficient-or-unmatched");});
test("a group present in only one report is retained but not compared",()=>{const p={...permutation,groups:[]};const r=comparePositionalPoolNullControls(p,circular);assert.equal(r.groups.length,1);assert.equal(r.matchedMetrics,0);assert.equal(r.unmatchedMetrics,3);});
