import test from "node:test";
import assert from "node:assert/strict";
import { importTrisCsv } from "./data-adapter";

const header="CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS";
test("imports manually supplied CSV and marks provenance as local",()=>{
 const csv=[header,
  "1001,1,0,1,2,3,4,2026-01-01,,,",
  "1002,2,9,8,7,6,5,2026-01-02,,"
 ].join("\n");
 const result=importTrisCsv(csv,"2026-11-25T00:00:00.000Z");
 assert.equal(result.validation.errors.length,0);
 assert.equal(result.validation.valid.length,2);
 assert.equal(result.provenance.sourceLabel,"local-user-supplied-csv");
 assert.equal(result.provenance.minDrawId,1001);
 assert.equal(result.provenance.maxDrawId,1002);
 assert.deepEqual(result.provenance.dateRange,["2026-01-01","2026-01-02"]);
 assert.equal(result.validation.valid[0].digits.join(""),"01234");
});
test("rejects missing required columns and invalid digits",()=>{
 const missing=importTrisCsv("CONCURSO,R1,R2\n1,1,2");
 assert.ok(missing.validation.errors.some(e=>e.includes("missing required columns")));
 const invalid=importTrisCsv([header,"1001,1,0,1,2,3,10,2026-01-01,,"] .join("\n"));
 assert.ok(invalid.validation.errors.some(e=>e.includes("malformed digits")));
});
test("flags duplicate contest IDs and gaps instead of silently hiding them",()=>{
 const csv=[header,
  "1001,1,0,1,2,3,4,2026-01-01,,",
  "1001,2,1,2,3,4,5,2026-01-02,,",
  "1003,3,2,3,4,5,6,2026-01-03,,"
 ].join("\n");
 const result=importTrisCsv(csv);
 assert.ok(result.validation.errors.some(e=>e.includes("duplicate draw 1001")));
 assert.ok(result.validation.warnings.some(e=>e.includes("draw gap 1001")));
 assert.equal(result.validation.valid.length,2);
});

test("uses CONCURSO as contest key and ignores ID even when blank or nonnumeric",()=>{
 const csv=[header,
  "36993,,8,7,0,2,8,2026-11-25,2,1",
  "36994,not-used,1,0,9,7,0,2026-11-25,1,0"
 ].join("\n");
 const result=importTrisCsv(csv);
 assert.deepEqual(result.validation.errors,[]);
 assert.deepEqual(result.validation.valid.map(d=>d.drawId),[36993,36994]);
 assert.deepEqual(result.validation.valid.map(d=>d.digits),[[8,7,0,2,8],[1,0,9,7,0]]);
});
