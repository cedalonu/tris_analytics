# TRIS CSV sync protocol v1

## Source format and identity
The CSV schema is `CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS`. `CONCURSO` is the contest number and the only key used for chronology, uniqueness and continuity. The `ID` column is ignored completely. R1–R5 are the winning digits; FECHA is the draw date; PRIMOS and REPETIDOS are supplementary metadata.

## Update cadence
The file is refreshed approximately one hour after each individual draw, not once after all five daily draws. Schedule in Mexico City time:
- Tris Medio Día: 13:00
- Tris de las Tres: 15:00
- Tris Extra: 17:00
- Tris de las Siete: 19:00
- Tris Clásico: 21:00

Run the local sync after each corresponding CSV refresh. No automatic polling, downloads, APIs or network access are used.

## Command
`npm run research:sync -- ./data/Tris.csv`

The sync validates consecutive CONCURSO values, protects the previously processed prefix with SHA-256 and returns only newly appended contests. It never uses ID and never fills missing contest numbers.
