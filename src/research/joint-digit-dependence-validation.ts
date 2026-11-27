import type {Draw} from "../research-core";
type M={positions:number[];size:number;totalCorrelation:number;controlMean:number;controlHigh:number;pValue:number;qValue:number;significant:boolean};
type R={positions:number[];size:number;discovery:M;validation:M;status:"replicated"|"validation-only"|"discovery-only"|"not-replicated"|"insufficient"};
const subsets=(k:number,start=0,p:number[]=[]):number[][]=>p.length===k?[p]:Array.from({length:5-start},(_,i)=>subsets(k,start+i+1,[...p,start+i])).flat();
const entropy=(counts:number[],n:number)=>counts.reduce((s,c)=>c?s-(c/n)*Math.log2(c/n):s,0);
function totalCorrelation(cols:number[][]):number{
 const n=cols[0].length,marginals=cols.map(()=>Array(10).fill(0)),joint=new Map<number,number>();
 for(let i=0;i<n;i++){let code=0;for(let p=0;p<cols.length;p++){const d=cols[p][i];marginals[p][d]++;code=code*10+d;}joint.set(code,(joint.get(code)||0)+1);}
 return Math.max(0,marginals.reduce((s,a)=>s+entropy(a,n),0)-entropy([...joint.values()],n));
}
const percentile=(a:number[],q:number)=>{const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*q,l=Math.floor(i),h=Math.ceil(i);return s[l]+(s[h]-s[l])*(i-l);};
function evaluateAll(cols:number[][],groups:number[][],permutations:number,rng:()=>number):M[]{
 const observed=groups.map(g=>totalCorrelation(g.map(p=>cols[p]))),controls=groups.map(()=>[] as number[]);
 for(let r=0;r<permutations;r++){
  const shuffled=cols.map(col=>{const a=[...col];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});
  for(let i=0;i<groups.length;i++)controls[i].push(totalCorrelation(groups[i].map(p=>shuffled[p])));
 }
 return groups.map((g,i)=>{const nulls=controls[i],value=observed[i],mean=nulls.reduce((a,b)=>a+b,0)/permutations,extreme=nulls.filter(x=>x>=value-1e-12).length;return{positions:g.map(x=>x+1),size:g.length,totalCorrelation:value,controlMean:mean,controlHigh:percentile(nulls,.95),pValue:(extreme+1)/(permutations+1),qValue:1,significant:false};});
}
const adjust=(rows:M[],alpha:number)=>{const sorted=[...rows].sort((a,b)=>a.pValue-b.pValue);let prev=1;for(let i=sorted.length-1;i>=0;i--){prev=Math.min(prev,sorted[i].pValue*sorted.length/(i+1));sorted[i].qValue=Math.min(1,prev);}rows.forEach(x=>x.significant=x.qValue<=alpha);};
export function validateJointDigitDependence(draws:Draw[],ds:number,de:number,vs:number,ve:number,o:{permutations?:number;seed?:number;fdr?:number}={}){
 const B=o.permutations??999,seed=o.seed??1192026,alpha=o.fdr??.05;
 if(!Number.isInteger(B)||B<99||!Number.isInteger(seed)||!Number.isFinite(alpha)||alpha<=0||alpha>=1)throw Error("invalid validation options");
 if([ds,de,vs,ve].some(x=>!Number.isInteger(x))||ds>de||de>=vs||vs>ve)throw Error("windows must be ordered and disjoint");
 for(let i=0;i<draws.length;i++){const d=draws[i];if(!Number.isInteger(d.drawId)||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw Error("invalid draw");if(i&&d.drawId!==draws[i-1].drawId+1)throw Error("draws must be sorted and contiguous");}
 const ix=new Map(draws.map((d,i)=>[d.drawId,i]));
 const get=(a:number,b:number)=>{const i=ix.get(a),j=ix.get(b);if(i===undefined||j===undefined||j-i+1<20)throw Error("each window needs at least 20 available draws");return draws.slice(i,j+1);};
 const discovery=get(ds,de),validation=get(vs,ve),dc=Array.from({length:5},(_,p)=>discovery.map(x=>x.digits[p])),vc=Array.from({length:5},(_,p)=>validation.map(x=>x.digits[p]));
 let state=seed>>>0;const rng=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
 const groups=[2,3,4,5].flatMap(k=>subsets(k)),a=evaluateAll(dc,groups,B,rng),b=evaluateAll(vc,groups,B,rng);adjust(a,alpha);adjust(b,alpha);
 const results:R[]=groups.map((g,i)=>{const x=a[i],y=b[i];let status:R["status"]="not-replicated";if(x.significant&&y.significant&&y.totalCorrelation>y.controlHigh)status="replicated";else if(!x.significant&&y.significant&&y.totalCorrelation>y.controlHigh)status="validation-only";else if(x.significant&&!y.significant)status="discovery-only";if(discovery.length<30||validation.length<30)status="insufficient";return{positions:g.map(x=>x+1),size:g.length,discovery:x,validation:y,status};});
 return{method:"tris-joint-digit-dependence-walk-forward-validation-v1",parameters:{discoveryStart:ds,discoveryEnd:de,validationStart:vs,validationEnd:ve,discoveryDraws:discovery.length,validationDraws:validation.length,permutations:B,seed,fdr:alpha},summary:{subsets:groups.length,replicated:results.filter(x=>x.status==="replicated").length,validationOnly:results.filter(x=>x.status==="validation-only").length,discoveryOnly:results.filter(x=>x.status==="discovery-only").length,notReplicated:results.filter(x=>x.status==="not-replicated").length,insufficient:results.filter(x=>x.status==="insufficient").length},results:results.sort((x,y)=>x.size-y.size||x.positions.join("").localeCompare(y.positions.join(""))),limitations:["Ventanas cronológicas disjuntas; validación posterior al descubrimiento.","Los mismos 26 subconjuntos predefinidos se evalúan en ambas ventanas; validación no selecciona subconjuntos.","Las permutaciones independientes conservan frecuencias marginales exactas, pero destruyen autocorrelación y orden temporal.","FDR se controla por separado en cada ventana; no corrige toda la exploración acumulada del proyecto.","Replicación histórica no es pronóstico ni causalidad.","Se requieren al menos 30 sorteos por ventana para clasificar replicación; 20–29 se informa insuficiente."]};
}
