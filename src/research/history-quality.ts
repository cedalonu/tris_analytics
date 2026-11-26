export type HistoryQualityInput={candidateKey:string;history:Array<{recordedAt:string;candidateKey:string}>};
export type HistoryQuality={score:number;label:"Alta"|"Media"|"Baja";records:number;shallow:boolean;invalidDates:number;outOfOrder:number;duplicateDates:number;identityMismatch:number;issues:string[]};
/** Descriptive assessment of imported history integrity/depth, not predictive performance. */
export function assessHistoryQuality(input:HistoryQualityInput):HistoryQuality{
 const h=input.history??[], issues:string[]=[];let invalidDates=0,outOfOrder=0,duplicateDates=0,identityMismatch=0;const seen=new Set<string>();
 h.forEach((r,i)=>{const t=Date.parse(r.recordedAt);if(!Number.isFinite(t)){invalidDates++;}else{if(i>0&&Date.parse(h[i-1].recordedAt)>t)outOfOrder++;if(seen.has(r.recordedAt))duplicateDates++;seen.add(r.recordedAt);}if(r.candidateKey!==input.candidateKey)identityMismatch++;});
 const shallow=h.length<3;if(shallow)issues.push("Historial corto (<3 registros)");if(invalidDates)issues.push("Fecha inválida");if(outOfOrder)issues.push("Cronología fuera de orden");if(duplicateDates)issues.push("Fechas duplicadas");if(identityMismatch)issues.push("Identidad de candidato inconsistente");
 let score=100-(shallow?15:0)-invalidDates*20-outOfOrder*20-duplicateDates*15-identityMismatch*30;score=Math.max(0,score);const label=score>=85?"Alta":score>=60?"Media":"Baja";if(!issues.length)issues.push("Sin alertas estructurales detectadas");return{score,label,records:h.length,shallow,invalidDates,outOfOrder,duplicateDates,identityMismatch,issues};
}