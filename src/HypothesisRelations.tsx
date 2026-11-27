import React, { useMemo, useState } from "react";
import { analyzeHypothesisRelations } from "./research/hypothesis-relations";
import type { HistoricalPackage } from "./research/historical-comparison";
export default function HypothesisRelations({ items }: { items: HistoricalPackage[] }) {
  const [permutations, setPermutations] = useState(499);
  const result = useMemo(() => analyzeHypothesisRelations(items, { permutations, seed: 740219 }), [items, permutations]);
  if (!items.length) return null;
  const labels = { supported: "Asociación respaldada", suggestive: "Sugestiva", inconclusive: "No concluyente", insufficient: "Datos insuficientes" };
  const styles = { supported: "text-emerald-300", suggestive: "text-amber-300", inconclusive: "text-slate-300", insufficient: "text-slate-500" };
  return <section className="mt-4 rounded-2xl border border-sky-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">TRIS · FASE 74</div>
    <h2 className="mt-1 text-xl font-bold">Analizador de relaciones entre hipótesis</h2>
    <p className="mt-1 text-xs text-slate-400">Compara cambios entre paquetes consecutivos, busca co-movimiento, estabilidad temporal y posibles desfases entre hipótesis.</p>
    <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">Permutaciones
      <select value={permutations} onChange={event => setPermutations(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">
        <option value={199}>199 · exploratorio</option><option value={499}>499 · estándar</option><option value={999}>999 · mayor resolución</option><option value={1999}>1999 · intensivo</option>
      </select>
    </label>
    {result.valid ? <>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        {([["Hipótesis", result.summary.hypotheses], ["Pares", result.summary.pairs], ["Respaldadas", result.summary.supported], ["Sugestivas", result.summary.suggestive], ["Insuficientes", result.summary.insufficient]] as [string, number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
      </div>
      <h3 className="mt-4 text-sm font-bold">Grupos de co-evolución respaldada</h3>
      {result.groups.length ? <div className="mt-2 flex flex-wrap gap-2">{result.groups.map((group, i) => <div key={i} className="rounded-lg border border-emerald-900 bg-slate-950 p-3 text-xs">{group.join(" · ")}</div>)}</div> : <p className="mt-2 text-xs text-slate-500">Aún no hay grupos que superen los criterios estadísticos.</p>}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[940px] text-left text-xs">
          <thead className="bg-slate-950 text-slate-400"><tr>{["Hipótesis A","Hipótesis B","Pares","Correlación Δ","Acuerdo direccional","p ajustado","1.ª mitad","2.ª mitad","Desfase A→B / B→A","Estado"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
          <tbody>{result.rows.map(row => <tr key={row.left + "|" + row.right} className="border-t border-slate-800">
            <td className="p-3 font-semibold">{row.left}</td><td className="p-3">{row.right}</td><td className="p-3">{row.observations}</td>
            <td className="p-3">{row.correlation === null ? "N/D" : row.correlation.toFixed(3)}</td><td className="p-3">{row.directionAgreement === null ? "N/D" : (row.directionAgreement * 100).toFixed(0) + "%"}</td>
            <td className="p-3">{row.adjustedPValue === null ? "N/D" : row.adjustedPValue.toFixed(4)}</td><td className="p-3">{row.firstHalfCorrelation === null ? "N/D" : row.firstHalfCorrelation.toFixed(2)}</td><td className="p-3">{row.secondHalfCorrelation === null ? "N/D" : row.secondHalfCorrelation.toFixed(2)}</td>
            <td className="p-3">{row.lagLeftLeads === null ? "N/D" : row.lagLeftLeads.toFixed(2)} / {row.lagRightLeads === null ? "N/D" : row.lagRightLeads.toFixed(2)}</td><td className={`p-3 font-semibold ${styles[row.status]}`}>{labels[row.status]}</td>
          </tr>)}</tbody>
        </table>
        {!result.rows.length && <p className="p-4 text-xs text-slate-500">Se requieren al menos dos hipótesis en el historial.</p>}
      </div>
    </> : <p role="alert" className="mt-3 text-xs text-amber-300">{result.errors.join(" · ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">Usa diferencias entre paquetes consecutivos y solo transiciones donde ambas hipótesis están presentes; no imputa ausencias. Correlación de Pearson con permutación independiente y ajuste max-statistic global entre pares. Se requieren 8 transiciones emparejadas; "respaldada" exige p ajustado ≤ 0.05, |r| ≥ 0.50 y mismo signo en ambas mitades. Los desfases son exploratorios, no prueban precedencia causal. Asociación no implica causalidad ni capacidad predictiva.</p>
  </section>;
}
