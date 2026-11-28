import React,{useMemo,useState} from "react";
import type {Draw} from "./tris-csv";
import type {Digit} from "./research-core";
import {assessSignal,type SignalRecord,type SignalStatus} from "./research/intuition-ledger";
import {analyzeTemporalMemory,type MemoryScope} from "./research/temporal-memory";
import {analyzeContextualMemory} from "./research/contextual-memory";
import type {ResearchPlan,PlannedHypothesis} from "./research/intuition-orchestrator";

type Props={draws:Draw[];onBack:()=>void;onOpenResearch:()=>void};
type Tab="overview"|"memory"|"hypotheses"|"positions";
type PositionMemoryRow={position:number;family:string;configuration:string;poolRegime:string;duplicateRegime:string;draws:number;candidateTrials:number;distinctCandidates:number;meanCandidateHitRate:number;meanBaselineHitRate:number;difference:number;latestBlock:{state:string;draws:number}|null;interpretation:string};
type PositionMemoryPayload={resolvedOutcomes:number;positionSpecificTrials:number;modeLevelTrials:number;minimumDrawsForSummary:number;blockSize:number;positions:PositionMemoryRow[];modeScopes:{mode:string;draws:number;candidateTrials:number;meanCandidateHitRate:number;meanBaselineHitRate:number;difference:number}[];warnings:string[]};
type InvestigatorSelectionRow={candidateId:string;family:"transition"|"position-mutation"|"absence-return"|"pool-ranking";config:Record<string,unknown>;priorityScore:number;reasons:string[]};
type InvestigatorVariantRow={candidateId:string;parentCandidateId:string;changedParameter:"window"|"priorMisses";fromValue:number;toValue:number;parentResolvedDraws:number;parentPairedWins:number;parentPairedLosses:number;parentShrunkAdvantage:number;proposalReason:string};
type InvestigatorPayload={generatedAt:string;targetDrawId:number;historyThroughDrawId:number;catalogSize:number;baseCatalogSize?:number;variantCount?:number;variants?:InvestigatorVariantRow[];budget:number;frozenCount:number;explorationCount:number;exploitationCount:number;retiredExcluded:number;familyCounts:Record<string,number>;selected:InvestigatorSelectionRow[];warnings:string[]};
const digits=Array.from({length:10},(_,i)=>i);
const statusLabels:Record<SignalStatus,string>={hypothesis:"Hipótesis",testing:"En prueba",provisional:"Provisional",active:"Activa",weakening:"Debilitándose",retired:"Retirada"};

function parseResearchPlan(value:unknown):ResearchPlan{
 if(!value||typeof value!=="object")throw new Error("El plan debe ser un objeto JSON.");
 const p=value as Record<string,unknown>;
 if(p.schemaVersion!=="1.0"||typeof p.createdAt!=="string"||!Number.isFinite(Date.parse(p.createdAt))||!Number.isInteger(p.catalogSize)||!Number.isInteger(p.selectedCount)||!Number.isInteger(p.budget)||!Array.isArray(p.hypotheses)||!Array.isArray(p.warnings)||!p.familyCounts||typeof p.familyCounts!=="object")throw new Error("El archivo no cumple el esquema ResearchPlan 1.0.");
 if(p.hypotheses.length!==p.selectedCount||Number(p.selectedCount)>Number(p.budget)||Number(p.selectedCount)>Number(p.catalogSize))throw new Error("Las cantidades declaradas no coinciden con las hipótesis del plan.");
 const ids=new Set<string>();
 const hypotheses=p.hypotheses.map((raw,index)=>{
  if(!raw||typeof raw!=="object")throw new Error("Hipótesis "+(index+1)+": registro inválido.");
  const h=raw as Record<string,unknown>,candidate=h.candidate as Record<string,unknown>|undefined;
  if(!candidate||typeof candidate.id!=="string"||!candidate.id||typeof candidate.title!=="string"||typeof candidate.description!=="string"||!candidate.config||typeof candidate.config!=="object"||typeof candidate.frozenConfig!=="string"||typeof h.frozenConfig!=="string"||h.frozenConfig!==candidate.frozenConfig||typeof h.priorityScore!=="number"||!Number.isFinite(h.priorityScore)||!Array.isArray(h.priorityReasons)||!h.priorityReasons.every(x=>typeof x==="string"))throw new Error("Hipótesis "+(index+1)+": campos o configuración congelada inválidos.");
  if(ids.has(candidate.id))throw new Error("ID de hipótesis duplicado: "+candidate.id);ids.add(candidate.id);
  if(!h.ledgerRecord||typeof h.ledgerRecord!=="object")throw new Error("Hipótesis "+candidate.id+": falta ledgerRecord.");
  const record=h.ledgerRecord as Record<string,unknown>;
  if(record.id!==candidate.id||!Array.isArray(record.evidence)||record.evidence.length!==0||record.status!=="hypothesis")throw new Error("Hipótesis "+candidate.id+": el registro inicial debe ser una hipótesis sin evidencia.");
  if(!["transition","position-mutation","absence-return","pool-ranking"].includes(String(candidate.family)))throw new Error("Hipótesis "+candidate.id+": familia desconocida.");
  return h as unknown as PlannedHypothesis;
 });
 const counts=p.familyCounts as Record<string,unknown>;
 for(const family of ["transition","position-mutation","absence-return","pool-ranking"])if(!Number.isInteger(counts[family])||Number(counts[family])<0)throw new Error("familyCounts inválido: "+family);
 if(hypotheses.reduce((sum,h)=>sum+1,0)!==Number(p.selectedCount))throw new Error("Conteo de selección inconsistente.");
 return {...p,hypotheses} as unknown as ResearchPlan;
}
function parseLedgerPayload(value:unknown):SignalRecord[]{
 const rows=Array.isArray(value)?value:(value&&typeof value==="object"&&Array.isArray((value as {signals?:unknown}).signals)?(value as {signals:unknown[]}).signals:value&&typeof value==="object"&&Array.isArray((value as {records?:unknown}).records)?(value as {records:unknown[]}).records:null);
 if(!rows)throw new Error("El JSON debe ser un arreglo de señales o contener signals[] / records[].");
 const statuses=new Set<SignalStatus>(["hypothesis","testing","provisional","active","weakening","retired"]);
 const phases=new Set(["exploration","validation","prospective"]);
 return rows.map((raw,index)=>{
  if(!raw||typeof raw!=="object")throw new Error("Registro "+(index+1)+": formato inválido.");
  const x=raw as Record<string,unknown>;
  if(typeof x.id!=="string"||!x.id.trim()||typeof x.description!=="string"||!statuses.has(x.status as SignalStatus)||typeof x.createdAt!=="string"||typeof x.updatedAt!=="string"||!Array.isArray(x.evidence))throw new Error("Registro "+(index+1)+": faltan campos requeridos del ledger.");
  if(!Number.isFinite(Date.parse(x.createdAt))||!Number.isFinite(Date.parse(x.updatedAt)))throw new Error("Registro "+(index+1)+": fecha inválida.");
  const evidence=x.evidence.map((rawEvidence,eIndex)=>{
   if(!rawEvidence||typeof rawEvidence!=="object")throw new Error("Evidencia "+(eIndex+1)+" del registro "+x.id+": formato inválido.");
   const e=rawEvidence as Record<string,unknown>;
   if(typeof e.id!=="string"||!e.id||!phases.has(String(e.phase))||typeof e.evaluatedAt!=="string"||!Number.isFinite(Date.parse(e.evaluatedAt)))throw new Error("Evidencia "+(eIndex+1)+" del registro "+x.id+": identificación, fase o fecha inválida.");
   for(const k of ["n","hits","baselineN","baselineHits"]){if(!Number.isInteger(e[k])||Number(e[k])<0)throw new Error("Evidencia "+e.id+": conteo "+k+" inválido.");}
   if(Number(e.hits)>Number(e.n)||Number(e.baselineHits)>Number(e.baselineN))throw new Error("Evidencia "+e.id+": los aciertos superan el soporte.");
   for(const k of ["discordantCandidateWins","discordantBaselineWins","testCount"])if(e[k]!==undefined&&(!Number.isInteger(e[k])||Number(e[k])<0||(k==="testCount"&&Number(e[k])<1)))throw new Error("Evidencia "+e.id+": "+k+" inválido.");
   return e;
  });
  return {...x,evidence} as unknown as SignalRecord;
 });
}

