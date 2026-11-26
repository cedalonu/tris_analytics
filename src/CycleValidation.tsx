import React, { useMemo, useState } from "react";
import { validateHistoricalCycles } from "./research/cycle-validation";
import type { HistoricalPackage } from "./research/historical-comparison";

export default function CycleValidation({ items }: { items: HistoricalPackage[] }) {
  const [permutations, setPermutations] = useState(499);
  const result = useMemo(() => validateHistoricalCycles(items, { permutations, seed: 721973 }), [items, permutations]);
  if (!items.length) return null;
  const statusLabel = { supported: "Respaldado", weak: "Débil", inconclusive: "No concluyente", "not-evaluable": "No evaluable" };
  const statusClass = { supported: "text-emerald-300", weak: "text-amber-300", inconclusive: "text-slate-300", "not-evaluable": "text-slate-500" };
  return <section className="mt-4 rounded-2xl border border-emerald-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">TRIS · FASE 73</div>
    <h2 className="mt-1 text-xl font-bold">Validación estadística de recurrencias</h2>
    <p className="mt-1 text-xs text-slate-400">Contrasta los ciclos detectados contra permutaciones que conservan las frecuencias observadas y comprueba su continuidad en un tramo temporal reservado.</p>
    <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">Permutaciones
      <select value={permutations} onChange={event => setPermutations(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">
        <option value={199}>199 · exploratorio</option><option value={499}>499 · estándar</option><option value={999}>999 · mayor resolución</option><option value={1999}>1999 · intensivo</option>
      </select>
    </label>
    {result.valid ? <>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        {([["Evaluados", result.summary.tested], ["Respaldados", result.summary.supported], ["Débiles", result.summary.weak], ["No concluyentes", result.summary.inconclusive], ["No evaluables", result.summary.notEvaluable]] as [string, number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-950 text-slate-400"><tr>{["Hipótesis", "Tipo", "Período", "Cobertura observada", "p ajustado", "Cobertura holdout", "Estado"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
          <tbody>{result.rows.map(row => <tr key={row.candidateKey + row.basis} className="border-t border-slate-800">
            <td className="p-3 font-semibold">{row.candidateKey}</td><td className="p-3">{row.basis === "classification" ? "Clasificación" : "Dirección"}</td><td className="p-3">{row.period}</td>
            <td className="p-3">{(row.observedCoverage * 100).toFixed(1)}%</td><td className="p-3">{row.adjustedPValue.toFixed(4)}</td><td className="p-3">{row.holdoutCoverage === null ? "N/D" : (row.holdoutCoverage * 100).toFixed(1) + "%"}</td>
            <td className={`p-3 font-semibold ${statusClass[row.status]}`}>{statusLabel[row.status]}</td>
          </tr>)}</tbody>
        </table>
        {!result.rows.length && <p className="p-4 text-xs text-slate-500">No hay recurrencias candidatas que validar.</p>}
      </div>
    </> : <p role="alert" className="mt-3 text-xs text-amber-300">{result.errors.join(" · ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">p ajustado por máximo estadístico global: cada permutación toma el mayor ajuste entre hipótesis, bases y períodos examinados, controlando la búsqueda múltiple bajo el nulo de permutabilidad. Holdout cronológico 60/40; se requiere al menos dos ciclos de entrenamiento y dos observaciones de prueba. "Respaldado" exige p ajustado ≤ 0.05 y cobertura holdout ≥ 80%. Prueba exploratoria, no causal ni predictiva; la autocorrelación, cambios de régimen y selección de paquetes pueden limitar la interpretación.</p>
  </section>;
}
