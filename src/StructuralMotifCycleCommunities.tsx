import React, { useMemo, useState } from "react";
import { analyzeStructuralMotifs } from "./research/structural-motifs";
import { analyzeMotifCycleSynchronization } from "./research/structural-motif-cycle-synchronization";
import { buildCycleCommunities } from "./research/structural-motif-cycle-communities";
import type { HistoricalPackage } from "./research/historical-comparison";

export default function StructuralMotifCycleCommunities({ items }: { items: HistoricalPackage[] }) {
 const [windowSize,setWindowSize]=useState(9);
 const [period,setPeriod]=useState("all");
 const [minimum,setMinimum]=useState(2);
 const [threshold,setThreshold]=useState(.45);
 const base=useMemo(()=>analyzeStructuralMotifs(items,{windowSize,permutations:499,seed:880221}),[items,windowSize]);
 const sync=useMemo(()=>base.valid?analyzeMotifCycleSynchronization(base.windows,{minPeriod:period==="all"?2:Number(period),maxPeriod:period==="all"?4:Number(period),minRepetitions:minimum}):null,[base,period,minimum]);
 const result=useMemo(()=>sync?buildCycleCommunities(sync.cycles,sync.pairs,threshold):null,[sync,threshold]);
 if(!items.length)return null;
 return <section className="mt-4 rounded-2xl border border-violet-900/60 bg-slate-900/70 p-4">
  <div className="text-[10px] font-black uppercase tracking-widest text-violet-300">TRIS · FASE 88</div>
  <h2 className="mt-1 text-xl font-bold">Mapa de comunidades de ciclos estructurales</h2>
  <p className="mt-1 text-xs text-slate-400">Convierte los pares de sincronización en una red: cada ciclo es un nodo y cada vínculo representa sincronía igual o superior al umbral.</p>
  <div className="mt-3 flex flex-wrap gap-3 text-xs">
   <label className="inline-flex items-center gap-2">Paquetes por ventana<select value={windowSize} onChange={e=>setWindowSize(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1">{[9,12,15,20,30].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   <label className="inline-flex items-center gap-2">Periodo<select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded border border-slate-700 bg-slate-950 p-1"><option value="all">2–4</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
   <label className="inline-flex items-center gap-2">Repeticiones mínimas<select value={minimum} onChange={e=>setMinimum(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1"><option value={2}>2</option><option value={3}>3</option></select></label>
   <label className="inline-flex items-center gap-2">Umbral de vínculo<select value={threshold} onChange={e=>setThreshold(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1"><option value={.35}>0.35</option><option value={.45}>0.45</option><option value={.55}>0.55</option><option value={.65}>0.65</option><option value={.75}>0.75</option></select></label>
  </div>
  {result?<>
   <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
    {([["Comunidades",result.summary.communityCount],["Conectadas",result.summary.connectedCommunities],["Ciclos aislados",result.summary.isolatedCycles],["Mayor comunidad",result.summary.largestCommunity],["Ciclos conectados",result.summary.cyclesInCommunities],["Densidad media",result.summary.meanDensity.toFixed(3)]] as [string,string|number][]).map(([label,value])=><div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
   </div>
   <h3 className="mt-4 text-sm font-bold">Comunidades detectadas</h3>
   <div className="mt-2 space-y-2">
    {result.communities.slice(0,100).map((community,index)=><article key={community.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
     <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">Comunidad {index+1} · {community.classification}</b><span className="text-xs text-violet-300">{community.cycleCount} ciclos · {community.uniqueTriads} tríadas</span></div>
     <div className="mt-1 text-xs text-slate-400">Vínculos: {community.edgeCount} · densidad: {community.density.toFixed(3)} · sincronía media: {community.meanScore.toFixed(3)} · grado máximo: {community.maxDegree}</div>
     {community.hub&&<div className="mt-2 text-xs"><span className="text-violet-300">Nodo central:</span> {community.hub.members.join(" · ")} · V{community.hub.startWindow+1}–V{community.hub.endWindow+1}</div>}
     <div className="mt-2 flex flex-wrap gap-1">{community.cycles.map(cycle=><span key={cycle.key+"|"+cycle.startWindow} className="rounded bg-slate-800 px-2 py-1 text-[10px]">{cycle.members.join("·")} · P{cycle.period} · V{cycle.startWindow+1}–{cycle.endWindow+1}</span>)}</div>
    </article>)}
    {result.communities.length===0&&<p className="text-xs text-slate-500">No se detectaron ciclos para los parámetros seleccionados.</p>}
    {result.communities.length>100&&<p className="text-[10px] text-slate-500">Se muestran las primeras 100 de {result.communities.length} comunidades.</p>}
   </div>
  </>:<p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")}</p>}
  <p className="mt-3 text-[10px] text-slate-500">Las comunidades son componentes conectados de una red construida con un umbral heurístico. La densidad y el nodo central describen la topología observada; no implican causalidad ni capacidad predictiva. Los resultados dependen de ventanas, umbral y detección previa de ciclos.</p>
 </section>;
}
