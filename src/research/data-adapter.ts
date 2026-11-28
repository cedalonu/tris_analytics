/** Import adapter for a supplied TRIS CSV; performs no network access. */
import type { Draw, Digit, Validation } from "../research-core";

export interface DatasetProvenance {
  sourceLabel: string;
  fetchedAt: string;
  sourceHeader: string[];
  rowCount: number;
  minDrawId: number | null;
  maxDrawId: number | null;
  dateRange: [string | null, string | null];
  contentFingerprint?: string;
}
export interface ImportedDataset { validation: Validation; provenance: DatasetProvenance }

const sourceLabel = "local-user-supplied-csv";
const requiredColumns = ["CONCURSO", "R1", "R2", "R3", "R4", "R5", "FECHA"] as const;
const isDigit = (n: number): n is Digit => Number.isInteger(n) && n >= 0 && n <= 9;

/** Parse one CSV record, including quoted commas and escaped double quotes. */
function parseCsvRecord(line: string): { fields: string[]; error?: string } {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  let quoteClosed = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; quoteClosed = true; }
      } else field += char;
      continue;
    }
    if (char === ",") {
      fields.push(field.trim());
      field = "";
      quoteClosed = false;
      continue;
    }
    if (char === '"' && field.trim() === "" && !quoteClosed) {
      field = "";
      quoted = true;
      continue;
    }
    if (quoteClosed && char.trim() !== "") return { fields: [], error: "unexpected character after closing quote" };
    if (char === '"') return { fields: [], error: "unexpected quote inside unquoted field" };
    field += char;
  }
  if (quoted) return { fields: [], error: "unterminated quoted field" };
  fields.push(field.trim());
  return { fields };
}

function validDate(value: string): boolean {
  if (!value) return false;
  // Strictly reject impossible ISO calendar dates such as 2026-02-30.
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) {
    const year = Number(iso[1]), month = Number(iso[2]), day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }
  return !Number.isNaN(Date.parse(value));
}

/** CSV schema: CONCURSO,ID,R1..R5,FECHA,...; ID is deliberately ignored. */
export function importTrisCsv(csv: string, fetchedAt = new Date().toISOString()): ImportedDataset {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerRecord = parseCsvRecord(lines.shift() ?? "");
  const header = headerRecord.fields.map(value => value.trim());
  const errors: string[] = [], warnings: string[] = [], rows: Draw[] = [];
  const emptyProvenance = (): DatasetProvenance => ({
    sourceLabel, fetchedAt, sourceHeader: header, rowCount: 0,
    minDrawId: null, maxDrawId: null, dateRange: [null, null],
  });

  if (headerRecord.error) {
    return { validation: { valid: [], errors: ["CSV header: " + headerRecord.error], warnings }, provenance: emptyProvenance() };
  }
  if (!header.some(Boolean)) {
    return { validation: { valid: [], errors: ["CSV is empty or has no header"], warnings }, provenance: emptyProvenance() };
  }

  const positions = new Map<string, number[]>();
  header.forEach((name, index) => positions.set(name, [...(positions.get(name) ?? []), index]));
  for (const name of requiredColumns) {
    const count = positions.get(name)?.length ?? 0;
    if (count !== 1) errors.push(count === 0
      ? "CSV header missing required column " + name
      : "CSV header contains duplicate required column " + name);
  }
  if (errors.length) {
    return { validation: { valid: [], errors, warnings }, provenance: emptyProvenance() };
  }

  const col = (name: string) => positions.get(name)![0];
  const idCol = col("CONCURSO");
  const digitCols = ["R1", "R2", "R3", "R4", "R5"].map(col);
  const dateCol = col("FECHA");
  const minimumFields = Math.max(idCol, dateCol, ...digitCols) + 1;

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const lineNumber = index + 2;
    const parsed = parseCsvRecord(line);
    if (parsed.error) {
      errors.push("line " + lineNumber + ": malformed CSV: " + parsed.error);
      return;
    }
    const fields = parsed.fields;
    if (fields.length < minimumFields) {
      errors.push("line " + lineNumber + ": incomplete row; expected at least " + minimumFields + " columns");
      return;
    }
    const drawId = Number(fields[idCol]);
    const digits = digitCols.map(position => Number(fields[position]));
    const date = fields[dateCol];
    if (!Number.isInteger(drawId) || drawId <= 0) {
      errors.push("line " + lineNumber + ": invalid CONCURSO");
      return;
    }
    if (digits.length !== 5 || digits.some(digit => !isDigit(digit))) {
      errors.push("draw " + drawId + ": malformed digits; R1-R5 must each be an integer from 0 to 9");
      return;
    }
    if (!validDate(date)) {
      errors.push("draw " + drawId + ": missing or invalid FECHA");
      return;
    }
    rows.push({ drawId, digits: digits as Digit[], date, source: sourceLabel });
  });

  // Sort by CONCURSO for deterministic chronology; duplicates remain fatal.
  rows.sort((a, b) => a.drawId - b.drawId);
  const unique: Draw[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.drawId)) errors.push("duplicate draw " + row.drawId);
    else { seen.add(row.drawId); unique.push(row); }
  }
  for (let i = 1; i < unique.length; i++) {
    if (unique[i].drawId - unique[i - 1].drawId > 1) {
      warnings.push("draw gap " + unique[i - 1].drawId + " → " + unique[i].drawId);
    }
  }
  const dates = unique.map(draw => draw.date!).sort();
  return {
    validation: { valid: unique, errors, warnings },
    provenance: {
      sourceLabel, fetchedAt, sourceHeader: header, rowCount: unique.length,
      minDrawId: unique[0]?.drawId ?? null, maxDrawId: unique.at(-1)?.drawId ?? null,
      dateRange: [dates[0] ?? null, dates.at(-1) ?? null],
    },
  };
}
