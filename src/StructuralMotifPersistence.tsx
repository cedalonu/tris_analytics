import React, { useMemo, useState } from "react";
import { analyzeStructuralMotifs } from "./research/structural-motifs";
import { analyzeMotifPersistence } from "./research/structural-motif-persistence";
import type { MotifTransitionCategory } from "./research/structural-motif-transitions";
import type { HistoricalPackage } from "./research/historical-comparison";
const labels: Record<Exclude<MotifTransitionCategory, "stable">, string> = { formation: "Aparición", dissolution: "Desaparición", reconfiguration: "Reconfiguración" };
export default function StructuralMotifPersistence({ items }: { items: HistoricalPackage[] }) {
  const [windowSize, setWindowSize] = useState(9);
  const [threshold, setThreshold] = useState(2);
  const [category, setCategory] = useState<MotifTransitionCategory | "all">("all");
  const base = useMemo(() => analyzeStructuralMotifs(items, { windowSize, permutations: 499, seed: 850221 }), [items, windowSize]);
  const result = useMemo(() => base.valid ? analyzeMotifPersistence(base.windows, threshold) : null, [base, threshold]);
  if (!items.length) return null;
  const episodes = result?.episodes.filter(episode => category === "all" || episode.category === category) ?? [];
  return <section className="mt-4 rounded-2xl border border-fuchsia-900/60 bg-slate-900/70 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">TRIS · FASE 85</div>
    <h2 className="mt-1 text-xl font-bold">Persistencia de transiciones estructurales</h2>
    <p className="mt-1 text-xs text-slate-400">Mide cuántas ventanas consecutivas se mantiene el estado posterior a una aparición, desaparición o reconfiguración. Distingue episodios observados completos de los que continúan al final del historial.</p>
    <div className="mt-3 flex flex-wrap gap-3 text-xs">
      <label className="inline-flex items-center gap-2">Paquetes por ventana<select value={windowSize} onChange={event => setWindowSize(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1">{[9, 12, 15, 20, 30].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
      <label className="inline-flex items-center gap-2">Umbral persistente<select value={threshold} onChange={event => setThreshold(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-950 p-1"><option value={2}>2 ventanas</option><option value={3}>3 ventanas</option><option value={4}>4 ventanas</option></select></label>
    </div>
    {result ? <>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {([["Tríadas rastreadas", result.summary.trackedTriads], ["Episodios de cambio", result.summary.changeEpisodes], ["Persistentes", result.summary.persistentEpisodes], ["Proporción persistente", (result.summary.persistentShare * 100).toFixed(1) + "%"]] as [string, string | number][]).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-950 p-3"><div className="text-[10px] text-slate-500">{label}</div><b className="text-xl tabular-nums">{value}</b></div>)}
      </div>
      <h3 className="mt-4 text-sm font-bold">Duración por tipo de cambio</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr>{["Evento","Episodios","Persistentes","Duración media","Máximo observado"].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{(Object.keys(labels) as Array<keyof typeof labels>).map(key => <tr key={key} className="border-t border-slate-800"><td className="p-2">{labels[key]}</td><td className="p-2">{result.byCategory[key].episodes}</td><td className="p-2">{result.byCategory[key].persistent}</td><td className="p-2">{result.byCategory[key].meanDuration.toFixed(2)} ventanas</td><td className="p-2">{result.byCategory[key].maxDuration}</td></tr>)}</tbody></table></div>
      <h3 className="mt-4 text-sm font-bold">Episodios observados</h3>
      <div className="mt-2 flex flex-wrap gap-2"><select value={category} onChange={event => setCategory(event.target.value as MotifTransitionCategory | "all")} className="rounded border border-slate-700 bg-slate-950 p-2 text-xs"><option value="all">Todos los eventos</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="self-center text-[10px] text-slate-500">{episodes.length} episodios</span></div>
      <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-800">
        {episodes.slice(0, 300).map((episode, index) => <div key={episode.key + episode.toWindow + episode.category} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-2 text-xs"><div className="min-w-0"><b>{episode.members.join(" · ")}</b><div className="text-slate-500">Ventana {episode.fromWindow + 1} → {episode.toWindow + 1} · {episode.fromType ?? "ausente"} → {episode.toType ?? "ausente"}</div></div><div className="text-right"><b>{episode.persistenceWindows} {episode.persistenceWindows === 1 ? "ventana" : "ventanas"}</b><div className="text-slate-500">{labels[episode.category]} · {episode.rightCensored ? "continúa al final" : "episodio cerrado"}</div></div></div>)}
        {episodes.length === 0 && <p className="p-3 text-xs text-slate-500">No hay episodios para este filtro.</p>}
        {episodes.length > 300 && <p className="p-2 text-[10px] text-slate-500">Se muestran los primeros 300 de {episodes.length} episodios.</p>}
      </div>
      <h3 className="mt-4 text-sm font-bold">Tramos de estabilidad</h3>
      <p className="mt-1 text-xs text-slate-400">Tríadas presentes con el mismo tipo durante dos o más ventanas consecutivas.</p>
      <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-800">{result.stableRuns.slice(0, 100).map(run => <div key={run.key + run.startWindow} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 p-2 text-xs"><b>{run.members.join(" · ")}</b><span>{run.length} ventanas · {run.rightCensored ? "continúa al final" : "tramo cerrado"}</span></div>)}{result.stableRuns.length === 0 && <p className="p-3 text-xs text-slate-500">No hay tramos de estabilidad de más de una ventana.</p>}</div>
      <p className="mt-2 text-[10px] text-slate-500">La duración se cuenta en ventanas, no en días. Los episodios presentes al inicio o que continúan al final están censurados por los límites del historial; el análisis no estima tiempos futuros.</p>
    </> : <p className="mt-3 text-xs text-amber-300">{base.errors.join(" ")}</p>}
    <p className="mt-3 text-[10px] text-slate-500">Persistencia describe continuidad observada, no probabilidad de repetición futura, causalidad ni capacidad predictiva.</p>
  </section>;
}
