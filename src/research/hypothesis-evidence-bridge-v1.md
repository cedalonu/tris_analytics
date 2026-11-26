# Hypothesis registry ↔ evidence gate bridge v1

This adapter connects the existing versioned hypothesis registry to the transparent signal evidence evaluator. It does not modify hypothesis lifecycle status or promote a signal.

- Selects the most recent registry evidence entry marked `prospective` by recorded timestamp.
- Historical/validation/holdout entries do not become prospective evidence through this adapter.
- Resolved sample is taken from that prospective entry's `sampleSize`.
- Coverage, integrity, temporal persistence, sensitivity, independent-family count and multiple-testing status must be supplied explicitly by the caller. They are not guessed or derived from notes.
- If no prospective evidence exists, the origin remains historical/exploratory and the readiness state cannot be validation-ready.

This is a readiness report only, not a lottery prediction, betting recommendation, or proof of an edge.
