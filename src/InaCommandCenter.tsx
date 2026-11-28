import React, { useMemo } from "react";
import type { ResearchOutput } from "./research/ina-contracts";
import type { InaTransitionKnowledge } from "./research/ina-positional-transitions";
import type { InaTransitionStabilityKnowledge } from "./research/ina-transition-stability";

type WindowSize = 50 | 150 | 500;
interface Props {
  output: ResearchOutput<InaTransitionKnowledge> | null;
  stabilityOutput: ResearchOutput<InaTransitionStabilityKnowledge> | null;
  windowSize: WindowSize;
  onWindowChange: (value: WindowSize) => void;
  focusedNode: string | null;
  onFocusNode: (value: string | null) => void;
  drawCount: number;
  drawStart: number | null;
  drawCutoff: number | null;
  sourceLabel: string;
  sourceFetchedAt: string;
  sha256: string;
}

const xs = [72, 232, 392, 552, 712];
const ys = Array.from({ length: 10 }, (_, digit) => 34 + digit * 29);
const nodeId = (position: number, digit: number) => `R${position + 1}-${digit}`;

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return <div className="ina-stat"><div className="ina-stat-label">{label}</div><div className="ina-stat-value">{value}</div>{note && <div className="ina-stat-note">{note}</div>}</div>;
}

