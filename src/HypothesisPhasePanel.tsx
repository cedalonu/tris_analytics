import React,{useMemo} from "react";
import {RESEARCH_HYPOTHESES} from "./research/hypothesis-catalog";
import HypothesisWorkspace from "./HypothesisWorkspace";
import HypothesisMonitor from "./HypothesisMonitor";
const stages=[["positional","Posicional"],["temporal","Temporal"],["dependence","Dependencia"],["structure","Estructural"],["prospective","Prospectiva"]] as const;
export default function HypothesisPhasePanel({onClose}:{onClose:()=>void}){
 const counts=useMemo(()=>stages.map(([key,label])=>({key,label,count:RESEARCH_HYPOTHESES.filter(h=>h.stage===key).length})),[]);
 const total=RESEARCH_HYPOTHESES.length;
 const [showMonitor,setShowMonitor]=React.useState(false);
 if(showMonitor)return <HypothesisMonitor onBack={()=>setShowMonitor(false)}/>;
 return <div className="fixed inset-0 z-[135] overflow-y-auto bg-[#050912]/95 p-3 md:p-6 text-slate-100"><div className="mx-auto max-w-6xl rounded-2xl border border-violet-800/60 bg-slate-950 shadow-2xl">
 <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 p-4"><div><div className="text-[10px] uppercase tracking-[.2em] text-violet-300">Checkpoint 02 · Hipótesis</div><h2 className="text-xl font-black">Generación y selección de hipótesis</h2><p className="mt-1 text-xs text-slate-400">Catálogo exploratorio preregistrado · selección por tema · criterios falsables</p></div><button onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Cerrar ×</button></header>
 <div className="space-y-4 p-4 md:p-6"><section className="grid gap-3 md:grid-cols-[1fr_2fr]"><div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4"><div className="text-xs uppercase text-amber-300">Estado de evidencia</div><div className="mt-2 text-3xl font-black">{total} exploratorias</div><p className="mt-1 text-xs text-slate-400">0 validadas · 0 con veredicto confirmado en esta pantalla</p></div><div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><h3 className="text-sm font-bold text-violet-200">Mapa por familia de investigación</h3><div className="mt-3 grid gap-2 sm:grid-cols-5">{counts.map((c)=><div key={c.key} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2"><div className="text-[10px] text-slate-400">{c.label}</div><div className="mt-1 text-lg font-bold">{c.count}</div><div className="mt-1 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-violet-500" style={{width:total?Math.max(4,c.count/total*100)+"%":"0%"}}/></div></div>)}</div><div className="mt-2 text-[10px] text-slate-500">El gráfico representa el inventario de hipótesis preregistradas, no resultados estadísticos.</div></div></section>
 <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-400">Selecciona una hipótesis para consultar pregunta, H₀, diseño, evidencia mínima, fases y salvaguarda.</p><button onClick={()=>setShowMonitor(true)} className="rounded-lg border border-cyan-800 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-950/30">Abrir monitor de expedientes históricos ↗</button></div>
 <HypothesisWorkspace/>
 <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-3 text-xs text-slate-300"><b className="text-rose-300">Regla de selección:</b> la hipótesis solo avanza tras evidencia reproducible, denominadores, controles nulos, validación cronológica/holdout y revisión. El catálogo no constituye predicción del próximo sorteo.</div>
 </div></div></div>;
}
