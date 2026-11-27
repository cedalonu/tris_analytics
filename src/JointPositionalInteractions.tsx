import React from "react";
export default function JointPositionalInteractions({report}:{report:any}){
 if(!report)return <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Importa el informe latest.json de la fase 117.</div>;
 const pct=(x:any)=>typeof x==="number"?(x*100).toFixed(2)+"%":"—";
 return <div className="space-y-4">
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   {[[ "Concursos",report.summary?.targetDraws],[ "Patrones evaluados",report.summary?.testedPatterns],[ "Significativos FDR",report.summary?.significantPatterns],[ "Sobre control 95%",report.summary?.patternsAboveControl]].map(([label,value]:any)=><div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><div className="text-xs text-slate-400">{label}</div><div className="mt-2 text-2xl font-bold">{value??"—"}</div></div>)}
  </div>
  <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-900 text-slate-400"><tr>{["Posiciones","N","Ocurrencias","Observada","Esperada indep.","Control medio","Control 95%","Lift","q FDR","Bloques"].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{(report.groups??[]).map((g:any)=><tr key={g.positions.join("-")} className="border-t border-slate-800"><td className="p-3 font-semibold">{g.positions.join(", ")}</td><td className="p-3">{g.size}</td><td className="p-3">{g.observedCount}</td><td className="p-3">{pct(g.observedRate)}</td><td className="p-3">{pct(g.independentExpectedRate)}</td><td className="p-3">{pct(g.controlMean)}</td><td className="p-3">{pct(g.controlLow)}–{pct(g.controlHigh)}</td><td className="p-3">{g.lift===null?"—":g.lift.toFixed(2)}</td><td className={g.significant?"p-3 text-emerald-300":"p-3"}>{g.qValue.toFixed(4)}</td><td className="p-3 text-slate-400">{g.blocks.map((b:any)=>pct(b.rate)).join(" / ")}</td></tr>)}</tbody></table></div>
  <p className="text-xs text-slate-500">La significancia se ajusta por FDR. El control conserva aproximadamente las propiedades individuales de cada posición, pero destruye su sincronía. No es un pronóstico.</p>
 </div>;
}
