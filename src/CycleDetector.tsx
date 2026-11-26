import React, { useMemo } from "react";
import { detectHistoricalCycles } from "./research/cycle-detector";
import type { HistoricalPackage } from "./research/historical-comparison";

export default function CycleDetector({ items }: { items: HistoricalPackage[] }) {
  const result = useMemo(() => detectHistoricalCycles(items), [items]);
  if (!items.length) return null;
  return <section className="mt-4 rounded-2xl border border-violet-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-violet-300">TRIS · FASE 72</div>
    <h2 className="mt-1 text-xl font-bold">Detector de ciclos y recurrencias</h2>
    <p className="mt-1 text-xs text-slate-400">Busca secuencias repetidas de clasificación y de dirección en los valores históricos.</p>
    {result.valid ? <>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {([["Hipótesis", result.summary.candidates], ["Con recurrencia", result.summary.detected], ["Ciclos de clasificación", result.summary.classificationCycles], ["Ciclos de dirección", result.summary.directionCycles], ["Historia insuficiente", result.summary.insufficient], ["Cambios de régimen", result.summary.regimeBreaks]] as [string, number][]).map(([label, value]) =>
          <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>
        )}
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-slate-950 text-slate-400"><tr>{["Hipótesis", "Base", "Período", "Repeticiones", "Cobertura", "Secuencia", "Cambios de régimen"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
          <tbody>{result.patterns.map((pattern, index) => <tr key={pattern.candidateKey + pattern.basis} className="border-t border-slate-800">
            <td className="p-3 font-semibold">{pattern.candidateKey}</td>
            <td className="p-3">{pattern.basis === "classification" ? "Clasificación" : "Dirección"}</td>
            <td className="p-3">{pattern.period}</td>
            <td className="p-3">{pattern.repetitions}</td>
            <td className="p-3">{(pattern.coverage * 100).toFixed(0)}%</td>
            <td className="p-3">{pattern.sequence.join(" → ")}</td>
            <td className="p-3">{pattern.regimeBreaks}</td>
          </tr>)}</tbody>
        </table>
        {!result.patterns.length && <p className="p-4 text-xs text-slate-500">No se detectaron secuencias recurrentes con los criterios actuales.</p>}
      </div>
    </> : <p role="alert" className="mt-3 text-xs text-amber-300">{result.errors.join(" · ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">Criterio exploratorio: período de 2 a 8 observaciones, al menos dos repeticiones y cobertura mínima del 80%. No se calcula significancia estadística ni se afirma periodicidad causal. Las ausencias no se rellenan y una secuencia constante no se etiqueta como ciclo.</p>
  </section>;
}
