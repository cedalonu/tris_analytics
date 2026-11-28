import test from "node:test";
import assert from "node:assert/strict";
import { importTrisCsv } from "./data-adapter";

const header = "CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS";
const row = (id: number, date = "2026-01-01") => `${id},ignored,0,1,2,3,4,${date},,`;

test("imports CSV and records provenance while preserving leading zero digits", () => {
  const result = importTrisCsv([header, row(1001), row(1002, "2026-01-02")].join("\n"), "2026-11-25T00:00:00.000Z");
  assert.deepEqual(result.validation.errors, []);
  assert.equal(result.validation.valid.length, 2);
  assert.equal(result.provenance.sourceLabel, "local-user-supplied-csv");
  assert.equal(result.provenance.minDrawId, 1001);
  assert.equal(result.provenance.maxDrawId, 1002);
  assert.deepEqual(result.provenance.dateRange, ["2026-01-01", "2026-01-02"]);
  assert.equal(result.validation.valid[0].digits.join(""), "01234");
});

test("rejects empty files, missing columns, and duplicated required headers", () => {
  assert.ok(importTrisCsv("").validation.errors.some(error => error.includes("empty")));
  assert.ok(importTrisCsv("CONCURSO,R1,R2\n1,1,2").validation.errors.some(error => error.includes("missing required column")));
  assert.ok(importTrisCsv("CONCURSO,CONCURSO,R1,R2,R3,R4,R5,FECHA\n1,1,0,1,2,3,4,2026-01-01").validation.errors.some(error => error.includes("duplicate required column CONCURSO")));
});

test("rejects invalid digits, missing dates, impossible dates, and malformed rows", () => {
  const invalidDigit = importTrisCsv([header, "1001,x,0,1,2,3,10,2026-01-01,,"] .join("\n"));
  assert.ok(invalidDigit.validation.errors.some(error => error.includes("malformed digits")));
  const missingDate = importTrisCsv([header, "1001,x,0,1,2,3,4,,,"] .join("\n"));
  assert.ok(missingDate.validation.errors.some(error => error.includes("missing or invalid FECHA")));
  const impossibleDate = importTrisCsv([header, row(1001, "2026-02-30")].join("\n"));
  assert.ok(impossibleDate.validation.errors.some(error => error.includes("missing or invalid FECHA")));
  const shortRow = importTrisCsv([header, "1001,x,0,1,2"].join("\n"));
  assert.ok(shortRow.validation.errors.some(error => error.includes("incomplete row")));
});

test("supports quoted fields and escaped quotes without confusing commas", () => {
  const csv = [header, '1001,"ID, is ignored",0,1,2,3,4,"2026-01-01",,'].join("\n");
  const result = importTrisCsv(csv);
  assert.deepEqual(result.validation.errors, []);
  assert.equal(result.validation.valid[0].drawId, 1001);
});

test("rejects malformed quoting", () => {
  const csv = [header, '1001,"unterminated,0,1,2,3,4,2026-01-01,,'].join("\n");
  assert.ok(importTrisCsv(csv).validation.errors.some(error => error.includes("malformed CSV")));
});

test("uses CONCURSO as key and ignores ID even when blank or nonnumeric", () => {
  const csv = [header,
    "36993,,8,7,0,2,8,2026-11-25,2,1",
    "36994,not-used,1,0,9,7,0,2026-11-25,1,0"
  ].join("\n");
  const result = importTrisCsv(csv);
  assert.deepEqual(result.validation.errors, []);
  assert.deepEqual(result.validation.valid.map(draw => draw.drawId), [36993, 36994]);
  assert.deepEqual(result.validation.valid.map(draw => draw.digits), [[8,7,0,2,8],[1,0,9,7,0]]);
});

test("flags duplicate contest IDs and gaps", () => {
  const csv = [header,
    "1001,1,0,1,2,3,4,2026-01-01,,",
    "1001,2,1,2,3,4,5,2026-01-02,,",
    "1003,3,2,3,4,5,6,2026-01-03,,"
  ].join("\n");
  const result = importTrisCsv(csv);
  assert.ok(result.validation.errors.some(error => error.includes("duplicate draw 1001")));
  assert.ok(result.validation.warnings.some(error => error.includes("draw gap 1001")));
});
