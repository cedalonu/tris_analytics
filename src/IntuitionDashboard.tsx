import React,{useMemo,useState} from "react";
import type {Draw} from "./tris-csv";
import {assessSignal,type SignalRecord,type SignalStatus} from "./research/intuition-ledger";

type Props={draws:Draw[];onBack:()=>void};
type Tab="overview"|"memory"|"hypotheses"|"positions";
const digits=Array.from({length:10},(_,i)=>i);
const statusLabels:Record<SignalStatus,string>={hypothesis:"Hipótesis",testing:"En prueba",provisional:"Provisional",active:"Activa",weakening:"Debilitándose",retired:"Retirada"};
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
export default function IntuitionDashboard({draws,onBack}:Props){
 const [tab,setTab]=useState<Tab>("overview");
 const [ledger,setLedger]=useState<SignalRecord[]>([]);
 const [ledgerName,setLedgerName]=useState("");
 const [ledgerError,setLedgerError]=useState("");
 const [selectedSignal,setSelectedSignal]=useState<string>("");
 const [statusFilter,setStatusFilter]=useState<SignalStatus|"all">("all");
 const sorted=useMemo(()=>[...draws].sort((a,b)=>a.num-b.num),[draws]);
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
 const selectedLedger=ledgerRows.find(row=>row.record.id===selectedSignal);
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
     <button onClick={onBack} className="rounded-xl border border-violet-700/70 bg-slate-950/50 px-4 py-2.5 text-sm font-bold text-violet-200 hover:bg-slate-800">← Volver al panel</button>
    </div>
    <div className="relative mt-5 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1.5 text-emerald-300">● Cálculo local</span><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-slate-300">Historial {available?"disponible":"no cargado"}</span><span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-slate-300">Sin pronósticos automáticos en este panel</span></div>
   </header>
   <nav className="my-5 grid grid-cols-2 gap-2 md:grid-cols-4">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-xl border p-3 text-left transition ${tab===t.id?"border-violet-500/80 bg-violet-950/40 text-violet-200":"border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600"}`}><div className="text-lg">{t.icon}</div><div className="mt-1 text-xs font-bold">{t.label}</div></button>)}</nav>
   {noData&&<div className="mb-5 rounded-xl border border-amber-800/70 bg-amber-950/20 p-4 text-sm text-amber-200"><b>Historial pendiente.</b> Importa manualmente Tris.csv desde el panel principal. No se generan frecuencias ni señales con datos vacíos.</div>}
   {tab==="overview"&&<div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Sorteos disponibles" value={sorted.length} detail="Filas válidas en memoria"/><Stat label="Último concurso" value={latest?("#"+latest.num):"—"} detail={latest?.date??"Sin fecha"}/><Stat label="Ventana corta" value={last20.length+"/20"} detail="Sorteos usados en matriz"/><Stat label="Ventana amplia" value={last50.length+"/50"} detail="Referencia descriptiva"/></div>
    <div className="grid gap-4 lg:grid-cols-2">
     <Panel title="Estado cognitivo" sub="Separación explícita entre datos, observación y evidencia"><div className="space-y-3 text-xs">{[["Historial local",available?"Disponible":"Pendiente",available?"text-emerald-300":"text-amber-300"],["Memoria prospectiva","Sin ledger conectado","text-amber-300"],["Hipótesis evaluadas","Sin informe importado","text-amber-300"],["Validación prospectiva","No determinada","text-slate-300"]].map(([a,b,c])=><div key={a} className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">{a}</span><b className={c}>{b}</b></div>)}</div></Panel>
     <Panel title="Principios de decisión" sub="Reglas que gobiernan este módulo"><ul className="space-y-2 text-xs text-slate-300"><li>• Una frecuencia histórica no es una probabilidad futura.</li><li>• Una hipótesis no asciende de estado sin validación separada.</li><li>• La evidencia prospectiva debe estar congelada antes del resultado.</li><li>• Los datos insuficientes se muestran como tales; no se rellenan.</li></ul></Panel>
    </div>
    <Panel title="Actividad reciente" sub="Últimos sorteos del archivo local, en orden cronológico"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">Concurso</th><th className="p-2">Fecha</th><th className="p-2">Resultado</th></tr></thead><tbody>{sorted.slice(-8).reverse().map(d=><tr key={d.num} className="border-t border-slate-800"><td className="p-2 font-bold text-cyan-300">#{d.num}</td><td className="p-2 text-slate-400">{d.date}</td><td className="p-2 font-mono tracking-widest">{d.digits.join(" ")}</td></tr>)}</tbody></table>{!available&&<p className="p-3 text-xs text-slate-500">No hay sorteos para mostrar.</p>}</div></Panel>
   </div>}
   {tab==="memory"&&<div className="space-y-4">
    <Panel title="Memoria de señales" sub="Importación local, validación de estructura y evaluación de estados desde el ledger original">
     <div className="flex flex-wrap items-center gap-3"><label className="cursor-pointer rounded-lg border border-violet-700 bg-violet-950/40 px-4 py-2 text-xs font-bold text-violet-200 hover:bg-violet-900/50">Importar ledger JSON<input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void importLedger(e.target.files?.[0]);e.currentTarget.value="";}}/></label><span className="text-xs text-slate-400">{ledgerName||"Ningún ledger importado"}</span><span className="text-[10px] text-slate-500">Solo lectura · permanece en memoria mientras la pantalla está abierta</span></div>
     {ledgerError&&<div role="alert" className="mt-3 rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-xs text-rose-200">{ledgerError}</div>}
     <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Señales importadas" value={ledger.length} detail="Registros del archivo"/><Stat label="Evidencias" value={ledgerEvidence} detail="Entradas append-only leídas"/><Stat label="Provisionales" value={ledgerRows.filter(x=>x.assessment.status==="provisional").length} detail="Según reglas del motor"/><Stat label="Activas" value={ledgerRows.filter(x=>x.assessment.status==="active").length} detail="Requieren evidencia prospectiva"/></div>
     {!ledger.length&&<div className="mt-4 rounded-xl border border-dashed border-slate-700 p-6 text-center"><div className="text-2xl">⌁</div><b className="mt-2 block text-sm">Ledger pendiente de importar</b><p className="mx-auto mt-2 max-w-xl text-xs text-slate-400">Selecciona un JSON que contenga un arreglo de señales o un objeto con signals[] o records[]. El archivo se valida y se lee localmente; esta pantalla no modifica ni guarda el ledger.</p></div>}
    </Panel>
    {ledger.length>0&&<div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
     <Panel title="Registro de señales" sub="Filtra por el estado recalculado por las reglas del ledger"><div className="mb-3 flex flex-wrap gap-2"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as SignalStatus|"all")} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><span className="self-center text-[10px] text-slate-500">{filteredLedger.length} de {ledger.length} señales</span></div>
      <div className="max-h-[480px] space-y-2 overflow-y-auto">{filteredLedger.map(({record,assessment})=><button key={record.id} onClick={()=>setSelectedSignal(record.id)} className={`w-full rounded-lg border p-3 text-left ${selectedSignal===record.id?"border-violet-500 bg-violet-950/30":"border-slate-800 bg-slate-950/50 hover:border-slate-600"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-100">{record.id}</b><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-violet-200">{statusLabels[assessment.status]}</span></div><p className="mt-1 text-xs text-slate-400">{record.description}</p><div className="mt-2 flex gap-3 text-[10px] text-slate-500"><span>{record.evidence.length} evidencias</span><span>n validación: {assessment.n}</span><span>{assessment.difference===null?"Sin comparación":(assessment.difference*100).toFixed(1)+" pp vs base"}</span></div></button>)}</div>
     </Panel>
     <Panel title="Ficha de evidencia" sub="Detalle calculado con assessSignal() del motor de investigación">{selectedLedger?<div className="space-y-3"><div><div className="text-[10px] uppercase tracking-widest text-slate-500">Identificador</div><b className="text-sm">{selectedLedger.record.id}</b><p className="mt-1 text-xs text-slate-400">{selectedLedger.record.description}</p></div><div className="grid grid-cols-2 gap-2"><Stat label="Estado calculado" value={<span className="text-base">{statusLabels[selectedLedger.assessment.status]}</span>} detail={"Estado declarado: "+statusLabels[selectedLedger.record.status]}/><Stat label="Soporte validación" value={selectedLedger.assessment.n} detail="Observaciones de validación"/><Stat label="Tasa señal" value={selectedLedger.assessment.signalRate===null?"—":(selectedLedger.assessment.signalRate*100).toFixed(1)+"%"} detail="Solo fase de validación"/><Stat label="Tasa base" value={selectedLedger.assessment.baselineRate===null?"—":(selectedLedger.assessment.baselineRate*100).toFixed(1)+"%"} detail="Misma fase"/></div><div className="rounded-lg border border-slate-800 p-3"><b className="text-xs">Razones y advertencias</b><ul className="mt-2 space-y-2 text-[10px] text-slate-400">{selectedLedger.assessment.reasons.map((x,i)=><li key={i}>• {x}</li>)}</ul></div><div className="overflow-x-auto"><table className="w-full text-left text-[10px]"><thead className="text-slate-500"><tr><th className="p-2">Fase</th><th className="p-2">Fecha</th><th className="p-2">n</th><th className="p-2">Aciertos</th><th className="p-2">Base n</th><th className="p-2">Base ac.</th></tr></thead><tbody>{selectedLedger.record.evidence.map(e=><tr key={e.id} className="border-t border-slate-800"><td className="p-2">{e.phase}</td><td className="p-2">{e.evaluatedAt}</td><td className="p-2">{e.n}</td><td className="p-2">{e.hits}</td><td className="p-2">{e.baselineN}</td><td className="p-2">{e.baselineHits}</td></tr>)}</tbody></table></div></div>:<p className="text-xs text-slate-500">Selecciona una señal para consultar su evidencia.</p>}</Panel>
    </div>}
    <Panel title="Estados del ciclo de vida" sub="La interfaz presenta el estado recalculado; no promueve ni altera registros"><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{Object.entries(statusLabels).map(([a,b])=><div key={a} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><b className="text-xs text-violet-200">{b}</b><p className="mt-1 text-[10px] text-slate-500">{a==="hypothesis"?"Idea pendiente de prueba":a==="testing"?"Evaluación en curso":a==="provisional"?"Validación separada superada":a==="active"?"Confirmación prospectiva superada":a==="weakening"?"No mantiene la ventaja validada":"Antecedente conservado"}</p></div>)}</div></Panel>
   </div>}
   {tab==="hypotheses"&&<div className="space-y-4"><Panel title="Catálogo de hipótesis" sub="La generación de candidatos y su priorización se ejecutan mediante los scripts de investigación"><div className="grid gap-3 md:grid-cols-3"><Stat label="Catálogo teórico" value="1,095" detail="Candidatos del generador actual"/><Stat label="Plan importado" value="0" detail="No se ha cargado un plan congelado"/><Stat label="Evaluaciones mostradas" value="0" detail="Sin resultados vinculados"/></div><div className="mt-4 rounded-xl border border-dashed border-slate-700 p-6 text-center"><b className="text-sm">Sin plan de hipótesis cargado</b><p className="mx-auto mt-2 max-w-xl text-xs text-slate-400">El tamaño del catálogo procede del diseño del generador; no significa que las 1,095 hipótesis hayan sido evaluadas. La tabla de hipótesis aparecerá cuando se conecte el plan y sus informes de evaluación.</p></div></Panel><Panel title="Puertas de validación"><ol className="list-decimal space-y-2 pl-5 text-xs text-slate-300"><li>Congelar catálogo, presupuesto, configuración y línea base.</li><li>Separar descubrimiento, validación y holdout cronológico.</li><li>Exigir soporte mínimo y pruebas pareadas con corrección por multiplicidad.</li><li>Confirmar la ventaja en observaciones prospectivas independientes.</li></ol></Panel></div>}
   {tab==="positions"&&<div className="space-y-4"><Panel title="Concordancia descriptiva por posición" sub={`Frecuencia observada en los últimos ${last20.length} sorteos; cada columna corresponde a una posición`}><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-separate border-spacing-1 text-center text-xs"><thead><tr><th className="p-2 text-left text-slate-500">Dígito</th>{[1,2,3,4,5].map(p=><th key={p} className="p-2 text-cyan-300">Pos. {p}</th>)}</tr></thead><tbody>{digits.map(d=><tr key={d}><th className="p-2 text-left font-mono text-slate-300">{d}</th>{matrix.map((row,pos)=><td key={pos} className="rounded-md p-2 font-bold" style={{background:available?`rgba(34,211,238,${.07+.55*(row[d]/maxCount)})`:"#172033",color:row[d]?"#e2e8f0":"#64748b"}}>{available?row[d]:"—"}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-[10px] text-slate-500">La intensidad visual representa conteos, no probabilidad ni recomendación de selección.</p></Panel>
    <div className="grid gap-4 lg:grid-cols-2"><Panel title="Top 3 observado por posición" sub="Ordenado por frecuencia en la ventana corta"><div className="space-y-3">{topByPosition.map((row,pos)=><div key={pos} className="flex items-center gap-3"><span className="w-14 text-xs font-bold text-cyan-300">Pos. {pos+1}</span><div className="flex flex-1 gap-2">{row.map(d=><span key={d} className="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-center text-sm font-black">{available?d:"—"}<small className="mt-1 block text-[9px] font-normal text-slate-500">{available?matrix[pos][d]+" apar.":"sin datos"}</small></span>)}</div></div>)}</div></Panel>
     <Panel title="Coincidencias entre posiciones" sub="Dígitos presentes en el top 3 de más de una posición"><div className="flex flex-wrap gap-2">{overlap.length?overlap.map(([d,n])=><span key={d} className="rounded-lg border border-violet-700/70 bg-violet-950/40 px-3 py-2 text-sm font-bold text-violet-200">Dígito {d} · {n} posiciones</span>):<span className="text-xs text-slate-500">{available?"No hay coincidencias en esta ventana.":"Pendiente de historial."}</span>}</div><p className="mt-3 text-[10px] text-slate-500">Coincidencia descriptiva entre rankings marginales; no implica dependencia ni ventaja estadística.</p></Panel></div>
    <Panel title="Comparación de ventanas" sub="Conteos en últimos 20 frente a últimos 50 sorteos"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-center text-xs"><thead className="text-slate-500"><tr><th className="p-2 text-left">Posición</th><th className="p-2">Top 1 · 20</th><th className="p-2">Apariciones</th><th className="p-2">Top 1 · 50</th><th className="p-2">Apariciones</th></tr></thead><tbody>{[0,1,2,3,4].map(pos=>{const a=[...digits].sort((x,y)=>matrix[pos][y]-matrix[pos][x]||x-y)[0],b=[...digits].sort((x,y)=>matrix50[pos][y]-matrix50[pos][x]||x-y)[0];return <tr key={pos} className="border-t border-slate-800"><td className="p-2 text-left text-cyan-300">Pos. {pos+1}</td><td className="p-2 font-bold">{available?a:"—"}</td><td className="p-2">{available?matrix[pos][a]:"—"}</td><td className="p-2 font-bold">{last50.length?b:"—"}</td><td className="p-2">{last50.length?matrix50[pos][b]:"—"}</td></tr>})}</tbody></table></div></Panel>
   </div>}
   <footer className="mt-6 border-t border-slate-800 pt-4 text-[10px] text-slate-500">Panel exploratorio local. Los conteos describen únicamente el historial cargado. No representan probabilidades futuras, no alteran el ledger y no garantizan resultados.</footer>
  </div>
 </div>;
}
