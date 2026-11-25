/**
 * Experimental multi-proposal portfolio builder.
 * Candidate scores are ranking signals only; do not treat them as calibrated probabilities.
 * The selector is deterministic, mode-specific, and uses diversity constraints as a heuristic.
 */
import type { Ticket, TicketMode } from "./portfolio-evaluator";
import { ticketValid } from "./portfolio-evaluator";

export interface ScoredTicketCandidate extends Ticket {
 score:number;
 support:number;
 source:string;
}
export interface ModeQuota { mode:TicketMode; count:number; }
export interface SelectionConfig { quotas:ModeQuota[]; maxPositionOverlap?:number; dedupe?:boolean; }
export interface SelectionAudit {
 mode:TicketMode; requested:number; selected:number; candidateCount:number;
 rejectedInvalid:number; rejectedDuplicate:number; rejectedOverlap:number;
 selectedTickets:ScoredTicketCandidate[];
}
export interface PortfolioSelection {
 tickets:Ticket[]; audit:SelectionAudit[]; totalRequested:number; totalSelected:number;
 notes:string[];
}
const positionalOverlap=(a:string,b:string):number=>{
 if(a.length!==b.length||!a.length)return 0;
 let same=0;for(let i=0;i<a.length;i++)if(a[i]===b[i])same++;
 return same/a.length;
};
/** Select highest-ranked candidates subject to per-mode quota and overlap limit. */
export function selectDiversePortfolio(candidates:ScoredTicketCandidate[],config:SelectionConfig):PortfolioSelection{
 const maxOverlap=config.maxPositionOverlap??0.8, dedupe=config.dedupe??true;
 const audits:SelectionAudit[]=[],tickets:Ticket[]=[];
 for(const q of config.quotas){
  const list=candidates.filter(c=>c.mode===q.mode).slice().sort((a,b)=>b.score-a.score||b.support-a.support||a.proposal.localeCompare(b.proposal));
  const selected:ScoredTicketCandidate[]=[];let invalid=0,duplicate=0,overlap=0;
  for(const c of list){
   if(selected.length>=Math.max(0,Math.floor(q.count)))break;
   if(!ticketValid(c)){invalid++;continue;}
   if(dedupe&&selected.some(s=>s.proposal===c.proposal)){duplicate++;continue;}
   if(selected.some(s=>positionalOverlap(s.proposal,c.proposal)>maxOverlap)){overlap++;continue;}
   selected.push(c);
  }
  tickets.push(...selected.map(c=>({mode:c.mode,proposal:c.proposal})));
  audits.push({mode:q.mode,requested:Math.max(0,Math.floor(q.count)),selected:selected.length,candidateCount:list.length,rejectedInvalid:invalid,rejectedDuplicate:duplicate,rejectedOverlap:overlap,selectedTickets:selected});
 }
 return {tickets,audit:audits,totalRequested:config.quotas.reduce((s,q)=>s+Math.max(0,Math.floor(q.count)),0),totalSelected:tickets.length,notes:[
  "Candidate score is used for ranking only; it is not a calibrated probability or proof of advantage.",
  "Diversity is a configurable heuristic, not a guarantee of better coverage or expected return.",
  "Selection quotas are per ticket mode; compare portfolios with equal ticket counts and cost.",
  "Candidate generation and evaluation must be separated chronologically; do not select retrospectively from test outcomes.",
  "If quotas cannot be filled under the diversity limit, the selector returns fewer proposals rather than silently relaxing the constraint."
 ]};
}
