import React, { useEffect, useMemo, useState } from "react";

type ProspectiveGroup = {
  key: string; family: string; config: string; forecasts: number; resolved: number; pending: number;
  candidateHits: number; baselineHits: number; candidateRate: number | null; baselineRate: number | null;
  pairedDifference: number | null; candidateOnlyWins: number; baselineOnlyWins: number;
};
type Payload = {
  schemaVersion: number; datasetVersionId: string; snapshotSha256: string; drawCutoff: number;
  sampleSize: number; generatedAt: string; warnings: string[];
  result: {
    cycles: number; frozenForecasts: number; resolvedForecasts: number; pendingForecasts: number;
    lastFrozenTargetDrawId: number | null; lastResolvedTargetDrawId: number | null;
    ledgerAudit: { summary: { integrity: string; issues: number; orphanResolutions: number } };
    performance: { summary: { groups: number; duplicateForecastIds: number; duplicateOrMismatchedResolutions: number }; groups: ProspectiveGroup[] };
  };
};
const percent = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";

export default function InaProspectivePanel() {
  const [payload,setPayload]=useState<Payload|null>(null);
  const [status,setStatus]=useState("Cargando evaluación congelada…");
  const [family,setFamily]=useState("all");
  const [sort,setSort]=useState("resolved");
  useEffect(()=>{
    let cancelled=false;
    fetch("./research-data/prospective-evaluation.json",{cache:"no-store"})
      .then(response=>{if(!response.ok)throw new Error("El informe prospectivo aún no está publicado.");return response.json() as Promise<Payload>;})
      .then(data=>{if(cancelled)return;setPayload(data);setStatus("Evaluación cargada desde el informe publicado.");})
      .catch(error=>{if(!cancelled)setStatus(error instanceof Error?error.message:"No se pudo cargar el informe prospectivo.");});
    return ()=>{cancelled=true;};
  },[]);
  const groups=useMemo(()=>{
    const rows=(payload?.result.performance.groups??[]).filter(row=>family==="all"||row.family===family);
    return rows.sort((a,b)=>sort==="difference"?(b.pairedDifference??-Infinity)-(a.pairedDifference??-Infinity):sort==="family"?a.family.localeCompare(b.family)||a.config.localeCompare(b.config):b.resolved-a.resolved);
  },[payload,family,sort]);
  const families=[...new Set((payload?.result.performance.groups??[]).map(row=>row.family))].sort();
  return <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/80 p-4 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">INA · evaluación prospectiva</div><h3 className="mt-1 text-lg font-bold text-white">Pronósticos congelados y resultados</h3><p className="mt-1 text-xs text-slate-400">Comparación por configuración exacta; cada predicción se conserva sin recalcularla después del resultado.</p></div>
      {payload&&<div className="text-right text-[10px] text-slate-500">Corte #{payload.drawCutoff} · n={payload.sampleSize} · SHA {payload.snapshotSha256.slice(0,12)}</div>}
    </div>
    {!payload?<div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">{status}</div>:<>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 p-3"><div className="text-[10px] text-slate-500">Ciclos congelados</div><div className="mt-1 text-2xl font-bold text-white">{payload.result.cycles}</div></div>
        <div className="rounded-xl border border-slate-800 p-3"><div className="text-[10px] text-slate-500">Pronósticos</div><div className="mt-1 text-2xl font-bold text-white">{payload.result.frozenForecasts.toLocaleString("es-MX")}</div></div>
        <div className="rounded-xl border border-slate-800 p-3"><div className="text-[10px] text-slate-500">Resueltos / pendientes</div><div className="mt-1 text-2xl font-bold text-white">{payload.result.resolvedForecasts.toLocaleString("es-MX")} / {payload.result.pendingForecasts.toLocaleString("es-MX")}</div></div>
        <div className="rounded-xl border border-slate-800 p-3"><div className="text-[10px] text-slate-500">Integridad del ledger</div><div className="mt-1 text-lg font-bold text-emerald-300">{payload.result.ledgerAudit.summary.integrity}</div><div className="text-[10px] text-slate-500">{payload.result.ledgerAudit.summary.issues} incidencias</div></div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-[11px] text-slate-400">Familia
          <select value={family} onChange={e=>setFamily(e.target.value)} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            <option value="all">Todas</option>{families.map(value=><option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-slate-400">Orden
          <select value={sort} onChange={e=>setSort(e.target.value)} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
            <option value="resolved">Mayor muestra resuelta</option><option value="difference">Diferencia pareada</option><option value="family">Familia y configuración</option>
          </select>
        </label>
        <span className="text-[10px] text-slate-500">{groups.length} configuraciones · último objetivo congelado #{payload.result.lastFrozenTargetDrawId??"—"} · último resuelto #{payload.result.lastResolvedTargetDrawId??"—"}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[850px] text-left text-[11px]">
          <thead className="bg-slate-900 text-slate-400"><tr><th className="p-2">Familia / configuración</th><th className="p-2 text-right">Resueltos</th><th className="p-2 text-right">Pendientes</th><th className="p-2">Candidato</th><th className="p-2">Baseline</th><th className="p-2 text-right">Δ pareada</th></tr></thead>
          <tbody>{groups.slice(0,40).map(row=><tr key={row.key} className="border-t border-slate-800 align-top">
            <td className="p-2"><div className="font-semibold text-slate-200">{row.family}</div><code className="mt-1 block max-w-[320px] break-all text-[9px] text-slate-500">{row.config}</code></td>
            <td className="p-2 text-right tabular-nums">{row.resolved}/{row.forecasts}</td><td className="p-2 text-right tabular-nums">{row.pending}</td>
            <td className="p-2"><div className="font-semibold text-cyan-200">{percent(row.candidateRate)}</div><div className="mt-1 h-1.5 w-24 rounded bg-slate-800"><div className="h-1.5 rounded bg-cyan-400" style={{width:Math.max(0,Math.min(100,(row.candidateRate??0)*100))+"%"}}/></div><div className="mt-1 text-[9px] text-slate-500">{row.candidateHits} aciertos</div></td>
            <td className="p-2"><div className="font-semibold text-violet-200">{percent(row.baselineRate)}</div><div className="mt-1 h-1.5 w-24 rounded bg-slate-800"><div className="h-1.5 rounded bg-violet-400" style={{width:Math.max(0,Math.min(100,(row.baselineRate??0)*100))+"%"}}/></div><div className="mt-1 text-[9px] text-slate-500">{row.baselineHits} aciertos</div></td>
            <td className={"p-2 text-right font-semibold tabular-nums "+((row.pairedDifference??0)>0?"text-emerald-300":(row.pairedDifference??0)<0?"text-rose-300":"text-slate-400")}>{row.pairedDifference===null?"—":(row.pairedDifference*100).toFixed(1)+" pp"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-[10px] leading-relaxed text-amber-100/70">
        No son probabilidades calibradas ni rendimiento económico. Las tasas son descriptivas, por configuración congelada; selección múltiple, dependencia temporal y tamaños de pool deben considerarse. El holdout y la evidencia prospectiva no se mezclan.
      </div>
    </>}
  </section>;
}
