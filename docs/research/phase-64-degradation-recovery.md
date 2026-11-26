# Phase 64 — Degradation and recovery monitor
## Purpose
Detect abrupt or persistent changes in research-priority scores over successive dated history snapshots. This is descriptive monitoring of a triage score, not draw accuracy, predictive probability, or lottery advantage.

## States
- insufficient: fewer than two snapshots.
- stable: no threshold event observed.
- watch: recent drop of 10 points or two consecutive drops of at least 8.
- degraded: 15+ points below the running maximum or three consecutive declines.
- recovering: score rises 10+ from the observed trough after degradation.
- recovered: score returns within 5 points of the first observed baseline after recovery.

Thresholds are heuristic and fixed in code. Sparse histories remain insufficient; no missing values are imputed. Events retain snapshot timestamp and score, deterministically ordered.

## Limitations
The priority score itself includes history depth, quality, and classification descriptor; therefore changes may reflect the triage recipe or data, not any real-world performance. No gambling recommendation.
