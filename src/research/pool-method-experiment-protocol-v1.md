# Pool-method experiment protocol v1

## Scope
Walk-forward comparison of pool construction methods by digit position. Compare candidate pools to uniform inclusion (k/10), a fixed frequency pool from initial training, and rolling frequency pool from the preceding trailing window.

## Candidate methods
frequency, long-absence, short-absence, balanced, recent-frequency.

## Matrix
Default exploratory matrix: five positions, five candidate methods, pool sizes 1–10, trailing windows 20, 50, 100, 200; minimum training length 100. This produces 1,000 parameter combinations. Each evaluated draw uses only earlier observations. Inputs must be validated and strictly sorted by draw ID.

## Reporting
Report tested count, hits/rate, uniform reference, lift vs uniform, fixed and rolling frequency hit rates, paired mean hit difference vs rolling baseline and simple normal-approximation interval. The interval does not correct serial dependence or multiple testing.

## Validation separation
Matrix is discovery only. Freeze shortlisted position/method/size/window combinations before prospective validation on new draws. Preserve source fingerprint and exact experiment settings. Historical lift is not predictive certainty.
