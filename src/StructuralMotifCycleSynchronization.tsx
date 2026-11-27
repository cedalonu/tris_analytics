import React, { useMemo, useState } from "react";
import { analyzeStructuralMotifs } from "./research/structural-motifs";
import { analyzeMotifCycleSynchronization } from "./research/structural-motif-cycle-synchronization";
import type { HistoricalPackage } from "./research/historical-comparison";

export default function StructuralMotifCycleSynchronization({ items }: { items: HistoricalPackage[] }) {
 const [windowSize,setWindowSize]=useState(9);
 const [period,setPeriod]=useState("all");
 const [minimum,setMinimum]=useState(2);
 const base=useMemo(()=>analyzeStructuralMotifs(items,{windowSize,permutations:499,seed:870221}),[items,windowSize]);
 const result=useMemo(()=>base.valid?analyzeMotifCycleSynchronization(base.windows,{minPeriod:period==="all"?2:Number(period),maxPeriod:period==="all"?4:Number(period),minRepetitions:minimum}):null,[base,period,minimum]);
 if(!items.length)return null;
 const rows=result?.pairs??[];
 return <section className="mt-4 rounded-2xl border border-fuchsia-900/60 bg-slate-900/70 p-4">
  <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">TRIS · FASE 87</div>
  <h2 className="mt-1 text-xl font-bold">Sincronización entre ciclos estructurales</h2>
  <p className="mt-1 text-xs text-slate-400">Compara ciclos de tríadas distintas por coincidencia temporal, periodo y secuencia de tipos (incluidas rotaciones equivalentes).</p>
  <div className="mt-3 flex flex-wrap gap-3 text-xs">
   <label className="inline-flex items-center gap-2">Paquetes por ventana<select value={windowSize} onChange={e=>setWindowSize(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1">{[9,12,15,20,30].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <label className="inline-flex items-center gap-2">Periodo<select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded border border-slate-700 bg-slate-950 p-1"><option value="all">2–4</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
   <label className="inline-flex items-center gap-2">Repeticiones mínimas<select value={minimum} onChange={e=>setMinimum(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1"><option value={2}>2</option><option value={3}>3</option></select></label>
  </div>
  {result?<>
   <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
    {([["Ciclos detectados",result.summary.cycleCount],["Pares comparables",result.summary.pairedCycles],["Tríadas implicadas",result.summary.uniqueTriads],["Sincronía media",result.summary.meanSynchronization.toFixed(3)]] as [string,string|number][]).map(([label,value])=><div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
   </div>
   <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400"><span>Coincidencia alta: {result.summary.counts.alineada}</span><span>Parcial: {result.summary.counts.parcial}</span><span>Desfasada: {result.summary.counts.desfasada}</span></div>
   <h3 className="mt-4 text-sm font-bold">Pares de ciclos</h3>
   <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-800">
    {rows.slice(0,300).map((pair,index)=><div key={pair.left.key+"|"+pair.right.key+"|"+pair.left.startWindow+"|"+pair.right.startWindow} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-2 text-xs"><div><b>{pair.left.members.join(" · ")}</b><span className="mx-2 text-slate-500">↔</span><b>{pair.right.members.join(" · ")}</b><div className="mt-1 text-slate-400">Ventanas compartidas: {pair.overlapWindows}/{pair.unionWindows} · desfase inicial: {pair.startLag}</div></div><div className="text-right"><b>{pair.classification} · {pair.synchronizationScore.toFixed(3)}</b><div className="text-slate-500">Periodos {pair.left.period}/{pair.right.period} · secuencia equivalente: {pair.sameSequenceUpToRotation?"sí":"no"}</div></div></div>)}
    {rows.length===0&&<p className="p-3 text-xs text-slate-500">No hay pares de ciclos con solapamiento suficiente.</p>}
    {rows.length>300&&<p className="p-2 text-[10px] text-slate-500">Se muestran los primeros 300 de {rows.length} pares.</p>}
   </div>
   <h3 className="mt-4 text-sm font-bold">Actividad por ventana</h3>
   <div className="flex flex-wrap gap-2">{result.activeByWindow.map(point=><div key={point.window} className="rounded-lg bg-slate-950 px-3 py-2 text-xs"><b>V{point.window+1}</b><div className="text-slate-400">{point.activeCycles} ciclos · {point.activeTriads} tríadas</div></div>)}</div>
  </>:<p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")}</p>}
  <p className="mt-3 text-[10px] text-slate-500">Índice heurístico: 50% solapamiento temporal + 25% igualdad de periodo + 25% equivalencia de secuencia. Describe coincidencia retrospectiva; no demuestra coordinación causal ni anticipa resultados.</p>
 </section>;
}
