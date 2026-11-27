import React, { useMemo, useState } from "react";
import { analyzeStructuralMotifs, type TriadType } from "./research/structural-motifs";
import { analyzeStructuralMotifTransitions, type MotifTransitionCategory } from "./research/structural-motif-transitions";
import type { HistoricalPackage } from "./research/historical-comparison";

const typeLabels: Record<TriadType, string> = { empty: "Sin conexiones", "single-edge": "Una conexión", wedge: "Abierta / cadena", triangle: "Triángulo cerrado" };
const categoryLabels: Record<MotifTransitionCategory, string> = { stable: "Estable", formation: "Aparición", dissolution: "Desaparición", reconfiguration: "Reconfiguración" };

export default function StructuralMotifTransitions({ items }: { items: HistoricalPackage[] }) {
  const [windowSize, setWindowSize] = useState(9);
  const [category, setCategory] = useState<MotifTransitionCategory | "all">("all");
  const [shape, setShape] = useState("all");
  const base = useMemo(() => analyzeStructuralMotifs(items, { windowSize, permutations: 499, seed: 840221 }), [items, windowSize]);
  const result = useMemo(() => base.valid ? analyzeStructuralMotifTransitions(base.windows) : null, [base]);
  if (!items.length) return null;
  const events = result?.transitions.flatMap(transition => transition.events) ?? [];
  const filtered = events.filter(event => (category === "all" || event.category === category) && (shape === "all" || (event.fromType ?? "none") + "->" + (event.toType ?? "none") === shape));
  const shapeOptions = [...new Set(events.map(event => (event.fromType ?? "none") + "->" + (event.toType ?? "none")))].sort();
  return <section className="mt-4 rounded-2xl border border-violet-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-violet-300">TRIS · FASE 84</div>
    <h2 className="mt-1 text-xl font-bold">Transiciones entre patrones estructurales</h2>
    <p className="mt-1 text-xs text-slate-400">Sigue cada tríada exacta entre ventanas consecutivas y distingue estabilidad, aparición, desaparición y cambio de forma. Solo compara identidades de tríos idénticas.</p>
    <label className="mt-3 inline-flex items-center gap-2 text-xs">Paquetes por ventana
      <select value={windowSize} onChange={event => setWindowSize(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1">{[9, 12, 15, 20, 30].map(size => <option key={size} value={size}>{size}</option>)}</select>
    </label>
    {result ? <>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([["Comparaciones", result.summary.comparisons], ["Eventos", result.summary.events], ["Estables", result.counts.stable], ["Reconfiguraciones", result.counts.reconfiguration]] as [string, number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([["Apariciones", result.counts.formation], ["Desapariciones", result.counts.dissolution], ["Persistencia*", (result.summary.persistenceRate * 100).toFixed(1) + "%"], ["Reconfiguración*", (result.summary.reconfigurationRate * 100).toFixed(1) + "%"]] as [string, string | number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950/70 p-2"><div className="text-[10px] text-slate-500">{label}</div><b className="text-sm tabular-nums">{value}</b></div>)}
      </div>
      <h3 className="mt-4 text-sm font-bold">Cambios de forma más frecuentes</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[420px] text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr>{["Forma anterior", "Forma posterior", "Frecuencia"].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead>
          <tbody>{result.shapeTransitions.slice(0, 12).map(row => <tr key={row.fromType + row.toType} className="border-t border-slate-800"><td className="p-2">{typeLabels[row.fromType]}</td><td className="p-2">{typeLabels[row.toType]}</td><td className="p-2 tabular-nums">{row.count}</td></tr>)}
          {result.shapeTransitions.length === 0 && <tr><td colSpan={3} className="p-3 text-slate-500">No hay tríadas comparables en las ventanas.</td></tr>}</tbody>
        </table>
      </div>
      <h3 className="mt-4 text-sm font-bold">Registro de transiciones</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <select value={category} onChange={event => setCategory(event.target.value as MotifTransitionCategory | "all")} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs"><option value="all">Todas las categorías</option>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <select value={shape} onChange={event => setShape(event.target.value)} className="max-w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs"><option value="all">Todas las formas</option>{shapeOptions.map(option => <option key={option} value={option}>{option.replace("none", "ausente").replace("->", " → ")}</option>)}</select>
      </div>
      <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-800">
        {filtered.slice(0, 300).map((event, index) => <div key={event.key + event.toWindow} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-2 text-xs">
          <div className="min-w-0"><b>{event.members.join(" · ")}</b><div className="text-slate-500">Ventana {event.fromWindow + 1} → {event.toWindow + 1} · {event.fromType ? typeLabels[event.fromType] : "No presente"} → {event.toType ? typeLabels[event.toType] : "No presente"}</div></div>
          <span className="rounded bg-slate-950 px-2 py-1">{categoryLabels[event.category]}</span>
        </div>)}
        {filtered.length === 0 && <p className="p-3 text-xs text-slate-500">No hay eventos para estos filtros.</p>}
        {filtered.length > 300 && <p className="p-2 text-[10px] text-slate-500">Se muestran los primeros 300 de {filtered.length} eventos.</p>}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">*Persistencia y reconfiguración se calculan solo sobre tríadas presentes en ambas ventanas. Aparición y desaparición pueden reflejar cambios en el conjunto de nodos, no necesariamente cambios de conexión. Las comparaciones son exactas por identidad; no emparejan tríadas distintas.</p>
    </> : <p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">Los cambios describen topología histórica calculada con conexiones respaldadas. No demuestran causalidad, anticipan resultados ni representan una ventaja predictiva.</p>
  </section>;
}
