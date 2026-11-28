import React, { useMemo, useState } from "react";
import type { ResearchOutput } from "./research/ina-contracts";
import type { InaMemoryKnowledge } from "./research/ina-memory-state";
import type { MemoryScope, MemoryLag } from "./research/temporal-memory";
import type { ContextKind } from "./research/contextual-memory";

interface Props { output: ResearchOutput<InaMemoryKnowledge> | null }
const scopes: MemoryScope[] = ["all-history", "last-200", "last-1000"];
const lags: MemoryLag[] = [1,2,3,4,5];
const contextKinds: ContextKind[] = ["source-pool-size", "source-duplicate-count"];
const pct = (value: number) => (value * 100).toFixed(1) + "%";

export default function InaMemoryPanel({ output }: Props) {
  const [scope, setScope] = useState<MemoryScope>("all-history");
  const [lag, setLag] = useState<MemoryLag>(1);
  const [sourcePosition, setSourcePosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);
  const [contextKind, setContextKind] = useState<ContextKind>("source-pool-size");
  const temporalScope = output?.result.temporal.scopes.find(row => row.scope === scope)
    ?? output?.result.temporal.scopes[0];
  const contextualScope = output?.result.contextual.scopes.find(row => row.scope === scope)
    ?? output?.result.contextual.scopes[0];
  const temporal = temporalScope?.comparisons.find(row =>
    row.lag === lag && row.sourcePosition === sourcePosition && row.targetPosition === targetPosition
  );
  const contextual = contextualScope?.comparisons.find(row =>
    row.context === contextKind && row.lag === lag && row.sourcePosition === sourcePosition && row.targetPosition === targetPosition
  );
  const strongest = useMemo(() => temporal?.strongestTransitions ?? [], [temporal]);
  const maxCount = Math.max(1, ...strongest.map(row => row.count));
  const warnings = output?.warnings.slice(0,3) ?? [];

  return <section className="rounded-2xl border border-emerald-900/60 bg-slate-950/80 p-4 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">INA · memoria temporal y contextual</div>
        <h3 className="mt-1 text-lg font-bold text-white">Memoria de señales</h3>
        <p className="mt-1 max-w-3xl text-xs text-slate-400">Dependencias observadas entre posiciones y sorteos separados por rezagos exactos. La memoria descriptiva no implica capacidad predictiva.</p>
      </div>
      {output && <div className="text-right text-[10px] text-slate-500">INA {output.datasetVersionId.slice(0,20)} · corte #{output.drawCutoff ?? "—"} · n={output.sampleSize} · SHA {output.snapshotSha256.slice(0,10)}</div>}
    </div>
    {!output ? <p className="text-sm text-slate-500">Esperando contexto INA validado.</p> : <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] text-slate-400">Alcance
          <select value={scope} onChange={e=>setScope(e.target.value as MemoryScope)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            {scopes.map(value=><option key={value} value={value} disabled={!output.result.temporal.scopes.some(row=>row.scope===value)}>{value==="all-history"?"Todo el histórico":value==="last-200"?"Últimos 200":"Últimos 1,000"}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-slate-400">Rezago exacto
          <select value={lag} onChange={e=>setLag(Number(e.target.value) as MemoryLag)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            {lags.map(value=><option key={value} value={value}>−{value} sorteos</option>)}
          </select>
        </label>
        <label className="text-[11px] text-slate-400">Posición de origen
          <select value={sourcePosition} onChange={e=>setSourcePosition(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            {[0,1,2,3,4].map(value=><option key={value} value={value}>R{value+1}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-slate-400">Posición objetivo
          <select value={targetPosition} onChange={e=>setTargetPosition(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            {[0,1,2,3,4].map(value=><option key={value} value={value}>R{value+1}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] uppercase tracking-widest text-cyan-300">Memoria temporal</div>
          <h4 className="mt-1 font-semibold text-white">R{sourcePosition+1} → R{targetPosition+1}</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div><div className="text-[10px] text-slate-500">Observaciones</div><b className="text-xl text-cyan-100">{temporal?.observations.toLocaleString("es-MX") ?? "—"}</b></div>
            <div><div className="text-[10px] text-slate-500">Información mutua</div><b className="text-xl text-cyan-100">{temporal?.mutualInformationBits.toFixed(4) ?? "—"} bits</b></div>
            <div><div className="text-[10px] text-slate-500">Entropía condicional</div><b className="text-sm text-slate-200">{temporal?.conditionalEntropyBits.toFixed(4) ?? "—"} bits</b></div>
            <div><div className="text-[10px] text-slate-500">Misma cifra (misma posición)</div><b className="text-sm text-slate-200">{temporal && sourcePosition===targetPosition ? pct(temporal.sameDigitRate) : "No aplica"}</b></div>
          </div>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Transiciones con mayor soporte</div>
          {strongest.length ? <div className="mt-2 space-y-2">{strongest.slice(0,8).map(row=><div key={row.from+"-"+row.to}>
            <div className="flex justify-between gap-2 text-[11px]"><span className="text-slate-300">{row.from} → {row.to}</span><span className="text-cyan-200">{row.count} · {pct(row.conditionalRate)}</span></div>
            <div className="mt-1 h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-cyan-400" style={{width:(row.count/maxCount*100)+"%"}}/></div>
          </div>)}</div> : <p className="mt-2 text-xs text-slate-500">Sin transiciones que superen el umbral de soporte.</p>}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="text-[10px] uppercase tracking-widest text-violet-300">Memoria contextual</div><h4 className="mt-1 font-semibold text-white">Contexto del sorteo de origen</h4></div>
            <select value={contextKind} onChange={e=>setContextKind(e.target.value as ContextKind)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white">
              <option value="source-pool-size">Tamaño de pool</option><option value="source-duplicate-count">Cantidad de duplicados</option>
            </select>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div><div className="text-[10px] text-slate-500">Observaciones</div><b className="text-xl text-violet-100">{contextual?.observations.toLocaleString("es-MX") ?? "—"}</b></div>
            <div><div className="text-[10px] text-slate-500">Información mutua</div><b className="text-xl text-violet-100">{contextual?.contextMutualInformationBits.toFixed(4) ?? "—"} bits</b></div>
          </div>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Distribución por contexto</div>
          <div className="mt-2 space-y-2">{contextual?.buckets.map(bucket=><div key={bucket.contextValue} className="rounded-lg border border-slate-800 p-2">
            <div className="flex justify-between text-[11px]"><b className="text-violet-200">Contexto {bucket.contextValue}</b><span className="text-slate-400">n={bucket.observations} · entropía {bucket.targetEntropyBits.toFixed(3)}</span></div>
            <div className="mt-2 grid grid-cols-10 gap-1">{bucket.targetDistribution.map((rate,digit)=><div key={digit} title={"Dígito "+digit+": "+pct(rate)} className="h-7 rounded-sm flex items-end justify-center text-[9px] text-white" style={{background:"rgba(139,92,246,"+(.12+.75*rate)+")"}}>{digit}</div>)}</div>
            <div className="mt-1 text-[10px] text-slate-500">Dígitos destacados: {bucket.strongestTargetDigits.map(row=>row.digit+" ("+row.count+")").join(" · ") || "sin soporte"}</div>
          </div>) ?? <p className="text-xs text-slate-500">No hay buckets con soporte suficiente.</p>}</div>
        </div>
      </div>
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Límites de evidencia</div>
        <ul className="mt-1 list-disc pl-4 text-[10px] leading-relaxed text-amber-100/70">{warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>
      </div>
    </>}
  </section>;
}
