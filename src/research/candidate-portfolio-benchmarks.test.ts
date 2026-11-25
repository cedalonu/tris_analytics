import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {buildBenchmarkPortfolios} from "./candidate-portfolio-benchmarks";

test("benchmark portfolios have equal size and frozen family/method composition",()=>{
 const catalog=generateIntuitionCandidates();
 const rows=buildBenchmarkPortfolios(catalog,10,1234);
 assert.equal(rows.length,3);
 for(const row of rows)assert.equal(row.portfolio.candidateIds.length,10);
 const byId=new Map(catalog.map(c=>[c.id,c]));
 const frequency=rows.find(x=>x.name==="baseline-frequency-only")!;
 assert.ok(frequency.portfolio.candidateIds.every(id=>{const c=byId.get(id)!;return c.family==="pool-ranking"&&c.config.method==="frequency"}));
 const transition=rows.find(x=>x.name==="baseline-transition-only")!;
 assert.ok(transition.portfolio.candidateIds.every(id=>byId.get(id)!.family==="transition"));
 const recent=rows.find(x=>x.name==="baseline-recent-pool")!;
 assert.ok(recent.portfolio.candidateIds.every(id=>{const c=byId.get(id)!;return c.family==="pool-ranking"&&c.config.method==="recent-frequency"}));
});

test("benchmark portfolios are deterministic and reject budgets larger than a baseline family",()=>{
 const catalog=generateIntuitionCandidates();
 assert.deepEqual(buildBenchmarkPortfolios(catalog,8,77),buildBenchmarkPortfolios(catalog,8,77));
 assert.throws(()=>buildBenchmarkPortfolios(catalog,31,77),/baseline-transition-only has only 30/);
});
