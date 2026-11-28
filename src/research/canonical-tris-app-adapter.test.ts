import test from "node:test";
import assert from "node:assert/strict";
import type { Draw } from "../research-core";
import { mapCanonicalDrawsToApp } from "./canonical-tris-app-adapter";

test("maps canonical contest IDs, digits and dates losslessly into the main dashboard shape", () => {
  const canonical: Draw[] = [
    { drawId: 11033, digits: [0,1,2,3,4], date: "2020-01-01" },
    { drawId: 11034, digits: [9,8,7,6,5], date: "2020-01-02" },
  ];
  const mapped = mapCanonicalDrawsToApp(canonical);
  assert.deepEqual(mapped, [
    { num: 11033, win: [0,1,2,3,4], digits: [0,1,2,3,4], date: "2020-01-01" },
    { num: 11034, win: [9,8,7,6,5], digits: [9,8,7,6,5], date: "2020-01-02" },
  ]);
  mapped[0].digits[0] = 9;
  assert.equal(canonical[0].digits[0], 0, "legacy arrays must not mutate canonical rows");
});

test("uses an empty date only when the canonical row has no date", () => {
  const mapped = mapCanonicalDrawsToApp([{ drawId: 1, digits: [1,2,3,4,5] }]);
  assert.equal(mapped[0].date, "");
});
