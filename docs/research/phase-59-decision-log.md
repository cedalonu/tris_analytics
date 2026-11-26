# Phase 59 — Consolidated decision log
- Reconstructs deterministic decisions from imported snapshots and preserves source timestamps; no synthetic evaluation time.
- Each snapshot prefix records config, schema version, quality score/label, eligibility and reasons, priority/queue, components, classification/support, and prior/current state.
- IDs are stable per candidate, source timestamp, configuration and schema version. Configuration changes create distinct IDs.
- Reproducible audit view, not an immutable remote ledger. Export JSON to preserve a review cut.
- Research triage only; no forecast, probability, or lottery advantage.