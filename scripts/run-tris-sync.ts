#!/usr/bin/env tsx
/**
 * Incremental TRIS CSV sync. Run after manually downloading the updated CSV.
 * No APIs, HTTP requests, timers, or automatic polling are used.
 */
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { createHash } from "node:crypto";
import { importTrisCsv } from "../src/research/data-adapter";
import { syncTrisCsvSnapshot, type TrisSyncCheckpoint } from "../src/research/tris-csv-sync";

const input=process.argv[2];
if(!input) {
 console.error("Usage: npm run research:sync -- <local-path-to-Tris.csv> [checkpoint.json]");
 process.exit(2);
}
const csvPath=resolve(input);
const checkpointPath=resolve(process.argv[3]??"data/tris-sync-checkpoint.json");
const csv=await readFile(csvPath,"utf8");
const imported=importTrisCsv(csv);
if(imported.validation.errors.length) {
 console.error("CSV validation errors:");
 imported.validation.errors.slice(0,30).forEach(e=>console.error("- "+e));
 process.exit(1);
}
const gaps=imported.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length) {
 console.error("Sync stopped: CSV has missing contest IDs.");
 gaps.slice(0,30).forEach(w=>console.error("- "+w));
 process.exit(1);
}
let previous:TrisSyncCheckpoint|null=null;
try { previous=JSON.parse(await readFile(checkpointPath,"utf8")) as TrisSyncCheckpoint; }
catch(error) { if((error as NodeJS.ErrnoException).code!=="ENOENT") throw error; }
const result=syncTrisCsvSnapshot(imported.validation.valid,previous);
const stamp=new Date().toISOString();
const reportDir=resolve("reports/tris-sync");
await mkdir(reportDir,{recursive:true});
const sha256=createHash("sha256").update(csv,"utf8").digest("hex");
const delta=result.status==="updated"?result.newDraws:[];
const deltaCsv=["CONCURSO,R1,R2,R3,R4,R5,FECHA",...delta.map(d=>[
 d.drawId,...d.digits,d.date??""
].join(","))].join("\n")+"\n";
const report=[
 "# TRIS CSV incremental sync",
 "",
 "## Estado",
 "- Resultado: "+result.status,
 "- Archivo local: "+basename(csvPath),
 "- SHA-256 CSV: "+sha256,
 "- Sorteos válidos en CSV: "+imported.validation.valid.length,
 "- Último concurso: "+result.latestDrawId,
 "- Último concurso procesado anteriormente: "+(result.previousDrawId??"ninguno"),
 "- Concursos nuevos para evaluación prospectiva: "+delta.length,
 "- Actualizado: "+stamp,
 "",
 "## Nuevos concursos",
 delta.length?delta.map(d=>"- "+d.drawId+" | "+(d.date??"fecha no disponible")+" | "+d.digits.join("")).join("\n"):"- Ninguno. La primera ejecución solo inicializa el punto de control; no convierte el histórico en evidencia prospectiva.",
 "",
 "## Conteo de novedades por fecha",
 Object.entries(result.drawsByDate).length?Object.entries(result.drawsByDate).map(([day,n])=>"- "+day+": "+n).join("\n"):"- Sin novedades.",
 "",
 "## Advertencias",
 ...(result.warnings.length?result.warnings.map(w=>"- "+w):["- Ninguna."]),
 "",
 "## Integridad",
 "- El prefijo ya procesado debe permanecer idéntico; cualquier modificación detiene la sincronización.",
 "- Los identificadores deben ser consecutivos; no se rellenan huecos.",
 "- La referencia operativa es cinco sorteos diarios, pero no se inventan horarios ni se descartan lotes atípicos.",
 "- Este proceso detecta y registra novedades; no descarga el CSV ni genera por sí solo pronósticos."
].join("\n")+"\n";
await writeFile(resolve(reportDir,"latest.md"),report,"utf8");
if(delta.length) await writeFile(resolve(reportDir,"latest-new-draws.csv"),deltaCsv,"utf8");
const tmp=checkpointPath+".tmp";
await mkdir(dirname(checkpointPath),{recursive:true});
await writeFile(tmp,JSON.stringify(result.checkpoint,null,2)+"\n","utf8");
await rename(tmp,checkpointPath);
console.log("TRIS CSV sync: "+result.status);
console.log("Latest contest: "+result.latestDrawId);
console.log("New contests for prospective evaluation: "+delta.length);
console.log("Checkpoint: "+checkpointPath);
console.log("Report: "+resolve(reportDir,"latest.md"));
if(result.warnings.length) result.warnings.forEach(w=>console.warn("WARNING: "+w));
