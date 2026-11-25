import type { Draw } from '../research-core';
import { evaluatePortfolio, type DrawPortfolio, type PortfolioReport, type TicketMode } from './portfolio-evaluator';
import { randomPortfolio, type ResearchTicketMode } from './portfolio-experiment';
export interface BaselineSummary { mode:ResearchTicketMode; ticketCount:number; seed:number; draws:number; tickets:number; costMxn:number; grossPrizesMxn:number; netMxn:number; winningTickets:number; drawsWithAnyWin:number; averageNetPerDraw:number; roiOnCost:number|null; }
const MODE_MAP:Record<ResearchTicketMode,TicketMode>={direct5:'direct5',direct4:'direct4',direct3:'direct3',pairInitial:'pairInitial',pairFinal:'pairFinal',singleInitial:'singleInitial',singleFinal:'singleFinal'};
/** Evaluate uniform random ticket baseline over supplied draws. Every draw gets the same budget. */
export function evaluateRandomBaselines(draws:Draw[],modes:ResearchTicketMode[],ticketCounts:number[],seeds:number[]):BaselineSummary[]{
 const rows:BaselineSummary[]=[];
 for(const mode of modes){for(const rawCount of ticketCounts){const count=Number.isFinite(rawCount)?Math.max(0,Math.floor(rawCount)):0;for(const seed of seeds){
  const portfolios:DrawPortfolio[]=draws.map(d=>({drawId:d.drawId,tickets:randomPortfolio(mode,count,seed ^ (d.drawId>>>0)).map(proposal=>({mode:MODE_MAP[mode],proposal}))}));
  const report:PortfolioReport=evaluatePortfolio(draws,portfolios);
  rows.push({mode,ticketCount:count,seed,draws:report.draws,tickets:report.tickets,costMxn:report.costMxn,grossPrizesMxn:report.grossPrizesMxn,netMxn:report.netMxn,winningTickets:report.winningTickets,drawsWithAnyWin:report.perDraw.filter(x=>x.winningTickets>0).length,averageNetPerDraw:report.draws?report.netMxn/report.draws:0,roiOnCost:report.roiOnCost});
 }}}
 return rows;
}
export interface BaselineAggregate { mode:ResearchTicketMode; ticketCount:number; seedRuns:number; meanNetMxn:number; meanGrossMxn:number; meanHits:number; meanDrawsWithWin:number; meanRoi:number|null; minNetMxn:number; maxNetMxn:number; }
/** Summarize random seed replicates; these are reference distributions, not forecasts. */
export function aggregateRandomBaselines(rows:BaselineSummary[]):BaselineAggregate[]{
 const groups=new Map<string,BaselineSummary[]>();for(const r of rows){const key=r.mode+'|'+r.ticketCount;const g=groups.get(key)||[];g.push(r);groups.set(key,g);}
 return [...groups.values()].map(g=>({mode:g[0].mode,ticketCount:g[0].ticketCount,seedRuns:g.length,meanNetMxn:g.reduce((s,x)=>s+x.netMxn,0)/g.length,meanGrossMxn:g.reduce((s,x)=>s+x.grossPrizesMxn,0)/g.length,meanHits:g.reduce((s,x)=>s+x.winningTickets,0)/g.length,meanDrawsWithWin:g.reduce((s,x)=>s+x.drawsWithAnyWin,0)/g.length,meanRoi:g.every(x=>x.roiOnCost!==null)?g.reduce((s,x)=>s+(x.roiOnCost as number),0)/g.length:null,minNetMxn:Math.min(...g.map(x=>x.netMxn)),maxNetMxn:Math.max(...g.map(x=>x.netMxn))}));
}
