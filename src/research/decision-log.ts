import {assessEligibility,type EligibilityConfig} from "./eligibility";
import {assessResearchPriority} from "./research-priority";
import {assessHistoryQuality} from "./history-quality";
export type DecisionSnapshot={candidateKey:string;recordedAt:string;classification:string;resolved:number;reasons?:string[];limitations?:string[]};
export type DecisionEvent={eventId:string;candidateKey:string;recordedAt:string;version:"decision-log-v1";config:EligibilityConfig;qualityScore:number;qualityLabel:string;eligibility:string;eligibilityReasons:string[];priorityScore:number;queue:string;components:{quality:number;depth:number;stability:number;descriptor:number};transition:{fromEligibility:string|null;toEligibility:string;fromQueue:string|null;toQueue:string;changed:boolean};classification:string;resolved:number;sourceTimestamp:string;};
const safe=(s:string)=>s.replace(/[^a-zA-Z0-9._-]/g,"_");
export function buildDecisionLog(records:Array<{candidateKey:string;history:DecisionSnapshot[]}>,config:EligibilityConfig={minimumQuality:75,minimumRevisions:3}):DecisionEvent[]{
 const events:DecisionEvent[]=[];
 for(const record of records){const sorted=[...record.history].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));let prev:{eligibility:string;queue:string}|null=null;
 sorted.forEach((snap,i)=>{const prefix=sorted.slice(0,i+1),quality=assessHistoryQuality({candidateKey:record.candidateKey,history:prefix}),elig=assessEligibility({candidateKey:record.candidateKey,history:prefix},config),priority=assessResearchPriority({candidateKey:record.candidateKey,history:prefix},config);
 const transition={fromEligibility:prev?.eligibility??null,toEligibility:elig.status,fromQueue:prev?.queue??null,toQueue:priority.queue,changed:!!prev&&(prev.eligibility!==elig.status||prev.queue!==priority.queue)};
 const eventId=[safe(record.candidateKey),snap.recordedAt,config.minimumQuality,config.minimumRevisions,"decision-log-v1"].join("|");
 events.push({eventId,candidateKey:record.candidateKey,recordedAt:snap.recordedAt,version:"decision-log-v1",config:{...config},qualityScore:quality.score,qualityLabel:quality.label,eligibility:elig.status,eligibilityReasons:elig.reasons,priorityScore:priority.priorityScore,queue:priority.queue,components:{quality:priority.quality,depth:priority.depth,stability:priority.stability,descriptor:priority.descriptor},transition,classification:snap.classification,resolved:snap.resolved,sourceTimestamp:snap.recordedAt});prev={eligibility:elig.status,queue:priority.queue};});
 }return events.sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt)||a.candidateKey.localeCompare(b.candidateKey));
}