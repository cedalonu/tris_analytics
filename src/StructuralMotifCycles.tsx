import React, { useMemo, useState } from "react";
import { analyzeStructuralMotifs } from "./research/structural-motifs";
import { detectMotifCycles } from "./research/structural-motif-cycles";
import type { HistoricalPackage } from "./research/historical-comparison";

const names: Record<string, string> = { empty: "Sin aristas", "single-edge": "Una arista", wedge: "Abierta (cuña)", triangle: "Triángulo" };

export default function StructuralMotifCycles({ items }: { items: HistoricalPackage[] }) {
  const [windowSize, setWindowSize] = useState(9);
  const [period, setPeriod] = useState("all");
  const [minimum, setMinimum] = useState(2);
  const base = useMemo(() => analyzeStructuralMotifs(items, { windowSize, permutations: 499, seed: 860221 }), [items, windowSize]);
  const result = useMemo(() => base.valid ? detectMotifCycles(base.windows, { maxPeriod: period === "all" ? 4 : Number(period), minPeriod: period === "all" ? 2 : Number(period), minRepetitions: minimum }) : null, [base, period, minimum]);
  if (!items.length) return null;
  const cycles = result?.cycles ?? [];
  return <section className="mt-4 rounded-2xl border border-violet-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-violet-300">TRIS · FASE 86</div>
    <h2 className="mt-1 text-xl font-bold">Ciclos de configuración estructural</h2>
    <p className="mt-1 text-xs text-slate-400">Busca secuencias de tipos que se repiten para la misma tríada exacta en ventanas cronológicas consecutivas. La ausencia de la tríada interrumpe el ciclo.</p>
    <div className="mt-3 flex flex-wrap gap-3 text-xs">
      <label className="inline-flex items-center gap-2">Paquetes por ventana<select value={windowSize} onChange={event => setWindowSize(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1">{[9, 12, 15, 20, 30].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
      <label className="inline-flex items-center gap-2">Periodo<select value={period} onChange={event => setPeriod(event.target.value)} className="rounded border border-slate-700 bg-slate-950 p-1"><option value="all">2–4</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
      <label className="inline-flex items-center gap-2">Repeticiones mínimas<select value={minimum} onChange={event => setMinimum(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1"><option value={2}>2</option><option value={3}>3</option></select></label>
    </div>
    {result ? <>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([["Tríadas rastreadas", result.summary.trackedTriads], ["Ciclos detectados", result.summary.cycleCount], ["Tríadas cíclicas", result.summary.cyclicTriads], ["Repeticiones medias", result.summary.meanRepetitions.toFixed(2)]] as [string, string | number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
      </div>
      <h3 className="mt-4 text-sm font-bold">Secuencias encontradas</h3>
      <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-800">
        {cycles.slice(0, 300).map(cycle => <div key={cycle.key + cycle.startWindow + cycle.period} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-2 text-xs"><div><b>{cycle.members.join(" · ")}</b><div className="mt-1 text-slate-400">{cycle.sequence.map(type => names[type]).join(" → ")} → …</div></div><div className="text-right"><b>Periodo {cycle.period} · {cycle.repetitions} repeticiones</b><div className="text-slate-500">Ventanas {cycle.startWindow + 1}–{cycle.endWindow + 1} · {cycle.rightCensored ? "alcanza el final" : "tramo cerrado"}</div></div></div>)}
        {cycles.length === 0 && <p className="p-3 text-xs text-slate-500">No se detectaron ciclos con los filtros actuales.</p>}
        {cycles.length > 300 && <p className="p-2 text-[10px] text-slate-500">Se muestran los primeros 300 de {cycles.length} ciclos.</p>}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Ciclos por periodo: 2 = {result.summary.byPeriod[2]} · 3 = {result.summary.byPeriod[3]} · 4 = {result.summary.byPeriod[4]} · ciclos censurados al final: {result.summary.rightCensored}.</p>
    </> : <p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">Un ciclo es una repetición retrospectiva de configuraciones observadas; no implica periodicidad futura, causalidad ni capacidad predictiva.</p>
  </section>;
}
