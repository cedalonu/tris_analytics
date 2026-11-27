# Fase 90 — Genealogía y linajes de comunidades de ciclos

## Objetivo
Reconstruir la ascendencia temporal de las comunidades detectadas en la fase 89, conservando todas las relaciones de solapamiento para representar divisiones y fusiones sin reducirlas a un único “mejor padre”.

## Método
- Cada observación de comunidad en una ventana es un nodo distinto.
- Dos observaciones de ventanas consecutivas se conectan si comparten al menos un episodio de ciclo. La identidad del episodio incluye tríada, inicio, fin, periodo y secuencia.
- Los ancestros se propagan como un conjunto de linajes raíz. Una división conserva la ascendencia en todas sus ramas; una fusión hereda todos los linajes predecesores.
- Cada raíz define un linaje familiar; por ello la genealogía es una red dirigida acíclica, no necesariamente un árbol.
- Métricas: observaciones, duración en ventanas distintas, tamaño máximo, divisiones, fusiones, descendientes y actividad en la última ventana.
- Clasificación descriptiva: efímera (1 ventana), corta (2–3), persistente (4 o más).

## Límites
La relación se basa en episodios compartidos entre ventanas adyacentes y no demuestra causalidad. La clasificación depende del tamaño de ventana, periodo, repeticiones y umbral de sincronización. No es un pronóstico de resultados de TRIS.
