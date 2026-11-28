import React, { useMemo, useState } from "react";
import type { Draw } from "./research-core";
import { buildDashboardOverview } from "./research/dashboard-overview";

type WindowSize = 50 | 100 | 250 | 500;
const pct = (value: number) => (value * 100).toFixed(1) + "%";
const signed = (value: number) => (value > 0 ? "+" : "") + value.toFixed(1) + " pp";

export default function ResearchSignalOverview({ draws }: { draws: Draw[] }) {
  const [windowSize, setWindowSize] = useState<WindowSize>(100);
  const [positionFilter, setPositionFilter] = useState<"all" | 0 | 1 | 2 | 3 | 4>("all");
  const report = useMemo(() => buildDashboardOverview(draws, windowSize), [draws, windowSize]);
  const positions = positionFilter === "all"
    ? report.positions
    : report.positions.filter((item) => item.position === positionFilter);
  const strongest = report.positions.flatMap((row) => row.digits.map((digit) => ({
    position: row.position, ...digit,
  }))).sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp))[0];

  if (!draws.length) return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <h3 className="font-semibold text-cyan-200">Lectura integrada de señales</h3>
      <p className="mt-2 text-sm text-slate-400">Importa o sincroniza el histórico para construir la comparación por posición.</p>
    </section>
  );

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-800/40 bg-slate-950/80 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-teal-300">Capa analítica conectada</div>
          <h3 className="mt-1 text-lg font-semibold text-white">Mapa de desplazamiento por posición</h3>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">Compara la frecuencia de cada dígito en la ventana reciente contra su frecuencia en todo el histórico disponible. Los cambios son descriptivos; no representan probabilidades ni ventaja predictiva.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="text-slate-400">Ventana
            <select value={windowSize} onChange={(event) => setWindowSize(Number(event.target.value) as WindowSize)} className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100">
              <option value={50}>50 sorteos</option><option value={100}>100 sorteos</option><option value={250}>250 sorteos</option><option value={500}>500 sorteos</option>
            </select>
          </label>
          <label className="text-slate-400">Posición
            <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value === "all" ? "all" : Number(event.target.value) as 0|1|2|3|4)} className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100">
              <option value="all">R1–R5</option><option value="0">R1</option><option value="1">R2</option><option value="2">R3</option><option value="3">R4</option><option value="4">R5</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">Muestra reciente</div><div className="mt-1 text-2xl font-bold text-white">{report.windowSize.toLocaleString()}</div><div className="text-[10px] text-slate-500">de {report.totalDraws.toLocaleString()} sorteos</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">Corte del histórico</div><div className="mt-1 text-2xl font-bold text-white">#{report.latestDrawId ?? "—"}</div><div className="text-[10px] text-slate-500">último concurso disponible</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">Mayor variación observada</div><div className="mt-1 text-2xl font-bold text-cyan-200">{strongest ? signed(strongest.deltaPp) : "—"}</div><div className="text-[10px] text-slate-500">{strongest ? "R" + (strongest.position + 1) + " · dígito " + strongest.digit : "sin muestra"}</div></div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-900 text-slate-400"><tr><th className="p-3 text-left">Posición</th><th className="p-3 text-left">Dígito</th><th className="p-3 text-right">Reciente</th><th className="p-3 text-right">Histórico</th><th className="p-3 text-right">Variación</th><th className="p-3 text-left">Intensidad relativa</th></tr></thead>
          <tbody>
            {positions.flatMap((row) => [...row.digits].sort((a,b) => Math.abs(b.deltaPp)-Math.abs(a.deltaPp)).map((item) => {
              const intensity = Math.min(1, Math.abs(item.deltaPp) / 12);
              const color = item.deltaPp >= 0 ? "45,212,191" : "251,191,36";
              return <tr key={row.position + "-" + item.digit} className="border-t border-slate-800/80">
                <td className="p-2.5 font-semibold text-teal-200">R{row.position + 1}</td><td className="p-2.5 font-mono font-bold text-white">{item.digit}</td>
                <td className="p-2.5 text-right text-slate-200">{item.recentCount} <span className="text-slate-500">({pct(item.recentRate)})</span></td>
                <td className="p-2.5 text-right text-slate-400">{item.historicalCount} <span className="text-slate-600">({pct(item.historicalRate)})</span></td>
                <td className="p-2.5 text-right font-mono" style={{ color: item.deltaPp >= 0 ? "#5eead4" : "#fcd34d" }}>{signed(item.deltaPp)}</td>
                <td className="p-2.5"><div className="h-2 min-w-24 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full" style={{ width: Math.max(2, intensity * 100) + "%", background: "rgba(" + color + "," + (0.35 + intensity * 0.65) + ")" }}/></div></td>
              </tr>;
            }))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500"><span>Verde: frecuencia reciente por encima de su tasa histórica · Ámbar: por debajo.</span><span>Referencia histórica inclusiva · sin prueba de significancia.</span></div>
    </section>
  );
}
