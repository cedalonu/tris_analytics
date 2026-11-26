#!/usr/bin/env tsx
/**
 * Historical-only past-only regime and positional analysis.
 * Each target label uses only the preceding history. No prospective portfolio
 * ledger or resolved forecast is required; no APIs, polling, or downloads.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {classifyPastOnlyRegimes} from "../src/research/past-only-regime-classifier";
import {stabilizePastOnlyRegimes} from "../src/research/regime-transition-stability";
import {analyzeRegimeTransitionDynamics} from "../src/research/regime-transition-dynamics";
import {analyzePositionalRegimeProfiles} from "../src/research/positional-regime-profile";
import {summarizePositionalRegimeStability} from "../src/research/positional-regime-stability";
import {comparePositionalRegimes} from "../src/research/positional-regime-contrast";
import {analyzePositionalTransitionPersistence} from "../src/research/positional-transition-persistence";
import {analyzePositionalPoolConcordance} from "../src/research/positional-pool-concordance";
import {analyzePositionalPoolTemporalStability} from "../src/research/positional-pool-temporal-stability";
import {analyzePositionalPoolScaleSensitivity} from "../src/research/positional-pool-scale-sensitivity";
import {analyzePositionalPoolOriginSensitivity} from "../src/research/positional-pool-origin-sensitivity";
import {analyzePositionalPoolJointRobustness} from "../src/research/positional-pool-joint-robustness";
import {analyzePositionalPoolWindowSensitivity} from "../src/research/positional-pool-window-sensitivity";
import {analyzePositionalPoolSupportSensitivity} from "../src/research/positional-pool-support-sensitivity";

const input=process.argv[2];
if(!input){console.error("Usage: npm run research:historical-regime-analysis -- <local-Tris.csv> [output-directory]");process.exit(2);}
const csv=await readFile(resolve(input),"utf8");
const imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=imported.validation.warnings.filter(x=>x.startsWith("draw gap "));
if(gaps.length){console.error("Historical regime analysis blocked: missing contest IDs.\n"+gaps.slice(0,30).join("\n"));process.exit(1);}
const draws=imported.validation.valid;
const referenceWindow=Number(process.env.TRIS_REGIME_REFERENCE_WINDOW??25);
const recentWindow=Number(process.env.TRIS_REGIME_RECENT_WINDOW??25);
const firstTarget=draws[0].drawId+referenceWindow+recentWindow;
const lastTarget=draws.at(-1)!.drawId;
if(lastTarget<firstTarget){console.error("Insufficient history for the configured past-only warm-up.");process.exit(1);}
const classifier=classifyPastOnlyRegimes(draws,firstTarget,lastTarget,{
 referenceWindow,recentWindow,
 poolTvThreshold:Number(process.env.TRIS_REGIME_POOL_TV_THRESHOLD??.2),
 duplicateRateThreshold:Number(process.env.TRIS_REGIME_DUPLICATE_THRESHOLD??.08),
 distinctMeanThreshold:Number(process.env.TRIS_REGIME_DISTINCT_THRESHOLD??.5),
 entropyThreshold:Number(process.env.TRIS_REGIME_ENTROPY_THRESHOLD??.35)
});
if(classifier.skippedDrawIds.length){console.error("Past-only classifier skipped targets: "+classifier.skippedDrawIds.slice(0,30).join(", "));process.exit(1);}
const stability=stabilizePastOnlyRegimes(classifier.labels,{minConsecutive:Number(process.env.TRIS_REGIME_MIN_CONSECUTIVE??3)});
const dynamics=analyzeRegimeTransitionDynamics(classifier.labels);
const positionalProfiles=analyzePositionalRegimeProfiles(draws,stability.auditLabels,{minimumSupport:Number(process.env.TRIS_REGIME_POSITION_MIN_SUPPORT??30)});
const positionalStability=summarizePositionalRegimeStability(draws,stability.auditLabels,{
 blockSize:Number(process.env.TRIS_REGIME_POSITION_BLOCK_SIZE??25),
 minimumDrawSupport:Number(process.env.TRIS_REGIME_POSITION_BLOCK_MIN_SUPPORT??10)
});
const positionalContrasts=comparePositionalRegimes(positionalProfiles,positionalStability,{
 minimumRegimeSupport:Number(process.env.TRIS_REGIME_CONTRAST_MIN_SUPPORT??30),
 jensenShannonDistanceThreshold:Number(process.env.TRIS_REGIME_CONTRAST_JS_THRESHOLD??.10),
 entropyDifferenceThresholdBits:Number(process.env.TRIS_REGIME_CONTRAST_ENTROPY_BITS??.25)
});
const positionalTransitions=analyzePositionalTransitionPersistence(positionalStability,{
 minimumConsecutiveBlocksForSustained:Number(process.env.TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS??2)
});
const positionalPoolConcordance=analyzePositionalPoolConcordance(draws,stability.auditLabels,positionalStability,{
 minimumHistory:Number(process.env.TRIS_POSITIONAL_POOL_MIN_HISTORY??30)
});
const positionalPoolTemporalStability=analyzePositionalPoolTemporalStability(positionalPoolConcordance,{
 windowBlocks:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_WINDOW??5),
 stepBlocks:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_STEP??1),
 minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_MIN_PAIRS??3)
});
const positionalPoolScaleSensitivity=analyzePositionalPoolScaleSensitivity(draws,stability.auditLabels,{
 blockSizes:(process.env.TRIS_POSITIONAL_POOL_BLOCK_SIZES??"10,15,25,40").split(",").map(Number),
 minimumHistory:Number(process.env.TRIS_POSITIONAL_POOL_MIN_HISTORY??30),
 minimumDrawSupport:Number(process.env.TRIS_POSITIONAL_POOL_BLOCK_MIN_SUPPORT??10)
});
const positionalPoolOriginSensitivity=analyzePositionalPoolOriginSensitivity(draws,stability.auditLabels,{
 blockSize:Number(process.env.TRIS_POSITIONAL_POOL_ORIGIN_BLOCK_SIZE??25),
 blockOffsets:(process.env.TRIS_POSITIONAL_POOL_BLOCK_OFFSETS??"0,6,12,18").split(",").map(Number),
 minimumHistory:Number(process.env.TRIS_POSITIONAL_POOL_MIN_HISTORY??30),
 minimumDrawSupport:Number(process.env.TRIS_POSITIONAL_POOL_BLOCK_MIN_SUPPORT??10)
});
const positionalPoolJointRobustness=analyzePositionalPoolJointRobustness(positionalPoolScaleSensitivity,positionalPoolOriginSensitivity);
const positionalPoolWindowSensitivity=analyzePositionalPoolWindowSensitivity(positionalPoolConcordance,{
 windows:(process.env.TRIS_POSITIONAL_POOL_WINDOW_SIZES??"5,8,10").split(",").map(Number),
 minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_WINDOW_MIN_PAIRS??3)
});
const positionalPoolSupportSensitivity=analyzePositionalPoolSupportSensitivity(draws,stability.auditLabels,{
 minimumHistories:(process.env.TRIS_POSITIONAL_POOL_MIN_HISTORIES??"20,30,50").split(",").map(Number),
 minimumDrawSupports:(process.env.TRIS_POSITIONAL_POOL_MIN_SUPPORT_GRID??"5,10,15").split(",").map(Number),
 blockSize:Number(process.env.TRIS_POSITIONAL_POOL_ORIGIN_BLOCK_SIZE??25)
});
const sourceSha256=createHash("sha256").update(csv,"utf8").digest("hex");
const generatedAt=new Date().toISOString();
const regimeCounts=classifier.labels.reduce((a,x)=>({...a,[x.regimeId]:(a[x.regimeId]??0)+1}),{} as Record<string,number>);
const payload={generatedAt,source:basename(resolve(input)),sourceSha256,drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws.at(-1)!.drawId,classifier:{method:classifier.method,warmupDraws:classifier.warmupDraws,firstTargetDrawId:firstTarget,lastTargetDrawId:lastTarget,labels:classifier.labels,diagnostics:classifier.diagnostics,regimeCounts,limitations:classifier.limitations},stability,dynamics,positionalProfiles,positionalStability,positionalContrasts,positionalTransitions,positionalPoolConcordance,positionalPoolTemporalStability,positionalPoolScaleSensitivity,positionalPoolOriginSensitivity,positionalPoolJointRobustness,positionalPoolWindowSensitivity,positionalPoolSupportSensitivity};
const out=resolve(process.argv[3]??"reports/historical-regime-analysis");
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify(payload,null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=[
 "# TRIS — análisis histórico posicional condicionado por regímenes","",
 "- Fuente: "+basename(resolve(input)),
 "- SHA-256: "+sourceSha256,
 "- Sorteos válidos: "+draws.length+" ("+draws[0].drawId+"–"+draws.at(-1)!.drawId+")",
 "- Objetivos etiquetados: "+classifier.labels.length+" ("+firstTarget+"–"+lastTarget+")",
 "- Ventanas pasadas por objetivo: "+referenceWindow+" de referencia + "+recentWindow+" recientes",
 "- Regímenes descriptivos: "+Object.keys(regimeCounts).length,
 "- Episodios: "+stability.episodes.length+"; transiciones observadas: "+stability.transitions,
 "- Transiciones confirmadas: "+stability.confirmedTransitions,
 "",
 "## Distribución de regímenes",
 "| Régimen | Objetivos |","|---|---:|",
 ...Object.entries(regimeCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>"| "+k+" | "+v+" |"),
 "",
 "## Episodios confirmados",
 "| # | Régimen | Inicio | Fin | Longitud | Estado | Confirmado en |",
 "|---:|---|---:|---:|---:|---|---:|",
 ...stability.episodes.map(e=>"| "+e.episodeIndex+" | "+e.regimeId+" | "+e.startDrawId+" | "+e.endDrawId+" | "+e.length+" | "+e.status+" | "+(e.confirmedAtDrawId??"n/d")+" |"),
 "",
 "## Perfil posicional por régimen",
 "| Régimen | n | Soporte | R1 | R2 | R3 | R4 | R5 |",
 "|---|---:|---|---|---|---|---|---|",
 ...positionalProfiles.regimes.map(r=>"| "+r.regimeId+" | "+r.n+" | "+r.support+" | "+r.positions.map(p=>(p.dominantDigit===null?"n/d":p.dominantDigit+" ("+pct(p.dominantShare)+")")).join(" | ")+" |"),
 "",
 "## Estabilidad por bloques",
 "| Régimen | Posición | Bloques adecuados | Consistencia dominante | Estado |",
 "|---|---:|---:|---:|---|",
 ...positionalStability.regimes.map(r=>"| "+r.regimeId+" | R"+(r.position+1)+" | "+r.supportedBlocks+" | "+pct(r.dominantConsistency)+" | "+r.interpretation+" |"),
 "",
 "## Concordancia entre pool y perfil posicional",
 "| Régimen | Posición | Método | Pool | Bloques | Corr. dominante/inclusión | Corr. inclusión/acierto | Interpretación |",
 "|---|---:|---|---:|---:|---:|---:|---|",
 ...positionalPoolConcordance.groups.map(g=>"| "+g.regimeId+" | R"+(g.position+1)+" | "+g.method+" | "+g.poolSize+" | "+g.blocks+" | "+(g.dominantShareVsPoolInclusionCorrelation?.toFixed(3)??"n/d")+" | "+(g.dominantInclusionVsHitRateCorrelation?.toFixed(3)??"n/d")+" | "+g.interpretation+" |"),
 "",
 "## Robustez y sensibilidad",
 "- Grupos de concordancia temporal: "+positionalPoolTemporalStability.groups.length,
 "- Clasificación conjunta escala/origen: "+JSON.stringify(positionalPoolJointRobustness.summary),
 "| Ventana (bloques) | Paso | Grupos | Positivos | Negativos | Inestables | Insuficientes |",
 "|---:|---:|---:|---:|---:|---:|---:|",
 ...positionalPoolWindowSensitivity.configurations.map(x=>"| "+x.windowBlocks+" | "+x.stepBlocks+" | "+x.groups+" | "+x.positive+" | "+x.negative+" | "+x.unstable+" | "+x.insufficient+" |"),
 "| Historia mínima | Soporte mínimo | Evaluados | Calculables | Positivos | Negativos | No calculables |",
 "|---:|---:|---:|---:|---:|---:|---:|",
 ...positionalPoolSupportSensitivity.summary.map(x=>"| "+x.minimumHistory+" | "+x.minimumDrawSupport+" | "+x.evaluated+" | "+x.calculable+" | "+x.positive+" | "+x.negative+" | "+x.nullCorrelation+" |"),
 "",
 "## Limitaciones",
 ...[...classifier.limitations,...stability.limitations,...dynamics.limitations,...positionalProfiles.limitations,...positionalStability.limitations,...positionalPoolConcordance.limitations,...positionalPoolTemporalStability.limitations,...positionalPoolScaleSensitivity.limitations,...positionalPoolOriginSensitivity.limitations,...positionalPoolJointRobustness.limitations,...positionalPoolWindowSensitivity.limitations,...positionalPoolSupportSensitivity.limitations].map(x=>"- "+x),
 "",
 "Este flujo es histórico y descriptivo. Cada etiqueta de régimen usa exclusivamente sorteos anteriores al objetivo; no requiere ni crea resultados prospectivos, no retrocompleta pronósticos y no activa señales."
].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");
console.log(md);
