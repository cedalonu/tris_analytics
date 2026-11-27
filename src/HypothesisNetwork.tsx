import React, { useMemo, useState } from "react";
import { buildHypothesisNetwork } from "./research/hypothesis-network";
import type { HistoricalPackage } from "./research/historical-comparison";
export default function HypothesisNetwork({ items }: { items: HistoricalPackage[] }) {
 const [permutations,setPermutations]=useState(499),[selected,setSelected]=useState("");
 const result=useMemo(()=>buildHypothesisNetwork(items,{permutations,seed:740219}),[items,permutations]);
 if(!items.length)return null;
 const focus=result.valid?result.nodes.find(node=>node.id===selected):undefined;
 return <section className="mt-4 rounded-2xl border border-indigo-900/60 bg-slate-900/70 p-4">
  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">TRIS · FASE 75</div>
  <h2 className="mt-1 text-xl font-bold">Mapa de dependencias y redes de hipótesis</h2>
  <p className="mt-1 text-xs text-slate-400">Vista de red derivada de las asociaciones de la Fase 74. El tamaño del nodo refleja su número de conexiones; el grosor de la línea, la magnitud de la correlación.</p>
  <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">Permutaciones
   <select value={permutations} onChange={e=>setPermutations(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 px-2 py-1"><option value={199}>199 · exploratorio</option><option value={499}>499 · estándar</option><option value={999}>999 · mayor resolución</option><option value={1999}>1999 · intensivo</option></select>
  </label>
  {result.valid?<>
   <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
    {([["Nodos",result.summary.nodes],["Conexiones",result.summary.edges],["Respaldadas",result.summary.supported],["Sugestivas",result.summary.suggestive],["Componentes",result.summary.components],["Aisladas",result.summary.isolated]] as [string,number][]).map(([label,value])=><div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
   </div>
   <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400"><span><span className="mr-1 inline-block h-0.5 w-5 bg-emerald-400 align-middle"/>Asociación respaldada</span><span><span className="mr-1 inline-block h-0.5 w-5 border-t-2 border-dashed border-amber-400 align-middle"/>Sugestiva</span><span>Posición circular determinista · no representa dirección causal</span></div>
   <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
    {result.nodes.length?<svg viewBox="0 0 500 450" role="img" aria-label="Red de hipótesis asociadas" className="mx-auto block w-full max-w-[680px]">
     {result.edges.map(edge=>{const a=result.nodes.find(n=>n.id===edge.left)!,b=result.nodes.find(n=>n.id===edge.right)!;return <line key={edge.left+"|"+edge.right} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={edge.status==="supported"?"#34d399":"#fbbf24"} strokeWidth={1+Math.abs(edge.strength)*4} strokeDasharray={edge.status==="suggestive"?"6 5":undefined} opacity={0.8}/>;})}
     {result.nodes.map(node=><g key={node.id} onClick={()=>setSelected(node.id)} role="button" tabIndex={0} aria-label={"Seleccionar "+node.id}>
      <circle cx={node.x} cy={node.y} r={8+Math.min(node.degree,8)*1.8} fill={node.id===selected?"#a5b4fc":"#334155"} stroke={node.id===selected?"#c7d2fe":"#818cf8"} strokeWidth="2"/>
      <text x={node.x} y={node.y+3.5} textAnchor="middle" fontSize="9" fill="#fff">{node.id.length>14?node.id.slice(0,12)+"…":node.id}</text>
     </g>)}
    </svg>:<p className="p-8 text-center text-xs text-slate-500">No hay conexiones respaldadas o sugestivas que mostrar. Se necesitan hipótesis con historial suficiente.</p>}
   </div>
   <div className="mt-3 flex flex-wrap gap-2"><select value={selected} onChange={e=>setSelected(e.target.value)} className="min-w-[220px] rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs"><option value="">Seleccionar nodo para detalle</option>{result.nodes.map(n=><option key={n.id} value={n.id}>{n.id}</option>)}</select></div>
   {focus&&<div className="mt-2 rounded-xl border border-indigo-900 bg-slate-950 p-3 text-xs"><b>{focus.id}</b><p className="mt-1 text-slate-400">Conexiones: {focus.degree} · Respaldadas: {focus.supportedDegree} · Sugestivas: {focus.suggestiveDegree} · Centralidad ponderada (suma de |r|): {focus.weightedDegree.toFixed(3)}</p><div className="mt-2 space-y-1">{result.edges.filter(edge=>edge.left===focus.id||edge.right===focus.id).map(edge=><div key={edge.left+"|"+edge.right} className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-2"><span>{edge.left===focus.id?edge.right:edge.left}</span><span>{edge.status==="supported"?"Respaldada":"Sugestiva"} · r={edge.strength.toFixed(3)} · p={edge.adjustedPValue?.toFixed(4)??"N/D"} · {edge.persistent?"estable por mitades":"sin estabilidad confirmada"}</span></div>)}</div></div>}
  </>:<p role="alert" className="mt-3 text-xs text-amber-300">{result.errors.join(" · ")}</p>}
  <p className="mt-3 text-[10px] text-slate-500">La red muestra asociaciones, no dependencias causales. Solo dibuja conexiones respaldadas o sugestivas; los nodos aislados permanecen visibles. El orden circular es visual, no temporal. La centralidad resume conectividad en este conjunto de hipótesis y no implica importancia predictiva.</p>
 </section>;
}
