# P2.7 — Migración de conteos de transición posicional a INA

**Estado:** motor base de transiciones implementado y validado; el módulo completo sigue parcial porque faltan estabilidad temporal, entropía y detección de cambios.  
**Rama:** `research-core-v1`

## Problema resuelto

Los paneles de red calculaban matrices 4×10×10 de transiciones adyacentes directamente en React, además de recalcular totales por nodo. Esto duplicaba el conteo histórico y permitía que las vistas derivaran de rutas distintas.

## Motor INA añadido

`src/research/ina-positional-transitions.ts`:
- Cuenta las transiciones R1→R2, R2→R3, R3→R4 y R4→R5 en una ventana seleccionada.
- Devuelve aristas dispersas con posición, dígitos, conteo, ratio descriptivo, claves y nodos.
- Devuelve conteos por nodo/posición para las cinco posiciones.
- Expone tamaño de muestra, primer/último concurso del corte, máximo observado y referencia uniforme aproximada.
- Publica `research.positional-transitions` con versión/hash/corte heredados de INA.

## Integración visual

- La red de transiciones del panel principal consume las aristas INA.
- El mapa INA reutiliza las mismas aristas y conteos de nodos para el mismo corte.
- Se eliminaron las dos matrices base duplicadas de la interfaz.
- Las comparaciones de ventanas recientes/previas y las métricas de entropía aún se calculan localmente; no se consideran migradas en este subpaso.

## Pruebas

`src/research/ina-positional-transitions.test.ts` comprueba conteos de aristas, totales de nodos, referencia esperada, cortes temporales, dataset vacío y rechazo de contexto inválido.

CI:
- [Research validation 46123062039](https://github.com/cedalonu/tris_analytics/actions/runs/46123062039): TypeScript, build visual y suite de investigación aprobados.
- [Research core checks 46122998490](https://github.com/cedalonu/tris_analytics/actions/runs/46122998490): type check y suite de pruebas aprobados.

## Límites

La referencia `N/100` supone uniformidad aproximada de los 100 pares posibles y sólo sirve como orientación descriptiva. No es un modelo nulo ajustado ni una probabilidad de transición futura. La red no demuestra causalidad ni ventaja predictiva.

## Cierre

- [x] Conteos base de transición extraídos a INA.
- [x] Red principal y mapa INA reutilizan el mismo output.
- [x] Salida versionada y trazable.
- [x] TypeScript, build y suite de pruebas aprobados.
- [ ] Migrar estabilidad temporal, entropía y cambios de régimen.
