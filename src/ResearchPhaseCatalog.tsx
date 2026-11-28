import React,{useMemo,useState} from "react";

type Phase={id:number;title:string;artifact:string;area:string};
const PHASES:Phase[]=[
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
{ id:41,title:"Integridad del ledger prospectivo",artifact:"docs/research-dashboard.md",area:"Prospectiva"},
{ id:42,title:"Cobertura de concursos",artifact:"docs/research-dashboard.md",area:"Prospectiva"},
{ id:43,title:"Desempeño por modalidad",artifact:"docs/research-dashboard.md",area:"Evaluación"},
{ id:44,title:"Estabilidad temporal del desempeño",artifact:"docs/research-dashboard.md",area:"Evaluación"},
{ id:45,title:"Sensibilidad temporal",artifact:"docs/research-dashboard.md",area:"Evaluación"},
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
{ id:100,title:"Centro de evidencia TRIS",artifact:"src/StructuralEvidenceCenter.tsx",area:"Evidencia"},
{ id:101,title:"Reproducibilidad estructural",artifact:"src/StructuralReproducibility.tsx",area:"Reproducibilidad"},
{ id:102,title:"Registro de experimentos",artifact:"src/StructuralExperimentLedger.tsx",area:"Experimentos"},
{ id:103,title:"Comparador de experimentos",artifact:"src/StructuralExperimentComparator.tsx",area:"Experimentos"},
{ id:104,title:"Comparación de snapshots",artifact:"src/StructuralExperimentSnapshotComparator.tsx",area:"Experimentos"},
{ id:105,title:"Evolución de experimentos",artifact:"src/StructuralExperimentEvolution.tsx",area:"Experimentos"},
{ id:106,title:"Persistencia de hallazgos",artifact:"src/StructuralFindingPersistence.tsx",area:"Hallazgos"},
{ id:107,title:"Consenso de hallazgos",artifact:"src/StructuralFindingConsensus.tsx",area:"Hallazgos"},
{ id:108,title:"Evolución y contradicciones de evidencia",artifact:"src/StructuralEvidenceEvolution.tsx",area:"Evidencia"},
{ id:109,title:"Ranking de estabilidad",artifact:"src/StructuralStabilityRanking.tsx",area:"Estabilidad"},
{ id:110,title:"Estabilidad prospectiva",artifact:"src/StructuralProspectiveStability.tsx",area:"Prospectiva"},
{ id:111,title:"Degradación y recuperación prospectiva",artifact:"src/StructuralProspectiveDegradation.tsx",area:"Prospectiva"},
{ id:112,title:"Comparación de regímenes históricos",artifact:"src/HistoricalRegimeComparison.tsx",area:"Regímenes"},
{ id:113,title:"Puntos de cambio posicionales",artifact:"src/PositionalChangePointDetection.tsx",area:"Posicional"},
{ id:114,title:"Coordinación entre posiciones",artifact:"src/PositionalCoordination.tsx",area:"Posicional"},
{ id:115,title:"Patrones secuenciales posicionales",artifact:"src/PositionalSequences.tsx",area:"Posicional"},
{ id:116,title:"Cambios posicionales condicionales",artifact:"src/ConditionalPositionChanges.tsx",area:"Posicional"},
{ id:117,title:"Interacciones posicionales conjuntas",artifact:"src/JointPositionalInteractions.tsx",area:"Dependencia"},
{ id:118,title:"Dependencia conjunta de dígitos",artifact:"src/JointDigitDependence.tsx",area:"Dependencia"},
{ id:119,title:"Validación temporal de dependencias",artifact:"src/JointDigitDependenceValidation.tsx",area:"Dependencia"}
];

export default function ResearchPhaseCatalog(){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|"connected"|"manual"|"pending">("all");
 const rows=useMemo(()=>PHASES.filter(p=>(filter==="all"||(filter==="connected"&&p.id>=100)||(filter==="manual"&&p.id>=41&&p.id<=45)||(filter==="pending"&&!(p.id>=100||(p.id>=41&&p.id<=45))))&&(!query||String(p.id).includes(query)||p.title.toLowerCase().includes(query.toLowerCase())||p.area.toLowerCase().includes(query.toLowerCase()))),[filter,query]);
 const connected=PHASES.filter(p=>p.id>=100).length;
 const manual=PHASES.filter(p=>p.id>=41&&p.id<=45).length;
 const pending=PHASES.length-connected-manual;
 return <section className="mt-5 rounded-2xl border border-cyan-900/60 bg-slate-900/70 p-4 md:p-5">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Inventario maestro · trazabilidad</div><h2 className="mt-1 text-xl font-bold">Fases de investigación localizadas</h2><p className="mt-1 max-w-3xl text-xs text-slate-400">Registro inicial basado en expedientes y componentes identificados en research-core-v1. Distingue presencia documental de conexión funcional; no declara validación científica.</p></div><span className="rounded-full border border-amber-800 px-3 py-1 text-[11px] text-amber-300">{pending} por integrar o auditar</span></div>
  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4"><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500">Expedientes listados</div><b className="text-2xl">{PHASES.length}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-emerald-300">Vista conectada al Centro</div><b className="text-2xl">{connected}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-amber-300">Importación manual</div><b className="text-2xl">{manual}</b></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-rose-300">Pendiente de integración</div><b className="text-2xl">{pending}</b></div></div>
  <div className="mt-4 flex flex-wrap gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar fase, tema o número…" className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"/>{([["all","Todas"],["connected","Conectadas"],["manual","Carga manual"],["pending","Pendientes"]] as const).map(([k,label])=><button key={k} onClick={()=>setFilter(k)} className={`rounded-lg border px-3 py-2 text-xs ${filter===k?"border-cyan-500 bg-cyan-950/40 text-cyan-200":"border-slate-700 text-slate-400"}`}>{label}</button>)}</div>
  <div className="mt-3 max-h-[520px] overflow-y-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-950 text-slate-500"><tr><th className="p-3">Fase</th><th className="p-3">Investigación</th><th className="p-3">Área</th><th className="p-3">Situación</th><th className="p-3">Artefacto de referencia</th></tr></thead><tbody>{rows.map(p=>{const connected=p.id>=100,manual=p.id>=41&&p.id<=45;return <tr key={p.id} className="border-t border-slate-800"><td className="p-3 font-mono text-cyan-300">{p.id}</td><td className="p-3 font-medium text-slate-200">{p.title}</td><td className="p-3 text-slate-400">{p.area}</td><td className="p-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${connected?"border-emerald-800 text-emerald-300":manual?"border-amber-800 text-amber-300":"border-rose-900 text-rose-300"}`}>{connected?"Vista conectada":manual?"Importación manual":"Integración por verificar"}</span></td><td className="p-3 font-mono text-[10px] text-slate-500 break-all">{p.artifact}</td></tr>})}</tbody></table>{rows.length===0&&<p className="p-6 text-center text-xs text-slate-500">No hay fases que coincidan con el filtro.</p>}</div>
  <p className="mt-3 text-[10px] text-slate-500">Importante: “vista conectada” indica que el Centro contiene un componente para esa familia; no garantiza que el informe esté cargado ni que la evidencia sea suficiente. Las fases no listadas en este primer inventario deben reconciliarse antes de declararlas inexistentes.</p>
 </section>;
}
