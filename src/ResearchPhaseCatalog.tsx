import React,{useMemo,useState} from "react";

export type Phase={id:number;title:string;artifact:string;area:string;visual?:string};
export const PHASES:Phase[]=[
{ id:0,title:"Adaptador, importación e integridad",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Datos"},
{ id:1,title:"Investigación descriptiva, pools y memoria",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"INA"},
{ id:2,title:"Generación y selección de hipótesis",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Hipótesis"},
{ id:3,title:"Memoria de señales y ciclos prospectivos",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Memoria"},
{ id:4,title:"Memoria posicional y contextual",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Memoria"},
{ id:5,title:"Cambios por posición y calibración nula",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Regímenes"},
{ id:6,title:"Concordancia y evaluación integral",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Evaluación"},
{ id:7,title:"Walk-forward de carteras estructurales",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Carteras"},
{ id:8,title:"Benchmarks de presupuesto equivalente",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Carteras"},
{ id:9,title:"Estabilidad temporal de carteras",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Carteras"},
{ id:10,title:"Cartera prospectiva congelada",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Prospectiva"},
{ id:11,title:"Concordancia prospectiva por familia",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Prospectiva"},
{ id:12,title:"Calibración nula de concordancia",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Prospectiva"},
{ id:13,title:"Auditoría concordancia observada vs. nula",artifact:"docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md",area:"Prospectiva"},
{ id:23,title:"Perfiles de regímenes posicionales",artifact:"docs/phase-23-positional-regime-profiles.md",area:"Posicional"},
{ id:24,title:"Estabilidad de perfiles posicionales",artifact:"docs/phase-24-positional-regime-stability.md",area:"Posicional"},
{ id:25,title:"Calibración de estabilidad posicional",artifact:"docs/phase-25-positional-stability-calibration.md",area:"Posicional"},
{ id:26,title:"Contraste de perfiles entre regímenes",artifact:"docs/phase-26-positional-regime-contrast.md",area:"Posicional"},
{ id:27,title:"Persistencia de transiciones posicionales",artifact:"docs/phase-27-positional-transition-persistence.md",area:"Posicional"},
{ id:28,title:"Calibración de persistencia de transiciones",artifact:"docs/phase-28-positional-transition-calibration.md",area:"Posicional"},
{ id:29,title:"Concordancia entre posición y pools",artifact:"docs/phase-29-positional-pool-concordance.md",area:"Pools"},
{ id:30,title:"Estabilidad temporal de pools posicionales",artifact:"docs/phase-30-positional-pool-temporal-stability.md",area:"Pools"},
{ id:59,title:"Registro de decisiones",artifact:"docs/research/phase-59-decision-log.md",area:"Decisiones"},
{ id:60,title:"Comparación de decisiones",artifact:"docs/research/phase-60-decision-comparison.md",area:"Decisiones"},
{ id:61,title:"Robustez de parámetros",artifact:"docs/research/phase-61-parameter-robustness.md",area:"Decisiones"},
{ id:62,title:"Estabilidad de rankings",artifact:"docs/research/phase-62-rank-stability.md",area:"Estabilidad"},
{ id:63,title:"Estabilidad temporal de rankings",artifact:"docs/research/phase-63-temporal-rank-stability.md",area:"Estabilidad"},
{ id:64,title:"Degradación y recuperación",artifact:"docs/research/phase-64-degradation-recovery.md",area:"Estabilidad"},
{ id:65,title:"Diagnósticos consolidados",artifact:"docs/research/phase-65-consolidated-diagnostics.md",area:"Auditoría"},
{ id:66,title:"Auditoría cruzada",artifact:"docs/research/phase-66-cross-audit.md",area:"Auditoría"},
{ id:67,title:"Reproducibilidad",artifact:"docs/research/phase-67-reproducibility.md",area:"Reproducibilidad"},
{ id:68,title:"Comparación de reproducibilidad",artifact:"docs/research/phase-68-reproducibility-compare.md",area:"Reproducibilidad"},
{ id:70,title:"Comparación histórica",artifact:"docs/research/phase-70-historical-comparison.md",area:"Evolución"},
{ id:71,title:"Observador de evolución",artifact:"docs/research/phase-71-evolution-observer.md",area:"Evolución"},
{ id:72,title:"Detector de ciclos",artifact:"docs/research/phase-72-cycle-detector.md",area:"Ciclos"},
{ id:73,title:"Validación de ciclos",artifact:"docs/research/phase-73-cycle-validation.md",area:"Ciclos"},
{ id:74,title:"Relaciones entre hipótesis",artifact:"docs/research/phase-74-hypothesis-relations.md",area:"Hipótesis"},
{ id:75,title:"Red de hipótesis",artifact:"docs/research/phase-75-hypothesis-network.md",area:"Hipótesis"},
{ id:76,title:"Comunidades de hipótesis",artifact:"docs/research/phase-76-hypothesis-communities.md",area:"Hipótesis"},
{ id:77,title:"Evolución de comunidades",artifact:"docs/research/phase-77-community-evolution.md",area:"Comunidades"},
{ id:78,title:"Regímenes de comunidades",artifact:"docs/research/phase-78-community-regimes.md",area:"Comunidades"},
{ id:79,title:"Resiliencia de comunidades",artifact:"docs/research/phase-79-community-resilience.md",area:"Comunidades"},
{ id:80,title:"Vulnerabilidad de comunidades",artifact:"docs/research/phase-80-community-vulnerability.md",area:"Comunidades"},
{ id:81,title:"Propagación de comunidades",artifact:"docs/research/phase-81-community-propagation.md",area:"Comunidades"},
{ id:82,title:"Estabilidad de propagación",artifact:"docs/research/phase-82-propagation-stability.md",area:"Comunidades"},
{ id:83,title:"Motivos estructurales",artifact:"docs/research/phase-83-structural-motifs.md",area:"Estructuras"},
{ id:84,title:"Transiciones de motivos",artifact:"docs/research/phase-84-motif-transitions.md",area:"Estructuras"},
{ id:85,title:"Persistencia de motivos",artifact:"docs/research/phase-85-motif-persistence.md",area:"Estructuras"},
{ id:86,title:"Ciclos de motivos",artifact:"docs/research/phase-86-motif-cycles.md",area:"Estructuras"},
{ id:87,title:"Sincronización de ciclos",artifact:"docs/research/phase-87-cycle-synchronization.md",area:"Estructuras"},
{ id:88,title:"Comunidades de ciclos",artifact:"docs/research/phase-88-cycle-communities.md",area:"Estructuras"},
{ id:89,title:"Evolución de comunidades de ciclos",artifact:"docs/research/phase-89-cycle-community-evolution.md",area:"Estructuras"},
{ id:90,title:"Linajes de comunidades de ciclos",artifact:"docs/research/phase-90-cycle-community-lineages.md",area:"Estructuras"},
{ id:91,title:"Supervivencia de linajes",artifact:"docs/research/phase-91-cycle-lineage-survival.md",area:"Estructuras"},
{ id:92,title:"Validación walk-forward",artifact:"docs/research/phase-92-walk-forward-validation.md",area:"Validación"},
{ id:93,title:"Resultados prospectivos de motivos",artifact:"docs/research/phase-93-structural-motifs-prospective-outcomes.md",area:"Prospectiva"},
{ id:94,title:"Control aleatorio emparejado",artifact:"docs/research/phase-94-structural-motif-random-control.md",area:"Validación"},
{ id:95,title:"Robustez temporal de motivos",artifact:"docs/research/phase-95-structural-motif-temporal-robustness.md",area:"Validación"},
{ id:96,title:"Bootstrap por bloques",artifact:"docs/research/phase-96-structural-motif-block-bootstrap.md",area:"Validación"},
{ id:97,title:"Sensibilidad del bootstrap",artifact:"docs/research/phase-97-structural-motif-bootstrap-sensitivity.md",area:"Validación"},
{ id:98,title:"Estabilidad conjunta de motivos",artifact:"docs/research/phase-98-structural-motif-joint-stability.md",area:"Validación"},
{ id:99,title:"Auditoría de cadena de investigación",artifact:"docs/research/phase-99-structural-research-chain-audit.md",area:"Auditoría"},
{ id:100,title:"Centro de evidencia TRIS",artifact:"docs/research/phase-100-evidence-center.md",area:"Evidencia",visual:"src/StructuralEvidenceCenter.tsx"},
{ id:101,title:"Reproducibilidad estructural",artifact:"docs/research/phase-101-reproducibility.md",area:"Reproducibilidad",visual:"src/StructuralReproducibility.tsx"},
{ id:102,title:"Registro de experimentos",artifact:"docs/research/phase-102-structural-experiment-ledger.md",area:"Experimentos",visual:"src/StructuralExperimentLedger.tsx"},
{ id:103,title:"Comparador de experimentos",artifact:"docs/research/phase-103-experiment-comparator.md",area:"Experimentos",visual:"src/StructuralExperimentComparator.tsx"},
{ id:104,title:"Comparación de snapshots",artifact:"docs/research/phase-104-experiment-snapshot-comparison.md",area:"Experimentos",visual:"src/StructuralExperimentSnapshotComparator.tsx"},
{ id:105,title:"Evolución de experimentos",artifact:"docs/research/phase-105-experiment-evolution.md",area:"Experimentos",visual:"src/StructuralExperimentEvolution.tsx"},
{ id:106,title:"Persistencia de hallazgos",artifact:"docs/research/phase-106-finding-persistence.md",area:"Hallazgos",visual:"src/StructuralFindingPersistence.tsx"},
{ id:107,title:"Consenso de hallazgos",artifact:"docs/research/phase-107-experiment-consensus.md",area:"Hallazgos",visual:"src/StructuralFindingConsensus.tsx"},
{ id:108,title:"Evolución y contradicciones de evidencia",artifact:"docs/research/phase-108-evidence-evolution.md",area:"Evidencia",visual:"src/StructuralEvidenceEvolution.tsx"},
{ id:109,title:"Ranking de estabilidad",artifact:"docs/research/phase-109-stability-ranking.md",area:"Estabilidad",visual:"src/StructuralStabilityRanking.tsx"},
{ id:110,title:"Estabilidad prospectiva",artifact:"docs/research/phase-110-prospective-stability.md",area:"Prospectiva",visual:"src/StructuralProspectiveStability.tsx"},
{ id:111,title:"Degradación y recuperación prospectiva",artifact:"docs/research/phase-111-prospective-degradation-monitor.md",area:"Prospectiva",visual:"src/StructuralProspectiveDegradation.tsx"},
{ id:112,title:"Comparación de regímenes históricos",artifact:"docs/research/phase-112-historical-regime-comparison.md",area:"Regímenes",visual:"src/HistoricalRegimeComparison.tsx"},
{ id:113,title:"Puntos de cambio posicionales",artifact:"docs/research/phase-113-positional-change-points.md",area:"Posicional",visual:"src/PositionalChangePointDetection.tsx"},
{ id:114,title:"Coordinación entre posiciones",artifact:"docs/research/phase-114-positional-coordination.md",area:"Posicional",visual:"src/PositionalCoordination.tsx"},
{ id:115,title:"Patrones secuenciales posicionales",artifact:"docs/research/phase-115-positional-sequences.md",area:"Posicional",visual:"src/PositionalSequences.tsx"},
{ id:116,title:"Cambios posicionales condicionales",artifact:"docs/research/phase-116-conditional-position-changes.md",area:"Posicional",visual:"src/ConditionalPositionChanges.tsx"},
{ id:117,title:"Interacciones posicionales conjuntas",artifact:"docs/research/phase-117-joint-positional-interactions.md",area:"Dependencia",visual:"src/JointPositionalInteractions.tsx"},
{ id:118,title:"Dependencia conjunta de dígitos",artifact:"docs/research/phase-118-joint-digit-dependence.md",area:"Dependencia",visual:"src/JointDigitDependence.tsx"},
{ id:119,title:"Validación temporal de dependencias",artifact:"docs/research/phase-119-joint-digit-dependence-validation.md",area:"Dependencia",visual:"src/JointDigitDependenceValidation.tsx"}
];

export default function ResearchPhaseCatalog(){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|"visual"|"audit">("all");
 const rows=useMemo(()=>PHASES.filter(p=>(filter==="all"||(filter==="visual"&&!!p.visual)||(filter==="audit"&&!p.visual))&&(!query||String(p.id).includes(query)||p.title.toLowerCase().includes(query.toLowerCase())||p.area.toLowerCase().includes(query.toLowerCase()))),[filter,query]);
 const visualCount=PHASES.filter(p=>!!p.visual).length;
 const auditCount=PHASES.length-visualCount;
 return <section className="mt-5 rounded-2xl border border-cyan-900/60 bg-slate-900/70 p-4 md:p-5">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Inventario maestro · trazabilidad</div><h2 className="mt-1 text-xl font-bold">Fases de investigación localizadas</h2><p className="mt-1 max-w-3xl text-xs text-slate-400">Registro inicial basado en expedientes y componentes identificados en research-core-v1. Distingue presencia documental de conexión funcional; no declara validación científica.</p></div><span className="rounded-full border border-amber-800 px-3 py-1 text-[11px] text-amber-300">{PHASES.length} expedientes; montaje y conexión por verificar</span></div>
  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4"><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500">Expedientes listados</div><b className="text-2xl">{PHASES.length}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-cyan-300">Componente visual localizado</div><b className="text-2xl">{visualCount}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-amber-300">Sin componente visual catalogado</div><b className="text-2xl">{auditCount}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-rose-300">Conexión funcional verificada</div><b className="text-2xl">0</b></div></div>
  <div className="mt-4 flex flex-wrap gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar fase, tema o número…" className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"/>{([["all","Todas"],["visual","Con componente"],["audit","Sin componente"]] as const).map(([k,label])=><button key={k} onClick={()=>setFilter(k)} className={`rounded-lg border px-3 py-2 text-xs ${filter===k?"border-cyan-500 bg-cyan-950/40 text-cyan-200":"border-slate-700 text-slate-400"}`}>{label}</button>)}</div>
  <div className="mt-3 max-h-[520px] overflow-y-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-950 text-slate-500"><tr><th className="p-3">Fase</th><th className="p-3">Investigación</th><th className="p-3">Área</th><th className="p-3">Situación</th><th className="p-3">Artefacto de referencia</th></tr></thead><tbody>{rows.map(p=>{const hasVisual=!!p.visual;return <tr key={p.id} className="border-t border-slate-800"><td className="p-3 font-mono text-cyan-300">{p.id}</td><td className="p-3 font-medium text-slate-200">{p.title}</td><td className="p-3 text-slate-400">{p.area}</td><td className="p-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${hasVisual?"border-cyan-800 text-cyan-300":"border-amber-900 text-amber-300"}`}>{hasVisual?"Componente localizado · montaje por verificar":"Documento localizado · integración por auditar"}</span></td><td className="p-3 font-mono text-[10px] text-slate-500 break-all"><div>{p.artifact}</div>{p.visual&&<div className="mt-1 text-cyan-400">Vista: {p.visual}</div>}</td></tr>})}</tbody></table>{rows.length===0&&<p className="p-6 text-center text-xs text-slate-500">No hay fases que coincidan con el filtro.</p>}</div>
  <p className="mt-3 text-[10px] text-slate-500">Importante: la existencia del documento o del componente no demuestra montaje en una ruta activa, consumo de la salida correcta, procedencia INA ni paridad numérica. Los huecos 14–22, 31–58 y 69 siguen sin reconciliarse en este catálogo; no se consideran fases inexistentes. El programa 120 es un programa de cierre operativo, no una fase analítica adicional.</p>
 </section>;
}
