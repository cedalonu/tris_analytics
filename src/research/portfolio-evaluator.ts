/**
 * TRIS ticket portfolio accounting / backtest evaluator.
 * User-provided reference: MXN $1 per ticket and listed prizes (gross prize).
 * Does not generate predictions. Inputs are tickets proposed before the result.
 */
import type { Draw, Digit } from "../research-core";

export type TicketMode = "direct5"|"direct4"|"direct3"|"pairInitial"|"pairFinal"|"singleInitial"|"singleFinal";
export interface Ticket { mode:TicketMode; proposal:string; }
export interface PrizeRule { mode:TicketMode; costMxn:number; prizeMxn:number; matchLength:number; target:string; }
export const PRIZE_RULES:PrizeRule[]=[
 {mode:"direct5",costMxn:1,prizeMxn:50000,matchLength:5,target:"full"},
 {mode:"direct4",costMxn:1,prizeMxn:5000,matchLength:4,target:"last4"},
 {mode:"direct3",costMxn:1,prizeMxn:500,matchLength:3,target:"last3"},
 {mode:"pairInitial",costMxn:1,prizeMxn:50,matchLength:2,target:"first2"},
 {mode:"pairFinal",costMxn:1,prizeMxn:50,matchLength:2,target:"last2"},
 {mode:"singleInitial",costMxn:1,prizeMxn:5,matchLength:1,target:"first1"},
 {mode:"singleFinal",costMxn:1,prizeMxn:5,matchLength:1,target:"last1"},
];
export interface DrawPortfolio { drawId:number; tickets:Ticket[]; }
export interface DrawAccounting { drawId:number; tickets:number; invalidTickets:number; costMxn:number; winningTickets:number; prizeMxn:number; netMxn:number; }
export interface PortfolioReport { draws:number; tickets:number; invalidTickets:number; missingDrawBatches:number; duplicateDrawBatches:number; costMxn:number; winningTickets:number; grossPrizesMxn:number; netMxn:number; roiOnCost:number|null; profitPerTicketMxn:number|null; byMode:Record<TicketMode,{tickets:number;hits:number;costMxn:number;prizesMxn:number;netMxn:number}>; perDraw:DrawAccounting[]; warnings:string[]; }
const rule=(m:TicketMode)=>PRIZE_RULES.find(r=>r.mode===m)!;
const asString=(digits:Digit[])=>digits.join("");
export function ticketTarget(result:string,mode:TicketMode):string{switch(rule(mode).target){case "full":return result;case "last4":return result.slice(-4);case "last3":return result.slice(-3);case "first2":return result.slice(0,2);case "last2":return result.slice(-2);case "first1":return result.slice(0,1);case "last1":return result.slice(-1);}}
export function ticketValid(ticket:Ticket):boolean{const r=rule(ticket.mode);return typeof ticket.proposal==='string'&&ticket.proposal.length===r.matchLength&&/^\\d+$/.test(ticket.proposal);}
export function isWinner(ticket:Ticket,result:string):boolean{return ticketValid(ticket)&&ticket.proposal===ticketTarget(result,ticket.mode);}
export function evaluatePortfolio(draws:Draw[],portfolio:DrawPortfolio[]):PortfolioReport{
 const warnings:string[]=[],byId=new Map<number,string>();
 for(const d of draws){if(byId.has(d.drawId))warnings.push("Duplicate result draw ID "+d.drawId+"; first occurrence used.");else byId.set(d.drawId,asString(d.digits));}
 const modes={} as PortfolioReport["byMode"];for(const r of PRIZE_RULES)modes[r.mode]={tickets:0,hits:0,costMxn:0,prizesMxn:0,netMxn:0};
 const perDraw:DrawAccounting[]=[];let totalTickets=0,totalInvalid=0,totalCost=0,totalHits=0,totalPrize=0,missingDrawBatches=0,duplicateDrawBatches=0;
 const batchIds=new Set<number>();
 for(const batch of portfolio){
  if(batchIds.has(batch.drawId))duplicateDrawBatches++;batchIds.add(batch.drawId);
  const result=byId.get(batch.drawId);if(result===undefined){missingDrawBatches++;continue;}
  let cost=0,hits=0,prize=0,validCount=0,invalidCount=0;
  for(const t of batch.tickets){
   if(!ticketValid(t)){invalidCount++;continue;}
   validCount++;const r=rule(t.mode),win=isWinner(t,result),p=win?r.prizeMxn:0;
   cost+=r.costMxn;hits+=win?1:0;prize+=p;const s=modes[t.mode];s.tickets++;s.hits+=win?1:0;s.costMxn+=r.costMxn;s.prizesMxn+=p;s.netMxn+=p-r.costMxn;
  }
  totalTickets+=validCount;totalInvalid+=invalidCount;totalCost+=cost;totalHits+=hits;totalPrize+=prize;
  perDraw.push({drawId:batch.drawId,tickets:validCount,invalidTickets:invalidCount,costMxn:cost,winningTickets:hits,prizeMxn:prize,netMxn:prize-cost});
 }
 for(const s of Object.values(modes))s.netMxn=s.prizesMxn-s.costMxn;
 if(totalInvalid)warnings.push("Skipped "+totalInvalid+" invalid ticket(s); review invalidTickets before interpreting totals.");
 if(missingDrawBatches)warnings.push("Skipped "+missingDrawBatches+" portfolio batch(es) with no matching result draw ID.");
 if(duplicateDrawBatches)warnings.push(duplicateDrawBatches+" duplicate portfolio batch ID(s) were counted as separate submitted batches; check whether this was intentional.");
 warnings.push("Payout rules are user-provided reference values; verify official rules before real-money use.");
 warnings.push("Gross prize and net profit are reported separately; ticket cost is deducted once per valid ticket.");
 warnings.push("Duplicate tickets are counted separately because each is a separate wager.");
 warnings.push("This evaluates submitted portfolios only; predictive quality must be measured prospectively against suitable baselines.");
 return {draws:perDraw.length,tickets:totalTickets,invalidTickets:totalInvalid,missingDrawBatches,duplicateDrawBatches,costMxn:totalCost,winningTickets:totalHits,grossPrizesMxn:totalPrize,netMxn:totalPrize-totalCost,roiOnCost:totalCost?((totalPrize-totalCost)/totalCost):null,profitPerTicketMxn:totalTickets?(totalPrize-totalCost)/totalTickets:null,byMode:modes,perDraw,warnings};
}
/** Simple theoretical EV using uniform exact-match assumptions, before real-world rule verification. */
export function theoreticalExpectedValue(mode:TicketMode):{probability:number;grossExpectedMxn:number;netExpectedMxn:number;returnRate:number}{const r=rule(mode),p=1/Math.pow(10,r.matchLength),gross=p*r.prizeMxn,net=gross-r.costMxn;return {probability:p,grossExpectedMxn:gross,netExpectedMxn:net,returnRate:gross/r.costMxn};}
/** Group tickets by mode and produce a concise theoretical reference table. */
export function theoreticalTable(){return PRIZE_RULES.map(r=>({mode:r.mode,matchLength:r.matchLength,costMxn:r.costMxn,prizeMxn:r.prizeMxn,...theoreticalExpectedValue(r.mode)}));}