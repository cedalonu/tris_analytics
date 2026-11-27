# Fase 113 — Detector de cambios de régimen por posición

## Método
Para cada concurso objetivo compara una ventana de referencia y una reciente, ambas estrictamente anteriores al objetivo. Calcula distancia Jensen-Shannon independientemente para cada posición. La referencia de retorno queda congelada en el periodo anterior al primer objetivo. Un episodio inicia si la distancia entre ventanas supera el umbral; finaliza cuando la distribución reciente vuelve a quedar dentro del umbral de retorno respecto a la referencia congelada.

## Uso
`npm run research:positional-change-points -- <local-Tris.csv> <firstTargetDrawId> <lastTargetDrawId> [referenceWindow=25] [recentWindow=25] [changeThreshold=0.20]`

Ejemplo: `npm run research:positional-change-points -- Tris.csv 5000 6000 25 25 0.20`

Salidas: `reports/positional-change-points/latest.json` y `latest.md`.

## Límites
El concurso objetivo no participa en su detección. Las ventanas móviles se solapan; episodios cercanos no son independientes. Umbrales descriptivos, no inferenciales. El retorno es relativo a una referencia fija, no prueba un estado latente verdadero. No implica sesgo físico, causalidad ni capacidad predictiva.