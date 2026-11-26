/**
 * Fixed non-overlapping temporal stability audit for positional regime profiles.
 * Blocks are anchored to the first labeled target and never overlap.
 * Descriptive only; no p-values or claims of future predictability.
 */
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import {analyzePositionalRegimeProfiles} from "./positional-regime-profile";

export interface PositionalStabilityBlock {
  blockIndex:number;startDrawId:number;endDrawId:number;partial:boolean;
  n:number;dominantDigit:number|null;dominantShare:number|null;
  entropyBits:number|null;effectiveDigits:number|null;
  status:"supported"|"underpowered";
}
export interface PositionalRegimeBlockSummary {
  regimeId:string;position:number;overallDominantDigit:number|null;
  blocks:PositionalStabilityBlock[];supportedBlocks:number;underpoweredBlocks:number;
  dominantConsistency:number|null;meanDominantShare:number|null;
  dominantShareRange:number|null;dominantShareStdDev:number|null;
  meanEntropyBits:number|null;entropyRange:number|null;
  interpretation:"stable-dominant"|"variable-dominance"|"insufficient";
}
export interface PositionalRegimeStabilityReport {
  method:string;firstTargetDrawId:number;lastTargetDrawId:number;
  blockSize:number;blockOffset:number;minimumDrawSupport:number;regimes:PositionalRegimeBlockSummary[];
}
interface BlockCounts {n:number;counts:number[]}
export function summarizePositionalRegimeStability(
 draws:Draw[],labels:ProspectiveRegimeLabel[],
 options:{blockSize?:number;blockOffset?:number;minimumDrawSupport?:number}={}
):PositionalRegimeStabilityReport {
 const blockSize=options.blockSize??25,blockOffset=options.blockOffset??0,minimum=options.minimumDrawSupport??10;
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("blockSize must be an integer >= 2");
 if(!Number.isInteger(blockOffset)||blockOffset<0||blockOffset>=blockSize)throw new Error("blockOffset must be an integer from 0 to blockSize - 1");
 if(!Number.isInteger(minimum)||minimum<1||minimum>blockSize)throw new Error("minimumDrawSupport must be between 1 and blockSize");
 if(!labels.length)throw new Error("labels are required");
 // Reuse the profile module's validation: chronological, contiguous draws and strictly past-only labels.
 analyzePositionalRegimeProfiles(draws,labels,{minimumSupport:minimum});
 const drawById=new Map(draws.map(d=>[d.drawId,d]));
 const first=labels[0].drawId,last=labels[labels.length-1].drawId;
 const blockCount=Math.ceil((last-first+1+blockOffset)/blockSize);
 const regimeIds=[...new Set(labels.map(x=>x.regimeId))].sort();
 const overall=new Map<string,number[][]>(),byBlock=new Map<string,BlockCounts>();
 for(const regimeId of regimeIds)overall.set(regimeId,Array.from({length:5},()=>Array(10).fill(0) as number[]));
 for(const label of labels){
  const draw=drawById.get(label.drawId)!;
  const blockIndex=Math.floor((label.drawId-first+blockOffset)/blockSize);
  const countsByPosition=overall.get(label.regimeId)!;
  for(let p=0;p<5;p++){
   const digit=draw.digits[p];
   countsByPosition[p][digit]++;
   const key=label.regimeId+"|"+p+"|"+blockIndex;
   let block=byBlock.get(key);
   if(!block){block={n:0,counts:Array(10).fill(0) as number[]};byBlock.set(key,block);}
   block.n++;block.counts[digit]++;
  }
 }
 const summaries:PositionalRegimeBlockSummary[]=[];
 for(const regimeId of regimeIds){
  for(let p=0;p<5;p++){
   const overallCounts=overall.get(regimeId)![p];
   const overallMax=Math.max(...overallCounts);
   const regimeTotal=overallCounts.reduce((s,x)=>s+x,0);
   const overallDominant=regimeTotal?overallCounts.indexOf(overallMax):null;
   const blocks:PositionalStabilityBlock[]=[];
   for(let i=0;i<blockCount;i++){
    const nominalStart=first+i*blockSize-blockOffset;
    const start=Math.max(first,nominalStart),end=Math.min(last,nominalStart+blockSize-1);
    const stats=byBlock.get(regimeId+"|"+p+"|"+i);
    const n=stats?.n??0,counts=stats?.counts??Array(10).fill(0) as number[];
    const max=Math.max(...counts),dominant=n?counts.indexOf(max):null;
    const share=n?max/n:null;
    const entropy=n?counts.reduce((h,count)=>{if(!count)return h;const q=count/n;return h-q*Math.log2(q);},0):null;
    blocks.push({blockIndex:i+1,startDrawId:start,endDrawId:end,partial:end-start+1<blockSize,
      n,dominantDigit:dominant,dominantShare:share,entropyBits:entropy,
      effectiveDigits:entropy===null?null:2**entropy,status:n>=minimum?"supported":"underpowered"});
   }
   const supported=blocks.filter(b=>b.status==="supported");
   const shares=supported.map(b=>b.dominantShare!),entropies=supported.map(b=>b.entropyBits!);
   const mean=(xs:number[])=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:null;
   const meanShare=mean(shares),meanEntropy=mean(entropies);
   const variance=meanShare===null?null:shares.reduce((s,x)=>s+(x-meanShare)**2,0)/shares.length;
   const consistency=supported.length&&overallDominant!==null?supported.filter(b=>b.dominantDigit===overallDominant).length/supported.length:null;
   const interpretation:PositionalRegimeBlockSummary["interpretation"]=supported.length<3?"insufficient":
    consistency!==null&&consistency>=.7?"stable-dominant":"variable-dominance";
   summaries.push({regimeId,position:p+1,overallDominantDigit:overallDominant,blocks,
    supportedBlocks:supported.length,underpoweredBlocks:blocks.length-supported.length,
    dominantConsistency:consistency,meanDominantShare:meanShare,
    dominantShareRange:shares.length?Math.max(...shares)-Math.min(...shares):null,
    dominantShareStdDev:variance===null?null:Math.sqrt(variance),meanEntropyBits:meanEntropy,
    entropyRange:entropies.length?Math.max(...entropies)-Math.min(...entropies):null,interpretation});
  }
 }
 return{method:"fixed-non-overlapping-positional-regime-stability-v2",
  firstTargetDrawId:first,lastTargetDrawId:last,blockSize,blockOffset,minimumDrawSupport:minimum,regimes:summaries,
  limitations:[
   "Los bloques son consecutivos y no solapados. blockOffset desplaza sus límites respecto del primer concurso etiquetado; los extremos parciales se conservan y se identifican.",
   "Cada bloque se evalúa por soporte dentro del régimen; bloques insuficientes no participan en resúmenes de estabilidad.",
   "La consistencia dominante compara cada bloque con el dígito dominante del conjunto completo del régimen; es descriptiva y no una validación fuera de muestra.",
   "Los sorteos son secuenciales y pueden depender temporalmente; no se calculan p-valores ni intervalos que presupongan independencia.",
   "Una dominancia estable describe concentración observada, no demuestra sesgo físico ni capacidad predictiva."
  ]};
}
