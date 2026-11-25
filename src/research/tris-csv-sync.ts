/**
 * Local CSV update tracker for TRIS. No APIs, polling, or network access.
 * It detects appended contests while protecting the already processed prefix.
 * CONCURSO is the contest key; the CSV ID column is not imported or consulted.
 */
import { createHash } from "node:crypto";
import type { Draw } from "../research-core";

export interface TrisSyncCheckpoint {
  schemaVersion: 1;
  processedThroughDrawId: number;
  processedDrawCount: number;
  processedPrefixSha256: string;
  updatedAt: string;
}
export interface TrisSyncResult {
  status: "initialized" | "unchanged" | "updated";
  latestDrawId: number;
  previousDrawId: number | null;
  newDraws: Draw[];
  drawsByDate: Record<string, number>;
  warnings: string[];
  checkpoint: TrisSyncCheckpoint;
}
const canonicalRows = (draws: Draw[]) => draws.map(d =>
  [d.drawId,d.digits.join(""),d.date ?? ""].join("|")
).join("\n") + (draws.length ? "\n" : "");
export const fingerprintDraws = (draws: Draw[]) =>
  createHash("sha256").update(canonicalRows(draws),"utf8").digest("hex");

export function syncTrisCsvSnapshot(
  draws: Draw[], previous: TrisSyncCheckpoint | null, now = new Date().toISOString()
): TrisSyncResult {
  if (!draws.length) throw new Error("CSV contains no valid TRIS draws");
  for(let i=0;i<draws.length;i++) {
    if(i && draws[i].drawId !== draws[i-1].drawId+1)
      throw new Error("missing contest ID between " + draws[i-1].drawId + " and " + draws[i].drawId);
    if(!Number.isInteger(draws[i].drawId) || draws[i].drawId<=0 ||
      draws[i].digits.length!==5 || draws[i].digits.some(d=>!Number.isInteger(d)||d<0||d>9))
      throw new Error("invalid validated draw at index " + i);
  }
  let status: TrisSyncResult["status"], newDraws: Draw[], previousDrawId:number|null=null;
  if(!previous) {
    status="initialized";
    newDraws=draws.slice();
  } else {
    if(previous.schemaVersion!==1 || !Number.isInteger(previous.processedThroughDrawId) ||
      !Number.isInteger(previous.processedDrawCount) || previous.processedDrawCount<1)
      throw new Error("unsupported or malformed TRIS sync checkpoint");
    previousDrawId=previous.processedThroughDrawId;
    const prefix=draws.filter(d=>d.drawId<=previousDrawId);
    if(prefix.length!==previous.processedDrawCount || prefix.at(-1)?.drawId!==previousDrawId)
      throw new Error("CSV no longer contains the complete processed prefix; restore history before syncing");
    if(fingerprintDraws(prefix)!==previous.processedPrefixSha256)
      throw new Error("previously processed CSV rows changed; refusing incremental sync");
    newDraws=draws.filter(d=>d.drawId>previousDrawId);
    if(newDraws.length && newDraws[0].drawId!==previousDrawId+1)
      throw new Error("new contests are not contiguous with the previous checkpoint");
    status=newDraws.length?"updated":"unchanged";
  }
  const counts:Record<string,number>={};
  for(const draw of newDraws) if(draw.date) {
    const day=draw.date.slice(0,10);
    counts[day]=(counts[day]??0)+1;
  }
  const warnings:string[]=[];
  for(const [day,count] of Object.entries(counts)) if(count>5)
    warnings.push(day+" contains "+count+" new contests; expected schedule reference is five daily draws (CDMX scheduled times 13:00, 15:00, 17:00, 19:00 and 21:00; CSV refresh is about one hour after each draw).");
  if(newDraws.length>5)
    warnings.push("More than five new contests arrived in one sync; all are retained and processed in contest-ID order.");
  const checkpoint:TrisSyncCheckpoint={
    schemaVersion:1,
    processedThroughDrawId:draws.at(-1)!.drawId,
    processedDrawCount:draws.length,
    processedPrefixSha256:fingerprintDraws(draws),
    updatedAt:now
  };
  return {status,latestDrawId:draws.at(-1)!.drawId,previousDrawId,newDraws,drawsByDate:counts,warnings,checkpoint};
}
