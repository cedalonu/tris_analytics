# TRIS Analytics — Auditoría de línea base CI y workflows

**Auditoría P0.3 · 2026-11-27**  
**Rama auditada:** `research-core-v1`  
**Estado:** baseline técnico de la versión de código identificada; las ejecuciones de workflows se distinguen por commit y propósito.

## 1. Resumen

La versión de código del dashboard y los motores de investigación inspeccionada en el commit `36694e63abe64e4ef400a537c9aab28d2ff3f66d` superó TypeScript, build, suite de pruebas y las calibraciones definidas por el workflow de investigación. También pasó la integración de historia real y el ciclo live en ese mismo commit.

Posteriormente, el workflow live se ejecutó con éxito en el commit de auditoría `9abced659553c21d31b8b41ab58048e4087e8d57` y volvió a completarse con éxito en `4190bb168a8a32916c9fb65df1a207cacce7128b`. El branch HEAD actual durante esta auditoría es `ad0ffab854c75a37ed942e587a1315524058954a`; los cambios posteriores al commit con suite completa fueron documentales, no modificaciones de `src/`, `scripts/` o configuración de dependencias.

## 2. Ejecuciones verificadas

| Workflow | Run | Commit evaluado | Resultado | Qué acredita |
|---|---:|---|---|---|
| TRIS research validation | [46104992953](https://github.com/cedalonu/tris_analytics/actions/runs/46104992953) | `36694e63` | **success** | TypeScript, build, 142 pruebas de investigación ejecutadas por el script, calibraciones sintéticas, controles de solapamiento y artefacto de calibración. |
| Research core checks | [46104982361](https://github.com/cedalonu/tris_analytics/actions/runs/46104982361) | `3bec1a14` | **success** | TypeScript y suite de investigación. |
| TRIS real-history integration validation | [46104992878](https://github.com/cedalonu/tris_analytics/actions/runs/46104992878) | `36694e63` | **success** | TypeScript, tests, build, sync/checkpoint, validación histórica, controles, memoria, walk-forward, ledger smoke test, prospectiva e informes. |
| TRIS live prospective cycle | [46104992891](https://github.com/cedalonu/tris_analytics/actions/runs/46104992891) | `36694e63` | **success** | Restauración de ledger, captura/validación de Pakin, ciclo/auditoría, publicación canónica y artifact. |
| TRIS live prospective cycle | [46115380850](https://github.com/cedalonu/tris_analytics/actions/runs/46115380850) | `9abced65` | **success** | Restauración del ledger, fuente hasta concurso 37007, checkpoint y auditoría, artifact actualizado. |
| TRIS live prospective cycle | [46115484237](https://github.com/cedalonu/tris_analytics/actions/runs/46115484237) | `4190bb16` | **success** | La ejecución live posterior a la matriz/reconciliación terminó correctamente. |

### 2.1 Detalle del run de investigación

Run `46104992953`: los pasos observados terminaron todos en `success`:
- TypeScript check.
- Build visual application.
- Research unit tests.
- Past-only regime classifier calibration.
- Positional stability synthetic calibration.
- Positional transition persistence calibration.
- Positional-pool temporal stability calibration.
- Positional-pool sensitivity grid.
- Candidate catalog overlap.
- Structural candidate portfolio comparison.
- Family concordance synthetic null.
- Synthetic detector calibration.
- Upload del artefacto de calibración.

Esto acredita que el workflow configurado pasó, no que todos los 150 motores hayan sido ejecutados contra datos reales ni que exista cobertura completa de cada runner.

### 2.2 Detalle del run de historia real

Run `46104992878`: todos los pasos configurados terminaron en `success`, incluyendo:
- Validación y checkpoint del CSV.
- Validación cronológica de hipótesis congeladas.
- Análisis de regímenes históricos.
- Dependencia conjunta en holdout.
- Controles nulos/permutación/circular shift y split temporal.
- Memoria temporal, contextual, adaptativa y condicionada por régimen.
- Concordancia, interacciones, comportamiento colectivo y persistencia.
- Matriz de pools y walk-forward de portafolios.
- Smoke test idempotente del ledger.
- Congelación, auditoría, cobertura, desempeño, estabilidad y sensibilidad prospectiva.
- Paquete de reportes, dossiers, tracker y alertas.

**Limitación crítica:** el workflow usa el fixture fijo `data/source-snapshots/Tris-2026-11-25.csv`. Su éxito es una prueba reproducible con ese snapshot, no una validación sobre la última captura 37007. Debe mantenerse explícitamente etiquetado como fixture o parametrizarse con el snapshot canónico.

### 2.3 Detalle del ciclo live más reciente inspeccionado

Run `46115380850` terminó con todos sus pasos en `success`. El log del mismo run informa:
- Histórico validado: **25,975** sorteos.
- Último concurso: **37007**.
- Ciclos congelados acumulados: **6**.
- Señales congeladas acumuladas: **589**.
- Outcomes resueltos: **489**.
- Checkpoint: **matched**.
- Siguiente objetivo prospectivo: **37008**.
- Ledger restaurado del último run exitoso y artifact `tris-live-prospective-ledger` generado.

La captura/manifiesto observado corresponde a `Tris-37007-e77a3ef65259.csv`, SHA-256 `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6`.

Estos conteos son el resumen del runner. No equivalen a 489 concursos independientes ni demuestran una ventaja predictiva; las señales comparten sorteos y configuraciones. Tampoco certifican por sí solos que el dashboard haya consumido automáticamente el ledger.

## 3. Fallos históricos y su interpretación

Se inspeccionaron los runs fallidos:
- [46103111831](https://github.com/cedalonu/tris_analytics/actions/runs/46103111831)
- [46103099715](https://github.com/cedalonu/tris_analytics/actions/runs/46103099715)

En ambos, el paso de ciclo, restauración, captura y validación completó, pero falló `Publish validated canonical historical dataset` al intentar hacer `git push`: GitHub rechazó el push por `non-fast-forward` porque había entrado otro commit en la rama mientras el workflow ejecutaba. El log muestra explícitamente el rechazo `fetch first`.

La versión actual de `.github/workflows/tris-live-prospective.yml` contiene `git pull --rebase origin research-core-v1` antes del push cuando hay cambios canónicos, para reconciliar commits concurrentes. Los runs posteriores `46104992891` y `46115380850` terminaron en éxito. Esto muestra que la ruta normal actual opera; aún conviene probar concurrencia real bajo dos actualizaciones simultáneas, sin forzar escrituras destructivas.

## 4. Cobertura que sigue sin estar acreditada

1. No hay un workflow que ejecute individualmente los 71 scripts de investigación; la suite CI es una selección por familias.
2. Algunos runners prospectivos dependen de resultados resueltos y permanecen fuera de CI cuando no hay soporte suficiente. Esto es correcto; no deben alimentarse con resultados retrospectivos falsamente etiquetados como prospectivos.
3. El workflow de historia real usa snapshot fijo 2026-11-25, no el último snapshot de Pakin.
4. El dashboard operativo importa manualmente el ledger; la automatización del ciclo no demuestra su propagación automática a la interfaz.
5. No existe todavía INA Core común que garantice que cada motor y cada componente visual usa el mismo hash/corte.
6. Los resultados sintéticos son calibración de software y escenarios nulos, no evidencia de que una estrategia prediga TRIS.

## 5. Dictamen P0.3

<badge>Baseline CI aprobada para el commit de código 36694e63</badge>

- [x] TypeScript y build completados correctamente.
- [x] Suite de pruebas de investigación completada correctamente.
- [x] Workflow de calibración sintética completado correctamente.
- [x] Workflow de historia real completado correctamente sobre el fixture declarado.
- [x] Workflow live completado correctamente y actualizado hasta 37007.
- [x] Runs fallidos anteriores clasificados como conflicto de push no-fast-forward.
- [ ] Repetir historia real sobre snapshot canónico actual (37007), no fixture 2026-11-25.
- [ ] Probar persistencia/continuidad del ledger a través de múltiples ciclos y comparar sus hashes.
- [ ] Demostrar que el dashboard recibe automáticamente la misma versión de dataset y ledger.
- [ ] Probar propagación de una actualización hasta INA y las visualizaciones (bloqueado hasta P1/P4).

**Conclusión:** el baseline de código y los workflows principales está sano en los commits verificados. No se declara cerrado el ciclo integral ni la integración visual/INA. P0.1, P0.2 y el baseline P0.3 quedan documentados; los puntos pendientes pasan a las etapas P1–P4 del plan maestro.