const tabs:{id:Tab;label:string;icon:string}[]=[
 {id:"overview",label:"Resumen",icon:"◈"},
 {id:"memory",label:"Memoria de señales",icon:"⌁"},
 {id:"hypotheses",label:"Hipótesis",icon:"◎"},
 {id:"positions",label:"Concordancia",icon:"▦"}
];
function Panel({title,sub,children}:{title:string;sub?:string;children:React.ReactNode}){return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5"><div className="mb-4"><h2 className="font-bold text-slate-100">{title}</h2>{sub&&<p className="mt-1 text-xs text-slate-400">{sub}</p>}</div>{children}</section>}
function Stat({label,value,detail}:{label:string;value:React.ReactNode;detail:string}){return <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-2xl font-black text-slate-100">{value}</div><div className="mt-1 text-[10px] text-slate-500">{detail}</div></div>}
export default function IntuitionDashboard({draws,onBack,onOpenResearch}:Props){
 const [tab,setTab]=useState<Tab>("overview");
 const [ledger,setLedger]=useState<SignalRecord[]>([]);
 const [ledgerName,setLedgerName]=useState("");
 const [ledgerError,setLedgerError]=useState("");
 const [memoryScope,setMemoryScope]=useState<MemoryScope>("all-history");
 const [memoryLag,setMemoryLag]=useState<1|2|3|4|5>(1);
 const [selectedSignal,setSelectedSignal]=useState<string>("");
 const [statusFilter,setStatusFilter]=useState<SignalStatus|"all">("all");
 const [researchPlan,setResearchPlan]=useState<ResearchPlan|null>(null);
 const [planName,setPlanName]=useState("");
 const [planError,setPlanError]=useState("");
 const [selectedHypothesis,setSelectedHypothesis]=useState("");
 const [familyFilter,setFamilyFilter]=useState("all");
 const [hypothesisSearch,setHypothesisSearch]=useState("");
 const [positionMemory,setPositionMemory]=useState<PositionMemoryPayload|null>(null);
 const [positionMemoryName,setPositionMemoryName]=useState("");
 const [positionMemoryError,setPositionMemoryError]=useState("");
 const [investigator,setInvestigator]=useState<InvestigatorPayload|null>(null);
 const [investigatorName,setInvestigatorName]=useState("");
 const [investigatorError,setInvestigatorError]=useState("");
 const sorted=useMemo(()=>[...draws].sort((a,b)=>a.num-b.num),[draws]);
 const memoryDraws=useMemo(()=>sorted.map(d=>({drawId:d.num,digits:d.digits as Digit[]})),[sorted]);
 const memoryAnalysis=useMemo(()=>{
  if(memoryDraws.length<2)return null;
  try{return {temporal:analyzeTemporalMemory(memoryDraws),contextual:analyzeContextualMemory(memoryDraws),error:""};}
  catch(error){return {temporal:null,contextual:null,error:error instanceof Error?error.message:"No fue posible calcular la memoria."};}
 },[memoryDraws]);
 const temporalScope=memoryAnalysis?.temporal?.scopes.find(s=>s.scope===memoryScope)??memoryAnalysis?.temporal?.scopes[0]??null;
 const contextualScope=memoryAnalysis?.contextual?.scopes.find(s=>s.scope===memoryScope)??memoryAnalysis?.contextual?.scopes[0]??null;
 const temporalSignals=(temporalScope?.comparisons??[]).filter(x=>x.lag===memoryLag).sort((a,b)=>b.mutualInformationBits-a.mutualInformationBits).slice(0,10);
 const contextualSignals=(contextualScope?.comparisons??[]).filter(x=>x.lag===memoryLag).sort((a,b)=>b.contextMutualInformationBits-a.contextMutualInformationBits).slice(0,10);
 const maxTemporalMi=Math.max(0.000001,...temporalSignals.map(x=>x.mutualInformationBits));
 const maxContextMi=Math.max(0.000001,...contextualSignals.map(x=>x.contextMutualInformationBits));
 const last20=sorted.slice(-20),last50=sorted.slice(-50);
 const matrix=useMemo(()=>Array.from({length:5},(_,pos)=>digits.map(d=>last20.filter(x=>x.digits[pos]===d).length)),[last20]);
 const matrix50=useMemo(()=>Array.from({length:5},(_,pos)=>digits.map(d=>last50.filter(x=>x.digits[pos]===d).length)),[last50]);
 const latest=sorted.length?sorted[sorted.length-1]:undefined;
 const available=sorted.length>0;
 const maxCount=Math.max(1,...matrix.flat());
 const topByPosition=matrix.map(row=>[...digits].sort((a,b)=>row[b]-row[a]||a-b).slice(0,3));
 const overlap=useMemo(()=>{if(!sorted.length)return [];const counts=new Map<number,number>();topByPosition.flat().forEach(d=>counts.set(d,(counts.get(d)??0)+1));return [...counts.entries()].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);},[topByPosition,sorted.length]);
 const noData=!available;
 const ledgerRows=useMemo(()=>ledger.map(record=>({record,assessment:assessSignal(record)})),[ledger]);
 const filteredLedger=ledgerRows.filter(row=>statusFilter==="all"||row.assessment.status===statusFilter);
 const ledgerEvidence=ledger.reduce((acc,row)=>acc+row.evidence.length,0);
 const selectedLedger=filteredLedger.find(row=>row.record.id===selectedSignal);

 const planFamilies=["transition","position-mutation","absence-return","pool-ranking"] as const;
 const familyLabels:Record<string,string>={"transition":"Transiciones","position-mutation":"Mutación posicional","absence-return":"Ausencia y retorno","pool-ranking":"Ranking de pools"};
 const visibleHypotheses=researchPlan?.hypotheses.filter(h=>(familyFilter==="all"||h.candidate.family===familyFilter)&&(!hypothesisSearch||[h.candidate.id,h.candidate.title,h.candidate.description].join(" ").toLowerCase().includes(hypothesisSearch.toLowerCase())))??[];
 const chosenHypothesis=researchPlan?.hypotheses.find(h=>h.candidate.id===selectedHypothesis);
 const importPlan=async(file?:File)=>{
  if(!file)return;
  try{const parsed=parseResearchPlan(JSON.parse(await file.text()));setResearchPlan(parsed);setPlanName(file.name);setPlanError("");setSelectedHypothesis(parsed.hypotheses[0]?.candidate.id??"");setFamilyFilter("all");setHypothesisSearch("");}
  catch(error){setPlanError(error instanceof Error?error.message:"No fue posible leer el plan.");}
 };
 const importInvestigator=async(file?:File)=>{
  if(!file)return;
  try{
   const raw=JSON.parse(await file.text()) as Record<string,unknown>;
   if(!raw||!Array.isArray(raw.selected)||!Array.isArray(raw.warnings)||!raw.familyCounts||typeof raw.familyCounts!=="object")throw new Error("El archivo no contiene un informe del investigador adaptativo.");
   for(const key of ["generatedAt"])if(typeof raw[key]!=="string"||!Number.isFinite(Date.parse(String(raw[key]))))throw new Error("Fecha de generación inválida.");
   for(const key of ["targetDrawId","historyThroughDrawId","catalogSize","budget","frozenCount","explorationCount","exploitationCount","retiredExcluded"])if(!Number.isInteger(raw[key])||Number(raw[key])<0)throw new Error("Métrica inválida: "+key);
   if(Number(raw.targetDrawId)!==Number(raw.historyThroughDrawId)+1)throw new Error("El informe no corresponde al concurso consecutivo del historial.");
   if(Number(raw.explorationCount)+Number(raw.exploitationCount)!==raw.selected.length||Number(raw.frozenCount)>raw.selected.length)throw new Error("Los conteos de selección no coinciden.");
   if(raw.variants!==undefined&&!Array.isArray(raw.variants))throw new Error("El listado de variantes no es válido.");
   if(raw.variantCount!==undefined&&(!Number.isInteger(raw.variantCount)||Number(raw.variantCount)!==(raw.variants as unknown[]|undefined)?.length))throw new Error("El conteo de variantes no coincide.");
   if(raw.baseCatalogSize!==undefined&&(!Number.isInteger(raw.baseCatalogSize)||Number(raw.baseCatalogSize)<0))throw new Error("El tamaño del catálogo base no es válido.");
   const ids=new Set<string>();
   const selected=raw.selected.map((item,index)=>{
    if(!item||typeof item!=="object")throw new Error("Candidato "+(index+1)+" inválido.");
    const row=item as Record<string,unknown>;
    if(typeof row.candidateId!=="string"||!row.candidateId||ids.has(row.candidateId))throw new Error("ID de candidato vacío o duplicado.");
    ids.add(row.candidateId);
    if(!["transition","position-mutation","absence-return","pool-ranking"].includes(String(row.family))||!row.config||typeof row.config!=="object"||typeof row.priorityScore!=="number"||!Number.isFinite(row.priorityScore)||!Array.isArray(row.reasons)||!row.reasons.every(x=>typeof x==="string"))throw new Error("Campos de candidato inválidos: "+row.candidateId);
    return row as unknown as InvestigatorSelectionRow;
   });
   const familyCounts=raw.familyCounts as Record<string,unknown>;
   for(const family of ["transition","position-mutation","absence-return","pool-ranking"])if(!Number.isInteger(familyCounts[family])||Number(familyCounts[family])<0)throw new Error("Conteo familiar inválido: "+family);
   setInvestigator({...raw,selected,warnings:raw.warnings.filter((x):x is string=>typeof x==="string")} as InvestigatorPayload);
   setInvestigatorName(file.name);setInvestigatorError("");
  }catch(error){setInvestigatorError(error instanceof Error?error.message:"No fue posible leer el informe del investigador.");}
 };
 const importPositionMemory=async(file?:File)=>{
  if(!file)return;
  try{
   const raw=JSON.parse(await file.text()) as Record<string,unknown>;
   if(!raw||!Array.isArray(raw.positions)||!Array.isArray(raw.modeScopes)||!Array.isArray(raw.warnings))throw new Error("El archivo no contiene memoria contextual de ciclos.");
   for(const key of ["resolvedOutcomes","positionSpecificTrials","modeLevelTrials","minimumDrawsForSummary","blockSize"]){
    if(!Number.isFinite(raw[key])||Number(raw[key])<0)throw new Error("Métrica inválida: "+key);
   }
   const positions=raw.positions.map((item,index)=>{
    if(!item||typeof item!=="object")throw new Error("Fila posicional "+(index+1)+" inválida.");
    const row=item as Record<string,unknown>;
    if(!Number.isInteger(row.position)||Number(row.position)<0||Number(row.position)>4||typeof row.family!=="string"||typeof row.configuration!=="string"||typeof row.poolRegime!=="string"||typeof row.duplicateRegime!=="string"||typeof row.interpretation!=="string")throw new Error("Campos posicionales inválidos en fila "+(index+1)+".");
    for(const key of ["draws","candidateTrials","distinctCandidates","meanCandidateHitRate","meanBaselineHitRate","difference"])if(!Number.isFinite(row[key]))throw new Error("Valor numérico inválido en fila "+(index+1)+": "+key);
    const latest=row.latestBlock as Record<string,unknown>|null;
    if(latest!==null&&(!latest||typeof latest.state!=="string"||!Number.isFinite(latest.draws)))throw new Error("Bloque reciente inválido en fila "+(index+1)+".");
    return row as unknown as PositionMemoryRow;
   });
   const modeScopes=raw.modeScopes.map((item,index)=>{
    if(!item||typeof item!=="object")throw new Error("Ámbito de modo "+(index+1)+" inválido.");
    const row=item as Record<string,unknown>;
    if(typeof row.mode!=="string")throw new Error("Nombre de modo inválido.");
    for(const key of ["draws","candidateTrials","meanCandidateHitRate","meanBaselineHitRate","difference"])if(!Number.isFinite(row[key]))throw new Error("Métrica de modo inválida: "+key);
    return row as unknown as PositionMemoryPayload["modeScopes"][number];
   });
   setPositionMemory({...raw,positions,modeScopes,warnings:raw.warnings.filter((x):x is string=>typeof x==="string")} as PositionMemoryPayload);
   setPositionMemoryName(file.name);setPositionMemoryError("");
  }catch(error){setPositionMemoryError(error instanceof Error?error.message:"No fue posible leer la memoria contextual.");}
 };
 const importLedger=async(file?:File)=>{
  if(!file)return;
  try{const parsed=parseLedgerPayload(JSON.parse(await file.text()));const ids=new Set<string>();for(const row of parsed){if(ids.has(row.id))throw new Error("ID de señal duplicado: "+row.id);ids.add(row.id);}
   setLedger(parsed);setLedgerName(file.name);setLedgerError("");setSelectedSignal(parsed[0]?.id??"");
  }catch(error){setLedgerError(error instanceof Error?error.message:"No fue posible leer el ledger.");}
 };

 return <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#070c17] text-slate-100">
  <div className="mx-auto max-w-7xl px-4 py-5 md:px-7">
   <header className="relative overflow-hidden rounded-2xl border border-violet-900/70 bg-gradient-to-br from-[#111a32] via-[#11152b] to-[#241447] p-5 md:p-7">
    <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-violet-300/10"/><div className="absolute right-10 top-10 h-28 w-28 rounded-full border border-cyan-300/10"/>
    <div className="relative flex flex-wrap items-start justify-between gap-4">
     <div><div className="text-[10px] font-black uppercase tracking-[.32em] text-violet-300">INTUICIÓN ARTIFICIAL · TRIS</div><h1 className="mt-2 text-3xl font-black md:text-4xl">Memoria y razonamiento</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Un espacio para observar señales, organizar hipótesis y comparar patrones por posición sin confundir descripción con capacidad predictiva.</p></div>
     <div className="flex flex-wrap gap-2"><button onClick={onOpenResearch} className="rounded-xl border border-cyan-700/70 bg-cyan-950/30 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-900/40">🔬 Centro de investigación</button><button onClick={onBack} className="rounded-xl border border-violet-700/70 bg-slate-950/50 px-4 py-2.5 text-sm font-bold text-violet-200 hover:bg-slate-800">← Panel principal</button></div>
    </div>
    <div className="relative mt-5 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1.5 text-emerald-300">● Cálculo local</span><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-slate-300">Historial {available?"disponible":"no cargado"}</span><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-slate-300">Sin pronósticos automáticos en este panel</span></div>
   </header>
   <nav aria-label="Secciones de intuición artificial" className="my-5 grid grid-cols-2 gap-2 md:grid-cols-4">{tabs.map(t=><button key={t.id} type="button" aria-pressed={tab===t.id} onClick={()=>setTab(t.id)} className={`min-h-16 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${tab===t.id?"border-violet-500/80 bg-violet-950/40 text-violet-200":"border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600"}`}><div className="text-lg">{t.icon}</div><div className="mt-1 text-xs font-bold">{t.label}</div></button>)}</nav>
   {noData&&<div className="mb-5 rounded-xl border border-amber-800/70 bg-amber-950/20 p-4 text-sm text-amber-200"><b>Historial pendiente.</b> Importa manualmente Tris.csv desde el panel principal. No se generan frecuencias ni señales con datos vacíos.</div>}
   {tab==="overview"&&<div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Sorteos disponibles" value={sorted.length} detail="Filas válidas en memoria"/><Stat label="Último concurso" value={latest?("#"+latest.num):"—"} detail={latest?.date??"Sin fecha"}/><Stat label="Ventana corta" value={last20.length+"/20"} detail="Sorteos usados en matriz"/><Stat label="Ventana amplia" value={last50.length+"/50"} detail="Referencia descriptiva"/></div>
    <div className="grid gap-4 lg:grid-cols-2">
     <Panel title="Estado cognitivo" sub="Separación explícita entre datos, observación y evidencia"><div className="space-y-3 text-xs">{[["Historial local",available?"Disponible":"Pendiente",available?"text-emerald-300":"text-amber-300"],["Memoria de señales",ledger.length?ledger.length+" señales importadas":"Pendiente de importar",ledger.length?"text-emerald-300":"text-amber-300"],["Plan de hipótesis",researchPlan?"Plan cargado · evaluación aplazada":"Pendiente de plan",researchPlan?"text-emerald-300":"text-amber-300"],["Evidencia prospectiva",ledgerRows.some(row=>row.record.evidence.some(e=>e.phase==="prospective"))?"Hay registros importados":"Sin registros importados",ledgerRows.some(row=>row.record.evidence.some(e=>e.phase==="prospective"))?"text-emerald-300":"text-slate-300"]].map(([a,b,c])=><div key={a} className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">{a}</span><b className={c}>{b}</b></div>)}</div></Panel>
     <Panel title="Principios de decisión" sub="Reglas que gobiernan este módulo"><ul className="space-y-2 text-xs text-slate-300"><li>• Una frecuencia histórica no es una probabilidad futura.</li><li>• Una hipótesis no asciende de estado sin validación separada.</li><li>• La evidencia prospectiva debe estar congelada antes del resultado.</li><li>• Los datos insuficientes se muestran como tales; no se rellenan.</li></ul></Panel>
    </div>
    <Panel title="Actividad reciente" sub="Últimos sorteos del archivo local, en orden cronológico"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">Concurso</th><th className="p-2">Fecha</th><th className="p-2">Resultado</th></tr></thead><tbody>{sorted.slice(-8).reverse().map(d=><tr key={d.num} className="border-t border-slate-800"><td className="p-2 font-bold text-cyan-300">#{d.num}</td><td className="p-2 text-slate-400">{d.date}</td><td className="p-2 font-mono tracking-widest">{d.digits.join(" ")}</td></tr>)}</tbody></table>{!available&&<p className="p-3 text-xs text-slate-500">No hay sorteos para mostrar.</p>}</div></Panel>
   </div>}
   {tab==="memory"&&<div className="space-y-4">
    <Panel title="Memoria calculada desde el histórico" sub="Motores temporal y contextual conectados al CSV cargado. Resultados descriptivos exploratorios; no son señales predictivas ni evidencia de validación.">
     <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="text-xs text-slate-400">Alcance <select value={temporalScope?.scope??memoryScope} onChange={e=>setMemoryScope(e.target.value as MemoryScope)} className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"><option value="all-history">Todo el histórico</option>{memoryAnalysis?.temporal?.scopes.some(s=>s.scope==="last-200")&&<option value="last-200">Últimos 200</option>}{memoryAnalysis?.temporal?.scopes.some(s=>s.scope==="last-1000")&&<option value="last-1000">Últimos 1,000</option>}</select></label>
      <label className="text-xs text-slate-400">Retardo <select value={memoryLag} onChange={e=>setMemoryLag(Number(e.target.value) as 1|2|3|4|5)} className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100">{[1,2,3,4,5].map(x=><option key={x} value={x}>t−{x}</option>)}</select></label>
      <span className="text-[10px] text-slate-500">Corte #{memoryAnalysis?.temporal?.lastDrawId??"—"} · N={temporalScope?.draws??0}</span>
     </div>
     {memoryAnalysis?.error&&<div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{memoryAnalysis.error}</div>}
     {!memoryAnalysis&&<div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-400">Se requieren al menos 2 sorteos válidos y consecutivos para calcular memoria temporal y contextual. Histórico disponible: {sorted.length}.</div>}
     {memoryAnalysis&&!memoryAnalysis.error&&<div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Sorteos analizados" value={temporalScope?.draws??0} detail="Mismo corte para ambos motores"/><Stat label="Comparaciones temporales" value={temporalScope?.comparisons.filter(x=>x.lag===memoryLag).length??0} detail="5×5 pares posicionales"/><Stat label="Comparaciones contextuales" value={contextualScope?.comparisons.filter(x=>x.lag===memoryLag).length??0} detail="Pool y duplicados"/><Stat label="Señales de ledger" value={ledger.length} detail="Registros con evidencia importada"/></div>
      <div className="grid gap-4 xl:grid-cols-2">
       <Panel title="Memoria temporal · dependencias entre posiciones" sub="Top 10 por información mutua (bits). Incluye pares de la misma posición y entre posiciones distintas.">
        <div className="space-y-2">{temporalSignals.map((x,i)=><div key={x.sourcePosition+"-"+x.targetPosition+"-"+x.lag} className="rounded-lg bg-slate-950/70 p-2">
         <div className="flex items-center justify-between gap-2 text-xs"><b className="font-mono text-cyan-200">R{x.sourcePosition+1} → R{x.targetPosition+1}</b><span className="tabular-nums text-slate-300">{x.mutualInformationBits.toFixed(4)} bits</span></div>
         <div className="mt-1.5 h-2 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-cyan-400" style={{width:(x.mutualInformationBits/maxTemporalMi*100)+"%"}}/></div>
         <div className="mt-1 flex flex-wrap justify-between gap-2 text-[10px] text-slate-500"><span>n={x.observations} · entropía cond. {x.conditionalEntropyBits.toFixed(3)} bits</span><span>{x.sourcePosition===x.targetPosition?"Coincidencia dígito: "+(x.sameDigitRate*100).toFixed(1)+"%":"Dependencia cruzada"}</span></div>
         {x.strongestTransitions.length>0&&<div className="mt-1 flex flex-wrap gap-1">{x.strongestTransitions.slice(0,4).map(t=><span key={t.from+"-"+t.to} className="rounded border border-slate-800 px-1.5 py-0.5 text-[10px] text-teal-200">{t.from}→{t.to} · {t.count} · {t.liftVsTargetMarginal.toFixed(2)}×</span>)}</div>}
        </div>)}{!temporalSignals.length&&<p className="text-xs text-slate-500">Sin comparaciones para este alcance y retardo.</p>}</div>
       </Panel>
       <Panel title="Memoria contextual · estructura del sorteo previo" sub="Información mutua entre el tamaño del pool / duplicados del sorteo t−lag y el dígito objetivo.">
        <div className="space-y-2">{contextualSignals.map(x=><div key={x.context+"-"+x.sourcePosition+"-"+x.targetPosition+"-"+x.lag} className="rounded-lg bg-slate-950/70 p-2">
         <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><b className="text-violet-200">{x.context==="source-pool-size"?"Tamaño de pool":"Conteo de duplicados"} · R{x.sourcePosition+1} → R{x.targetPosition+1}</b><span className="tabular-nums text-slate-300">{x.contextMutualInformationBits.toFixed(4)} bits</span></div>
         <div className="mt-1.5 h-2 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-violet-400" style={{width:(x.contextMutualInformationBits/maxContextMi*100)+"%"}}/></div>
         <div className="mt-1 text-[10px] text-slate-500">n={x.observations} · grupos con soporte ≥20: {x.eligibleBuckets}</div>
         <div className="mt-1 flex flex-wrap gap-1">{x.buckets.map(b=><span key={b.contextValue} className="rounded border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">Contexto {b.contextValue}: n={b.observations}, TV={b.totalVariationVsMarginal.toFixed(3)}</span>)}</div>
        </div>)}{!contextualSignals.length&&<p className="text-xs text-slate-500">Sin comparaciones contextuales para este alcance y retardo.</p>}</div>
       </Panel>
      </div>
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-3 text-[10px] leading-relaxed text-amber-200/80">{memoryAnalysis.temporal?.warnings.slice(0,3).map(x=><p key={x}>• {x}</p>)}{memoryAnalysis.contextual?.warnings.slice(0,3).map(x=><p key={x}>• {x}</p>)}</div>
     </div>}
    </Panel>
    <Panel title="Ledger de evidencia · memoria persistente de señales" sub="Registros importados, evaluación de estado y trazabilidad de evidencia. Este ledger es distinto de los patrones descriptivos calculados arriba.">
     <div className="flex flex-wrap items-center gap-3"><label className="cursor-pointer rounded-lg border border-violet-700 bg-violet-950/40 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-900/50">Importar ledger de evidencia JSON<input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void importLedger(e.target.files?.[0]);e.currentTarget.value="";}}/></label><span className="text-xs text-slate-400">{ledgerName||"Ningún ledger importado"}</span><span className="text-[10px] text-slate-500">Solo lectura · permanece en memoria mientras la pantalla está abierta</span>{ledger.length>0&&<button type="button" onClick={()=>{setLedger([]);setLedgerName("");setLedgerError("");setSelectedSignal("");}} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-200">Limpiar ledger</button>}</div>
     {ledgerError&&<div role="alert" className="mt-3 rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{ledgerError}</div>}
     <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Señales importadas" value={ledger.length} detail="Registros del archivo"/><Stat label="Evidencias" value={ledgerEvidence} detail="Entradas append-only leídas"/><Stat label="Provisionales" value={ledgerRows.filter(x=>x.assessment.status==="provisional").length} detail="Según reglas del motor"/><Stat label="Activas" value={ledgerRows.filter(x=>x.assessment.status==="active").length} detail="Requieren evidencia prospectiva"/></div>
     {!ledger.length&&<div className="mt-4 rounded-xl border border-dashed border-slate-700 p-6 text-center"><div className="text-2xl">⌁</div><b className="mt-2 block text-sm">Ledger de evidencia pendiente de importar</b><p className="mx-auto mt-2 max-w-xl text-xs text-slate-400">La memoria calculada desde el histórico ya está visible arriba. Para ver estados de hipótesis con evidencia de validación o prospectiva, importa el archivo ledger JSON correspondiente; no se generan evidencias automáticamente.</p></div>}
    </Panel>
    {ledger.length>0&&<div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
     <Panel title="Registro de señales" sub="Filtra por el estado recalculado por las reglas del ledger"><div className="mb-3 flex flex-wrap gap-2"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as SignalStatus|"all")} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><span className="self-center text-[10px] text-slate-500">{filteredLedger.length} de {ledger.length} señales</span></div>
      <div className="max-h-[480px] space-y-2 overflow-y-auto">{filteredLedger.map(({record,assessment})=><button key={record.id} onClick={()=>setSelectedSignal(record.id)} className={`w-full rounded-lg border p-3 text-left ${selectedSignal===record.id?"border-violet-500 bg-violet-950/30":"border-slate-800 bg-slate-950/50 hover:border-slate-600"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-100">{record.id}</b><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-violet-200">{statusLabels[assessment.status]}</span></div><p className="mt-1 text-xs text-slate-400">{record.description}</p><div className="mt-2 flex gap-3 text-[10px] text-slate-500"><span>{record.evidence.length} evidencias</span><span>n validación: {assessment.n}</span><span>{assessment.difference===null?"Sin comparación":(assessment.difference*100).toFixed(1)+" pp vs base"}</span></div></button>)}</div>
     </Panel>
     <Panel title="Ficha de evidencia" sub="Detalle calculado con assessSignal() del motor de investigación">{selectedLedger?<div className="space-y-3"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">Identificador</div><b className="text-sm">{selectedLedger.record.id}</b><p className="mt-1 text-xs text-slate-400">{selectedLedger.record.description}</p></div><div className="grid grid-cols-2 gap-2"><Stat label="Estado calculado" value={<span className="text-base">{statusLabels[selectedLedger.assessment.status]}</span>} detail={"Estado declarado: "+statusLabels[selectedLedger.record.status]}/><Stat label="Soporte validación" value={selectedLedger.assessment.n} detail="Observaciones de validación"/><Stat label="Tasa señal" value={selectedLedger.assessment.signalRate===null?"—":(selectedLedger.assessment.signalRate*100).toFixed(1)+"%"} detail="Solo fase de validación"/><Stat label="Tasa base" value={selectedLedger.assessment.baselineRate===null?"—":(selectedLedger.assessment.baselineRate*100).toFixed(1)+"%"} detail="Misma fase"/></div><div className="rounded-lg border border-slate-800 p-3"><b className="text-xs">Razones y advertencias</b><ul className="mt-2 space-y-2 text-[10px] text-slate-400">{selectedLedger.assessment.reasons.map((x,i)=><li key={i}>• {x}</li>)}</ul></div><div className="overflow-x-auto"><table className="w-full text-left text-[10px]"><thead className="text-slate-500"><tr><th className="p-2">Fase</th><th className="p-2">Fecha</th><th className="p-2">n</th><th className="p-2">Aciertos</th><th className="p-2">Base n</th><th className="p-2">Base ac.</th></tr></thead><tbody>{selectedLedger.record.evidence.map(e=><tr key={e.id} className="border-t border-slate-800"><td className="p-2">{e.phase}</td><td className="p-2">{e.evaluatedAt}</td><td className="p-2">{e.n}</td><td className="p-2">{e.hits}</td><td className="p-2">{e.baselineN}</td><td className="p-2">{e.baselineHits}</td></tr>)}</tbody></table></div></div>:<p className="text-xs text-slate-500">{filteredLedger.length?"Selecciona una señal visible en el filtro para consultar su evidencia.":"No hay señales con el estado seleccionado."}</p>}</Panel>
    </div>}
    <Panel title="Estados del ciclo de vida" sub="La interfaz presenta el estado recalculado; no promueve ni altera registros"><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{Object.entries(statusLabels).map(([a,b])=><div key={a} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><b className="text-xs text-violet-200">{b}</b><p className="mt-1 text-[10px] text-slate-500">{a==="hypothesis"?"Idea pendiente de prueba":a==="testing"?"Evaluación en curso":a==="provisional"?"Validación separada superada":a==="active"?"Confirmación prospectiva superada":a==="weakening"?"No mantiene la ventaja validada":"Antecedente conservado"}</p></div>)}</div></Panel>
   </div>}
   {tab==="hypotheses"&&<div className="space-y-4">
    <Panel title="Catálogo y plan congelado" sub="Carga un plan exportado por createResearchPlan(); la interfaz no genera ni reordena hipótesis automáticamente">
     <div className="flex flex-wrap items-center gap-3"><label className="cursor-pointer rounded-lg border border-violet-700 bg-violet-950/40 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-900/50">Importar plan JSON<input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void importPlan(e.target.files?.[0]);e.currentTarget.value="";}}/></label><span className="text-xs text-slate-400">{planName||"Ningún plan importado"}</span><span className="text-[10px] text-slate-500">Solo lectura · configuración congelada</span>{researchPlan&&<button type="button" onClick={()=>{setResearchPlan(null);setPlanName("");setPlanError("");setSelectedHypothesis("");}} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-200">Limpiar plan</button>}</div>
     {planError&&<div role="alert" className="mt-3 rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{planError}</div>}
     <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Catálogo completo" value={researchPlan?researchPlan.catalogSize:"1,095"} detail="Candidatos generados por el motor"/><Stat label="Selección congelada" value={researchPlan?researchPlan.selectedCount:"—"} detail={researchPlan?"Presupuesto "+researchPlan.budget:"Pendiente de plan"}/><Stat label="Fecha del plan" value={researchPlan?researchPlan.createdAt.slice(0,10):"—"} detail="Marca temporal de creación"/><Stat label="Evaluaciones vinculadas" value="0" detail="No se importaron informes de resultados"/></div>
     {!researchPlan&&<div className="mt-4 rounded-xl border border-dashed border-slate-700 p-6 text-center"><b className="text-sm">Plan de hipótesis pendiente</b><p className="mx-auto mt-2 max-w-xl text-xs text-slate-400">Importa el JSON generado por el orquestador de investigación. La pantalla verificará esquema, IDs, familias y huellas de configuración. El catálogo de 1,095 es un tamaño teórico: no implica evaluación ni evidencia.</p></div>}
     {researchPlan&&<><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">{planFamilies.map(f=><div key={f} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500">{familyLabels[f]}</div><div className="mt-1 text-xl font-black">{researchPlan.familyCounts[f]}</div><div className="text-[10px] text-slate-500">seleccionadas</div></div>)}</div><div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3"><b className="text-xs">Advertencias del plan</b><ul className="mt-2 space-y-1 text-[10px] text-slate-400">{researchPlan.warnings.map((w,i)=><li key={i}>• {w}</li>)}</ul></div></>}
    </Panel>
    <Panel title="Investigador adaptativo" sub="Selección de hipótesis para el siguiente concurso; combina exploración y evidencia prospectiva previa sin modificar pronósticos congelados">
     <div className="flex flex-wrap items-center gap-3">
      <label className="cursor-pointer rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900/50">Importar informe adaptativo<input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void importInvestigator(e.target.files?.[0]);e.currentTarget.value="";}}/></label>
      <span className="text-xs text-slate-400">{investigatorName||"Ningún informe del investigador importado"}</span>
      {investigator&&<button type="button" onClick={()=>{setInvestigator(null);setInvestigatorName("");setInvestigatorError("");}} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-200">Limpiar informe</button>}
     </div>
     {investigatorError&&<div role="alert" className="mt-3 rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{investigatorError}</div>}
     {investigator?<div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
       <Stat label="Concurso objetivo" value={investigator.targetDrawId} detail={"Historial hasta "+investigator.historyThroughDrawId}/>
       <Stat label="Catálogo examinado" value={investigator.catalogSize} detail={investigator.variantCount?((investigator.baseCatalogSize??investigator.catalogSize)+" base + "+investigator.variantCount+" variantes"):"Plantillas de hipótesis"}/>
       <Stat label="Pronósticos congelados" value={investigator.frozenCount} detail={"Presupuesto "+investigator.budget}/>
       <Stat label="Explorar / explotar" value={investigator.explorationCount+" / "+investigator.exploitationCount} detail="Selección de investigación"/>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{planFamilies.map(f=><div key={f} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500">{familyLabels[f]}</div><div className="mt-1 text-lg font-black">{investigator.familyCounts[f]??0}</div><div className="text-[10px] text-slate-500">seleccionadas</div></div>)}</div>
      {investigator.variants?.length?<div className="rounded-lg border border-slate-800 p-3"><div className="text-xs font-bold">Variantes nuevas propuestas ({investigator.variants.length})</div><p className="mt-1 text-[10px] text-slate-500">Cada variante cambia un parámetro y empieza como hipótesis independiente; la evidencia del padre no se transfiere.</p><div className="mt-2 max-h-52 overflow-auto"><table className="w-full min-w-[560px] text-left text-[10px]"><thead className="text-slate-400"><tr><th className="p-2">Variante</th><th className="p-2">Padre</th><th className="p-2">Cambio</th><th className="p-2">Ensayos padre</th><th className="p-2">Ventaja contraída</th></tr></thead><tbody>{investigator.variants.map(v=><tr key={v.candidateId} className="border-t border-slate-800"><td className="p-2 font-mono">{v.candidateId}</td><td className="p-2 font-mono">{v.parentCandidateId}</td><td className="p-2">{v.changedParameter}: {v.fromValue} → {v.toValue}</td><td className="p-2 tabular-nums">{v.parentResolvedDraws}</td><td className="p-2 tabular-nums">{v.parentShrunkAdvantage.toFixed(4)}</td></tr>)}</tbody></table></div></div>:null}
      <div className="max-h-[420px] overflow-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="text-slate-400"><tr><th className="p-2">Candidato</th><th className="p-2">Familia</th><th className="p-2">Puntaje de agenda</th><th className="p-2">Configuración</th><th className="p-2">Modo</th></tr></thead><tbody>{investigator.selected.map(row=><tr key={row.candidateId} className="border-t border-slate-800"><td className="p-2 font-mono text-[10px]">{row.candidateId}</td><td className="p-2">{familyLabels[row.family]}</td><td className="p-2 tabular-nums">{row.priorityScore.toFixed(3)}</td><td className="max-w-[240px] truncate p-2 font-mono text-[10px]" title={JSON.stringify(row.config)}>{JSON.stringify(row.config)}</td><td className="p-2">{row.reasons[0]?.startsWith("Exploración")?"Exploración":"Explotación"}</td></tr>)}</tbody></table></div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"><b className="text-xs">Advertencias y límites</b><ul className="mt-2 space-y-1 text-[10px] text-slate-400">{investigator.warnings.map((w,i)=><li key={i}>• {w}</li>)}</ul></div>
     </div>:<p className="mt-3 text-xs text-slate-500">Importa <code>data/cycles/investigator-report.json</code> generado por el ciclo local para revisar la selección que quedó congelada antes del concurso objetivo.</p>}
    </Panel>
    {researchPlan&&<div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
     <Panel title="Hipótesis seleccionadas" sub="Prioridad es una heurística de planificación, no una puntuación predictiva">
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={hypothesisSearch} onChange={e=>setHypothesisSearch(e.target.value)} placeholder="Buscar por ID, título o descripción" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"/><select value={familyFilter} onChange={e=>setFamilyFilter(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><option value="all">Todas las familias</option>{planFamilies.map(f=><option key={f} value={f}>{familyLabels[f]}</option>)}</select></div>
      <div className="mb-2 text-[10px] text-slate-500">Mostrando {visibleHypotheses.length} de {researchPlan.hypotheses.length}</div>
      <div className="max-h-[520px] space-y-2 overflow-y-auto">{visibleHypotheses.map(h=><button key={h.candidate.id} onClick={()=>setSelectedHypothesis(h.candidate.id)} className={`w-full rounded-lg border p-3 text-left ${selectedHypothesis===h.candidate.id?"border-violet-500 bg-violet-950/30":"border-slate-800 bg-slate-950/50 hover:border-slate-600"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-100">{h.candidate.title}</b><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-cyan-200">Prioridad {h.priorityScore}</span></div><div className="mt-1 text-[10px] text-slate-500">{h.candidate.id} · {familyLabels[h.candidate.family]}</div><p className="mt-2 text-xs text-slate-400">{h.candidate.description}</p></button>)}</div>
     </Panel>
     <Panel title="Configuración congelada" sub="Ficha del candidato seleccionado; no se recalcula ni se modifica">{chosenHypothesis?<div className="space-y-3"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">ID</div><b className="break-all text-xs">{chosenHypothesis.candidate.id}</b><p className="mt-1 text-xs text-slate-400">{chosenHypothesis.candidate.description}</p></div><div className="grid grid-cols-2 gap-2"><Stat label="Familia" value={<span className="text-sm">{familyLabels[chosenHypothesis.candidate.family]}</span>} detail="Familia del generador"/><Stat label="Prioridad" value={chosenHypothesis.priorityScore} detail="Heurística de ordenamiento"/></div><div className="rounded-lg border border-slate-800 p-3"><b className="text-xs">Parámetros</b><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-[10px] text-cyan-200">{JSON.stringify(chosenHypothesis.candidate.config,null,2)}</pre></div><div className="rounded-lg border border-slate-800 p-3"><b className="text-xs">Huella congelada</b><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-slate-400">{chosenHypothesis.frozenConfig}</pre></div><div className="rounded-lg border border-slate-800 p-3"><b className="text-xs">Razones de prioridad</b><ul className="mt-2 space-y-1 text-[10px] text-slate-400">{chosenHypothesis.priorityReasons.map((reason,i)=><li key={i}>• {reason}</li>)}</ul></div><div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-[10px] text-amber-200">Estado inicial: hipótesis sin evidencia. Este plan no contiene evaluaciones ni resultados de sorteos.</div></div>:<p className="text-xs text-slate-500">No hay hipótesis en el plan.</p>}</Panel>
    </div>}
    <Panel title="Puertas de validación" sub="No se permite mezclar fases ni reinterpretar resultados pasados"><ol className="list-decimal space-y-2 pl-5 text-xs text-slate-300"><li>Congelar catálogo, presupuesto, configuración y línea base.</li><li>Separar descubrimiento, validación y holdout cronológico.</li><li>Exigir soporte mínimo y pruebas pareadas con corrección por multiplicidad.</li><li>Confirmar la ventaja en observaciones prospectivas independientes.</li></ol></Panel>
   </div>}
   {tab==="positions"&&<div className="space-y-4">
    <Panel title="Memoria contextual del ciclo prospectivo" sub="Resultados congelados por posición, familia y contexto previo; se carga desde data/cycles/position-context-memory.json">
     <div className="flex flex-wrap items-center gap-3">
      <label className="cursor-pointer rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900/50">Importar memoria contextual<input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void importPositionMemory(e.target.files?.[0]);e.currentTarget.value="";}}/></label>
      <span className="text-xs text-slate-400">{positionMemoryName||"Ninguna memoria contextual importada"}</span>
      {positionMemory&&<button type="button" onClick={()=>{setPositionMemory(null);setPositionMemoryName("");setPositionMemoryError("");}} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-rose-700 hover:text-rose-200">Limpiar memoria</button>}
     </div>
     {positionMemoryError&&<div role="alert" className="mt-3 rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{positionMemoryError}</div>}
     {positionMemory?<div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
       <Stat label="Resultados resueltos" value={positionMemory.resolvedOutcomes} detail="Pronósticos congelados evaluados"/>
       <Stat label="Pruebas posicionales" value={positionMemory.positionSpecificTrials} detail="Candidatos de una posición"/>
       <Stat label="Transiciones de modo" value={positionMemory.modeLevelTrials} detail="Evaluadas por separado"/>
       <Stat label="Estratos" value={positionMemory.positions.length} detail="Posición y contexto previo"/>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
       <thead className="text-slate-400"><tr><th className="p-2">Pos.</th><th className="p-2">Familia</th><th className="p-2">Configuración</th><th className="p-2">Pool previo</th><th className="p-2">Duplicados</th><th className="p-2">Sorteos</th><th className="p-2">Cobertura</th><th className="p-2">Baseline</th><th className="p-2">Diferencia</th><th className="p-2">Último bloque</th></tr></thead>
       <tbody>{positionMemory.positions.map((row,index)=><tr key={row.position+"-"+row.family+"-"+row.configuration+"-"+row.poolRegime+"-"+row.duplicateRegime+"-"+index} className="border-t border-slate-800">
        <td className="p-2 font-bold text-cyan-300">{row.position+1}</td><td className="p-2">{row.family}</td><td className="max-w-[240px] truncate p-2 font-mono text-[10px]" title={row.configuration}>{row.configuration}</td><td className="p-2">{row.poolRegime}</td><td className="p-2">{row.duplicateRegime}</td><td className="p-2 tabular-nums">{row.draws}</td><td className="p-2 tabular-nums">{(100*row.meanCandidateHitRate).toFixed(1)}%</td><td className="p-2 tabular-nums">{(100*row.meanBaselineHitRate).toFixed(1)}%</td><td className="p-2 tabular-nums">{(100*row.difference).toFixed(1)} pp</td><td className="p-2">{row.latestBlock?row.latestBlock.state+" · "+row.latestBlock.draws:"—"}</td>
       </tr>)}</tbody>
      </table></div>
      <p className="text-[10px] text-slate-500">Las tasas se promedian primero por concurso para evitar que más candidatos en un mismo sorteo pesen más. Son coberturas descriptivas, no probabilidades.</p>
     </div>:<p className="mt-3 text-xs text-slate-500">Importa el archivo generado por el runner local después de procesar un CSV actualizado.</p>}
    </Panel>
    <Panel title="Concordancia descriptiva por posición" sub={`Frecuencia observada en los últimos ${last20.length} sorteos; cada columna corresponde a una posición`}><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-separate border-spacing-1 text-center text-xs"><thead><tr><th className="p-2 text-left text-slate-500">Dígito</th>{[1,2,3,4,5].map(p=><th key={p} className="p-2 text-cyan-300">Pos. {p}</th>)}</tr></thead><tbody>{digits.map(d=><tr key={d}><th className="p-2 text-left font-mono text-slate-300">{d}</th>{matrix.map((row,pos)=><td key={pos} className="rounded-md p-2 font-bold" style={{background:available?`rgba(34,211,238,${.07+.55*(row[d]/maxCount)})`:"#172033",color:row[d]?"#e2e8f0":"#64748b"}}>{available?row[d]:"—"}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-[10px] text-slate-500">La intensidad visual representa conteos, no probabilidad ni recomendación de selección.</p></Panel>
    <div className="grid gap-4 lg:grid-cols-2"><Panel title="Top 3 observado por posición" sub="Ordenado por frecuencia en la ventana corta"><div className="space-y-3">{topByPosition.map((row,pos)=><div key={pos} className="flex items-center gap-3"><span className="w-14 text-xs font-bold text-cyan-300">Pos. {pos+1}</span><div className="flex flex-1 gap-2">{row.map(d=><span key={d} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-center text-sm font-black">{available?d:"—"}<small className="mt-1 block text-[9px] font-normal text-slate-500">{available?matrix[pos][d]+" apar.":"sin datos"}</small></span>)}</div></div>)}</div></Panel>
     <Panel title="Coincidencias entre posiciones" sub="Dígitos presentes en el top 3 de más de una posición"><div className="flex flex-wrap gap-2">{overlap.length?overlap.map(([d,n])=><span key={d} className="rounded-lg border border-violet-700/70 bg-violet-950/40 px-3 py-2 text-sm font-bold text-violet-200">Dígito {d} · {n} posiciones</span>):<span className="text-xs text-slate-500">{available?"No hay coincidencias en esta ventana.":"Pendiente de historial."}</span>}</div><p className="mt-3 text-[10px] text-slate-500">Coincidencia descriptiva entre rankings marginales; no implica dependencia ni ventaja estadística.</p></Panel></div>
    <Panel title="Comparación de ventanas" sub="Conteos en últimos 20 frente a últimos 50 sorteos"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-center text-xs"><thead className="text-slate-500"><tr><th className="p-2 text-left">Posición</th><th className="p-2">Top 1 · 20</th><th className="p-2">Apariciones</th><th className="p-2">Top 1 · 50</th><th className="p-2">Apariciones</th></tr></thead><tbody>{[0,1,2,3,4].map(pos=>{const a=[...digits].sort((x,y)=>matrix[pos][y]-matrix[pos][x]||x-y)[0],b=[...digits].sort((x,y)=>matrix50[pos][y]-matrix50[pos][x]||x-y)[0];return <tr key={pos} className="border-t border-slate-800"><td className="p-2 text-left text-cyan-300">Pos. {pos+1}</td><td className="p-2 font-bold">{available?a:"—"}</td><td className="p-2">{available?matrix[pos][a]:"—"}</td><td className="p-2 font-bold">{last50.length?b:"—"}</td><td className="p-2">{last50.length?matrix50[pos][b]:"—"}</td></tr>})}</tbody></table></div></Panel>
   </div>}
   <footer className="mt-6 border-t border-slate-800 pt-4 text-[10px] text-slate-500">Panel exploratorio local. Los conteos describen únicamente el historial cargado. No representan probabilidades futuras, no alteran el ledger y no garantizan resultados.</footer>
  </div>
 </div>;
}