export default function InaCommandCenter({
  output, stabilityOutput, windowSize, onWindowChange, focusedNode, onFocusNode,
  drawCount, drawStart, drawCutoff, sourceLabel, sourceFetchedAt, sha256,
}: Props) {
  const result = output?.result;
  const edges = result?.edges ?? [];
  const nodeCounts = result?.nodeCounts ?? Array.from({ length: 5 }, () => Array(10).fill(0));
  const maxCount = result?.maxCount ?? 1;
  const expected = result?.expectedPerPair ?? 0;
  const focus = focusedNode ? [Number(focusedNode.split("-")[0].replace("R", "")) - 1, Number(focusedNode.split("-")[1])] : null;
  const focusEdges = useMemo(() => focus ? edges.filter(edge =>
    (edge.p === focus[0] && edge.a === focus[1]) ||
    (edge.p + 1 === focus[0] && edge.b === focus[1])
  ) : [], [edges, focusedNode]);
  const topEdges = [...edges].sort((a, b) => b.n - a.n || a.key.localeCompare(b.key)).slice(0, 12);
  const focusedCount = focus ? nodeCounts[focus[0]]?.[focus[1]] ?? 0 : null;
  const activeEdges = focusedNode ? focusEdges : edges;
  const timeline = result?.edgeTimeline ?? [];
  const sparkline = (values: number[]) => {
    const max = Math.max(1, ...values);
    return values.map((value, index) => `${values.length > 1 ? 8 + index * 124 / (values.length - 1) : 70},${42 - value / max * 34}`).join(" ");
  };

  return <section className="ina-command space-y-4">
    <div className="ina-command-hero">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="ina-eyebrow">INA · CENTRAL KNOWLEDGE SYSTEM</div>
          <h2 className="mt-2 text-2xl font-bold text-white">Núcleo de inteligencia TRIS</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Red posicional construida con transiciones observadas entre R1–R5. Cada nodo y conexión procede del mismo snapshot validado por INA.</p>
        </div>
        <div className="ina-live"><span className="ina-live-dot"/>{output ? "SNAPSHOT CONECTADO" : "ESPERANDO DATOS"}</div>
      </div>
      <div className="ina-kpi-grid mt-5">
        <Stat label="Sorteos históricos" value={drawCount.toLocaleString("es-MX")} note={drawStart && drawCutoff ? `#${drawStart} → #${drawCutoff}` : "Sin corte disponible"}/>
        <Stat label="Ventana de red" value={result?.sampleSize ?? "—"} note={`Últimos ${windowSize} solicitados`}/>
        <Stat label="Conexiones observadas" value={edges.length.toLocaleString("es-MX")} note="De hasta 400 pares posibles"/>
        <Stat label="Corte INA" value={output?.drawCutoff ?? "—"} note={output?.evidence.status ?? "Sin evidencia"}/>
      </div>
    </div>

    <div className="ina-command-grid">
      <div className="ina-panel ina-network-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="ina-eyebrow">MAPA DE RELACIONES</div><h3 className="mt-1 text-lg font-semibold text-emerald-200">Red de transición posicional</h3></div>
          <label className="text-xs text-slate-400">Ventana
            <select value={windowSize} onChange={event => onWindowChange(Number(event.target.value) as WindowSize)} className="ml-2 rounded-lg border border-emerald-900 bg-slate-950 px-3 py-2 text-emerald-100">
              <option value={50}>50 sorteos</option><option value={150}>150 sorteos</option><option value={500}>500 sorteos</option>
            </select>
          </label>
        </div>
        <div className="ina-graph-wrap mt-4">
          <svg viewBox="0 0 784 340" role="img" aria-label="Red interactiva de transiciones observadas entre las cinco posiciones" className="ina-graph">
            <defs><radialGradient id="inaNodeGlow"><stop offset="0%" stopColor="#a7f3d0"/><stop offset="100%" stopColor="#0b3b38"/></radialGradient></defs>
            {activeEdges.map(edge => {
              const selected = focusedNode && (edge.from === focusedNode || edge.to === focusedNode);
              return <line key={edge.key} x1={xs[edge.p]} y1={ys[edge.a]} x2={xs[edge.p + 1]} y2={ys[edge.b]}
                stroke={edge.n > expected ? "#6ee7b7" : "#38bdf8"}
                strokeWidth={Math.max(0.8, Math.min(5.5, edge.n / maxCount * 5.5))}
                opacity={focusedNode ? (selected ? 0.9 : 0.08) : 0.12 + 0.72 * edge.n / maxCount}>
                <title>{`${edge.from} → ${edge.to}: ${edge.n} observaciones · ${edge.ratio.toFixed(2)}× referencia uniforme`}</title>
              </line>;
            })}
            {xs.map((x, position) => <g key={position}>
              <text x={x} y="16" textAnchor="middle" className="ina-svg-heading">R{position + 1}</text>
              {ys.map((y, digit) => {
                const id = nodeId(position, digit);
                const selected = focusedNode === id;
                const count = nodeCounts[position]?.[digit] ?? 0;
                const radius = 5 + 5 * count / Math.max(1, ...nodeCounts[position]);
                return <g key={id} role="button" tabIndex={0} aria-label={`Enfocar ${id}, ${count} apariciones`}
                  onClick={() => onFocusNode(selected ? null : id)}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onFocusNode(selected ? null : id); } }}
                  style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={selected ? radius + 3 : radius} fill={selected ? "url(#inaNodeGlow)" : "#082a30"} stroke={selected ? "#d1fae5" : "#4adebd"} strokeWidth={selected ? 2.4 : 1.1}/>
                  <text x={x} y={y + 3.5} textAnchor="middle" className="ina-svg-digit">{digit}</text>
                  <title>{`${id}: ${count} apariciones en ${result?.sampleSize ?? 0} sorteos`}</title>
                </g>;
              })}
            </g>)}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <span><i className="ina-legend-dot ina-legend-green"/> Sobre referencia uniforme</span>
          <span><i className="ina-legend-dot ina-legend-blue"/> Igual o bajo referencia</span>
          <span>Grosor = conteo observado</span>
          <button onClick={() => onFocusNode(null)} className="ml-auto rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-emerald-500">Quitar enfoque</button>
        </div>
      </div>

      <div className="ina-side-stack">
        <div className="ina-panel">
          <div className="ina-eyebrow">NODO SELECCIONADO</div>
          <h3 className="mt-1 text-lg font-semibold text-emerald-200">{focusedNode ?? "Vista general"}</h3>
          <div className="mt-3 text-3xl font-bold text-white">{focusedCount ?? edges.length}</div>
          <p className="mt-1 text-xs text-slate-500">{focusedNode ? "Apariciones del dígito en su posición dentro de la ventana." : "Conexiones distintas observadas entre posiciones consecutivas."}</p>
          {focusedNode && <div className="mt-3 space-y-2">{focusEdges.slice().sort((a,b)=>b.n-a.n).slice(0,6).map(edge=><div key={edge.key} className="flex justify-between gap-2 border-t border-slate-800 pt-2 text-xs"><span className="font-mono text-cyan-200">{edge.from} → {edge.to}</span><b className="text-emerald-200">{edge.n}</b></div>)}</div>}
        </div>
        <div className="ina-panel ina-timeline-panel">
          <div className="ina-eyebrow">EVOLUCIÓN TEMPORAL</div>
          <h3 className="mt-1 text-lg font-semibold text-emerald-200">Persistencia de conexiones</h3>
          <p className="mt-1 text-[10px] text-slate-500">Conteos por segmentos cronológicos dentro de la ventana elegida.</p>
          <div className="mt-3 space-y-3">{timeline.slice(0,4).map((series,index)=><div key={series.key} className="ina-spark-row">
            <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-cyan-100">{series.from} → {series.to}</span><b className="text-[10px] text-emerald-200">{series.values.reduce((a,b)=>a+b,0)}</b></div>
            <svg viewBox="0 0 140 48" role="img" aria-label={`Evolución de ${series.from} a ${series.to}`}><polyline points={sparkline(series.values)} fill="none" stroke={index%2===0?"#53efba":"#39bce5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{series.values.map((v,i)=><circle key={i} cx={series.values.length>1?8+i*124/(series.values.length-1):70} cy={42-v/Math.max(1,...series.values)*34} r="2" fill={index%2===0?"#a7f3d0":"#7dd3fc"}/>)}</svg>
          </div>)}</div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Serie descriptiva de frecuencia observada; no representa una proyección.</p>
        </div>
        <div className="ina-panel">
          <div className="ina-eyebrow">SEÑALES MÁS FRECUENTES</div>
          <h3 className="mt-1 text-lg font-semibold text-emerald-200">Conexiones destacadas</h3>
          <div className="mt-3 space-y-2">{topEdges.slice(0,6).map((edge,index)=><button key={edge.key} onClick={()=>onFocusNode(edge.from)} className="ina-edge-row">
            <span className="ina-edge-rank">{String(index+1).padStart(2,"0")}</span><span className="font-mono text-cyan-100">{edge.from} <span className="text-slate-600">→</span> {edge.to}</span><b>{edge.n}</b>
          </button>)}</div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Ordenadas por conteo bruto. No son probabilidades ni señales predictivas validadas.</p>
        </div>
      </div>
    </div>


    <div className="ina-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="ina-eyebrow">ESTABILIDAD Y DISPERSIÓN</div><h3 className="mt-1 text-lg font-semibold text-emerald-200">Cambios entre ventanas consecutivas</h3>
          <p className="mt-1 text-[10px] text-slate-500">Comparación INA de ventanas recientes y previas no superpuestas. Entropía normalizada de 0 a 1; descriptiva, no predictiva.</p></div>
        <span className="ina-evidence-tag">{stabilityOutput?.evidence.status ?? "SIN SALIDA"}</span>
      </div>
      {stabilityOutput ? <>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="ina-stat"><div className="ina-stat-label">Ventana reciente</div><div className="ina-stat-value">{stabilityOutput.result.recentDrawCount}</div><div className="ina-stat-note">#{stabilityOutput.result.recentStart ?? "—"} → #{stabilityOutput.result.recentCutoff ?? "—"}</div></div>
          <div className="ina-stat"><div className="ina-stat-label">Ventana anterior</div><div className="ina-stat-value">{stabilityOutput.result.previousDrawCount}</div><div className="ina-stat-note">#{stabilityOutput.result.previousStart ?? "—"} → #{stabilityOutput.result.previousCutoff ?? "—"}</div></div>
          <div className="ina-stat"><div className="ina-stat-label">Corte / versión</div><div className="ina-stat-value">#{stabilityOutput.drawCutoff ?? "—"}</div><div className="ina-stat-note">{stabilityOutput.datasetVersionId.slice(0, 24)}</div></div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div><div className="ina-eyebrow">ENTROPÍA POR POSICIÓN</div><div className="mt-2 space-y-2">
            {stabilityOutput.result.digitEntropy.map(row => <div key={row.p} className="grid grid-cols-[34px_1fr_52px] items-center gap-2 text-xs">
              <b className="font-mono text-emerald-200">R{row.p + 1}</b>
              <div className="h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{width: (row.recent * 100) + "%"}}/></div>
              <span className="text-right font-mono text-slate-300">{row.recent.toFixed(3)}</span>
              <span className="col-start-2 text-[10px] text-slate-600">Anterior {row.previous.toFixed(3)} · Δ {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(3)}</span>
            </div>)}
          </div></div>
          <div><div className="ina-eyebrow">MAYORES CAMBIOS DE TRANSICIÓN</div><div className="mt-2 space-y-1">
            {stabilityOutput.result.stability.filter(row => row.full + row.recent > 0).slice(0, 8).map(row => <div key={row.p + "-" + row.a + "-" + row.b} className="grid grid-cols-[1fr_42px_42px_76px] items-center gap-2 border-b border-slate-800/70 py-1.5 text-[11px]">
              <span className="font-mono text-cyan-100">R{row.p + 1} {row.a} → R{row.p + 2} {row.b}</span>
              <span className="text-right text-slate-400">{row.full}</span><span className="text-right text-slate-300">{row.recent}</span>
              <b className={row.delta >= 0 ? "text-emerald-300 text-right" : "text-sky-300 text-right"}>{row.delta >= 0 ? "+" : ""}{(row.delta * 100).toFixed(2)} pp</b>
            </div>)}
            <div className="grid grid-cols-[1fr_42px_42px_76px] gap-2 text-[9px] text-slate-600"><span>Conexión</span><span className="text-right">Prev.</span><span className="text-right">Rec.</span><span className="text-right">Δ tasa</span></div>
          </div></div>
        </div>
      </> : <p className="mt-3 text-xs text-slate-500">INA aún no dispone de una salida válida para comparar ventanas.</p>}
      <p className="mt-3 text-[10px] text-amber-200/60">Las diferencias de tasa y entropía describen cambios de la muestra. No implican que un dígito o conexión esté “por salir”.</p>
    </div>

    <div className="ina-panel">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="ina-eyebrow">MEMORIA Y PROCEDENCIA</div><h3 className="mt-1 text-lg font-semibold text-emerald-200">Identidad del conocimiento INA</h3></div><span className="ina-evidence-tag">DESCRIPTIVO · OBSERVADO</span></div>
      <div className="ina-provenance-grid mt-4">
        <div><span>Fuente / snapshot</span><b>{sourceLabel || "No identificada"}</b></div>
        <div><span>Última captura</span><b>{sourceFetchedAt ? new Date(sourceFetchedAt).toLocaleString("es-MX") : "—"}</b></div>
        <div><span>Rango de ventana</span><b>{result?.drawStart ?? "—"} → {result?.drawCutoff ?? "—"}</b></div>
        <div><span>Versión del dataset</span><b>{output?.datasetVersionId ?? "Sin snapshot"}</b></div>
        <div className="ina-hash"><span>SHA-256</span><b>{sha256 || "No disponible"}</b></div>
        <div><span>Motor</span><b>{output ? `${output.engineId} · v${output.engineVersion}` : "No calculado"}</b></div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-amber-200/70">Interpretación: las aristas cuentan pares de dígitos adyacentes observados. La referencia uniforme es aproximada; no prueba dependencia, causalidad ni capacidad para anticipar el siguiente sorteo.</p>
    </div>
  </section>;
}
