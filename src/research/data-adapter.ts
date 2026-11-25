/** Import adapter for a manually supplied local TRIS CSV; performs no network access. */
import type { Draw, Digit, Validation } from "../research-core";
export interface DatasetProvenance { sourceLabel:string; fetchedAt:string; sourceHeader:string[]; rowCount:number; minDrawId:number|null; maxDrawId:number|null; dateRange:[string|null,string|null]; contentFingerprint?:string }
export interface ImportedDataset { validation:Validation; provenance:DatasetProvenance }
const sourceLabel="local-user-supplied-csv";
const isDigit=(n:number):n is Digit=>Number.isInteger(n)&&n>=0&&n<=9;
/** CSV is expected in the source schema: CONCURSO,ID,R1..R5,FECHA,... */
export function importTrisCsv(csv:string,fetchedAt=new Date().toISOString()):ImportedDataset {
 const lines=csv.replace(/^\uFEFF/,"").trim().split(/\r?\n/);
 const header=(lines.shift()||"").split(",").map(s=>s.trim());
 const col=(name:string)=>header.indexOf(name);
 const idCol=col("CONCURSO"),digitsCols=["R1","R2","R3","R4","R5"].map(col),dateCol=col("FECHA");
 const errors:string[]=[],warnings:string[]=[],rows:Draw[]=[];
 if(idCol<0||digitsCols.some(i=>i<0)||dateCol<0) return {validation:{valid:[],errors:["CSV header missing required columns CONCURSO, R1-R5, FECHA"],warnings:[]},provenance:{sourceLabel,fetchedAt,sourceHeader:header,rowCount:0,minDrawId:null,maxDrawId:null,dateRange:[null,null]}};
 lines.forEach((line,i)=>{ if(!line.trim())return; const fields=line.split(",").map(s=>s.trim());
  const drawId=Number(fields[idCol]),digits=digitsCols.map(j=>Number(fields[j]));
  if(!Number.isInteger(drawId)||drawId<=0){errors.push("line "+(i+2)+": invalid draw number");return;}
  if(digits.length!==5||digits.some(d=>!isDigit(d))){errors.push("draw "+drawId+": malformed digits");return;}
  const date=fields[dateCol]||undefined;if(date&&Number.isNaN(Date.parse(date)))warnings.push("draw "+drawId+": invalid date format");
  rows.push({drawId,digits:digits as Digit[],date,source:sourceLabel});
 });
 rows.sort((a,b)=>a.drawId-b.drawId);const ids=new Set<number>();const unique:Draw[]=[];
 for(const row of rows){if(ids.has(row.drawId)){errors.push("duplicate draw "+row.drawId);continue;}ids.add(row.drawId);unique.push(row);}
 for(let i=1;i<unique.length;i++)if(unique[i].drawId-unique[i-1].drawId>1)warnings.push("draw gap "+unique[i-1].drawId+" → "+unique[i].drawId);
 const dates=unique.map(d=>d.date).filter((d):d is string=>!!d).sort();
 return {validation:{valid:unique,errors,warnings},provenance:{sourceLabel,fetchedAt,sourceHeader:header,rowCount:unique.length,minDrawId:unique[0]?.drawId??null,maxDrawId:unique.at(-1)?.drawId??null,dateRange:[dates[0]??null,dates.at(-1)??null]}};
}