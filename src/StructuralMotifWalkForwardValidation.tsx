import React,{useMemo}from"react";
import{validateMotifStructureWalkForward}from"./research/structural-motif-walk-forward-validation";
import{analyzeStructuralMotifs}from"./research/structural-motifs";
import type{HistoricalPackage}from"./research/historical-comparison";
export default function StructuralMotifWalkForwardValidation({items}:{items:HistoricalPackage[]}){
 const base=useMemo(()=>analyzeStructuralMotifs(items,{windowSize:9,permutations:499,seed:920221}),[items]);
 const result=useMemo(()=>base.valid?validateMotifStructureWalkForward(base.windows):null,[base]);
 if(!items.length)return null;
 const pct=(v:number|null)=>v===null?"—":(v*100).toFixed(2)+"%";
 return <section className="mt-4 rounded-2xl border border-sky-900/60 bg-slate-900/70 p-4">
 <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">TRIS · FASE 92</div>
 <h2 className="mt-1 text-xl font-bold">Validación temporal walk-forward</h2>
 <p className="mt-1 text-xs text-slate-400">Comprueba si la composición estructural de una ventana ayuda a anticipar la siguiente, comparándola con el promedio acumulado de ventanas anteriores.</p>
 {result?<><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">{[["Ventanas objetivo",result.summary.targets],["MAE último periodo",pct(result.summary.modelMae)],["MAE línea base",pct(result.summary.baselineMae)],["Skill relativo",pct(result.summary.skill)]].map(([l,v])=><div key={String(l)} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{l}</div><b className="text-xl tabular-nums">{v}</b></div>)}</div>
 <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr>{["Ventana objetivo","MAE modelo","MAE base","Skill"].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{result.points.map(p=><tr key={p.targetWindow} className="border-t border-slate-800"><td className="p-3">V{p.targetWindow+1}</td><td className="p-3">{pct(p.modelMae)}</td><td className="p-3">{pct(p.baselineMae)}</td><td className="p-3">{pct(p.skill)}</td></tr>)}</tbody></table></div>
 <div className="mt-3 grid gap-2 md:grid-cols-2"><div className="rounded-lg bg-slate-950 p-3 text-xs"><b>Primera mitad</b><p className="mt-1 text-slate-400">N={result.summary.firstHalf.targets} · skill {pct(result.summary.firstHalf.skill)}</p></div><div className="rounded-lg bg-slate-950 p-3 text-xs"><b>Segunda mitad</b><p className="mt-1 text-slate-400">N={result.summary.secondHalf.targets} · skill {pct(result.summary.secondHalf.skill)}</p></div></div>
 <p className="mt-3 text-xs text-slate-400">{result.summary.skillPositiveBothHalves?"La mejora relativa fue positiva en ambas mitades de esta muestra.":"No se observa mejora positiva en ambas mitades, o la muestra es insuficiente."}</p>
 </>:<p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")} Se requieren al menos dos ventanas.</p>}
 <p className="mt-3 text-[10px] text-slate-500">Alcance: predice tipos de motivos de la siguiente ventana, no dígitos ni resultados ganadores del TRIS. El objetivo futuro solo se usa para puntuar. MAE menor es mejor; skill positivo supera al promedio expansivo. Evaluación exploratoria, no evidencia de ventaja de apuesta.</p>
 </section>;
}
