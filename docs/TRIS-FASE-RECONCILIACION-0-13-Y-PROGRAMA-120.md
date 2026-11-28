# TRIS Analytics — Reconciliación de fases y programa 120

**Auditoría P0.2 · 2026-11-27**  
**Rama:** `research-core-v1`  
**HEAD base de esta revisión:** `9abced659553c21d31b8b41ab58048e4087e8d57`  
**Propósito:** reconciliar el roadmap v1, las fases 0–13, el programa de seis puntos llamado «fase 120» en las conversaciones y el plan rector v2. No se considera una fase analítica adicional ni se duplica trabajo ya implementado.

## 1. Aclaración sobre «fase 120»

La revisión del árbol de la rama no encontró un documento o módulo formal llamado `phase-120` / «fase 120». En la conversación, «fase 120» identifica un programa de cierre operativo aprobado por el usuario con seis objetivos:

1. Cerrar la fase 120.
2. Ejecutar y auditar el ciclo completo con el CSV.
3. Consolidar memoria y evaluador.
4. Construir el investigador automático.
5. Acumular y evaluar evidencia prospectiva.
6. Terminar el dashboard operativo y documentar la puesta en marcha.

Se interpreta como un **programa paraguas de finalización**, no como una etapa estadística equivalente a las fases 0–13. El plan maestro v2 lo organiza en sus etapas 0–6 y esta reconciliación conserva los seis objetivos como criterios de aceptación finales.

## 2. Reconciliación de las fases 0–13

Estados usados:
- **Código presente:** existe implementación identificable; no implica ejecución aprobada.
- **Parcial:** existe una parte sustancial, pero falta una dependencia, integración, auditoría o prueba de salida.
- **Pendiente de evidencia:** la lógica puede existir, pero no se ha acreditado su ejecución válida con el dataset/ledger correspondiente.
- **Validado:** reservado para evidencia verificable de pruebas/ejecuciones, no para una descripción documental.

| Fase | Propósito | Implementación identificada | Estado auditado | Qué falta para cerrarla |
|---|---|---|---|---|
| 0 | Adaptador, importación e integridad | `data-adapter.ts`, `tris-csv.ts`, `history-quality.ts`, `tris-csv-sync.ts`; tests de adapter/CSV/sync | **Código presente; cierre pendiente** | Ejecutar tests completos, contrastar el CSV real actual, auditar prefijo histórico/checkpoint y verificar manifiesto/snapshot. |
| 1 | Investigación descriptiva, pools, transiciones, memoria y ausencia | `pool-analysis.ts`, `collective-behavior.ts`, `absence-analysis.ts`, motores posicionales, memoria y regímenes | **Parcial** | Unificar resultados reproducibles, auditar denominadores/ventanas y vincular cada salida a su visualización y corte de datos. |
| 2 | Generación/selección de hipótesis y control de selección | Catálogo de candidatos, generador, priorizador, selector, solapamiento/redundancia y evaluadores cronológicos | **Código presente; evidencia fuera de muestra pendiente** | Verificar el catálogo y sus huellas; revisar leakage y separación discovery/validation/holdout; comparar baselines con presupuesto equivalente; congelar configuraciones. |
| 3 | Memoria de señales, congelación, resolución y aprendizaje por ciclos | `intuition-ledger.ts`, `intuition-prospective.ts`, `cycle-learning.ts`, `cycle-validation.ts`, runners y workflow horario | **Parcial / integración operativa incompleta** | Demostrar persistencia entre ejecuciones, append-only, resolución exacta, no-backfill y carga automática del ledger en el dashboard. |
| 4 | Memoria posicional y contextual | `temporal-memory.ts`, `contextual-memory.ts`, `position-context-memory.ts`, `adaptive-signal-memory.ts`, `regime-conditioned-memory.ts` | **Código presente; centralización pendiente** | Verificar aislamiento por posición/configuración/contexto, evaluar soporte prospectivo y mover el contexto compartido a INA Core. |
| 5 | Detección de cambios por posición y calibración nula | `position-change-detector.ts`, simulación nula, controles de dependencia/solapamiento y pruebas sintéticas | **Código presente; validación empírica pendiente** | Revisar CI, tasa de falsas alarmas bajo escenarios realistas y resultados prospectivos suficientes; no activar adaptación automática. |
| 6 | Concordancia y evaluación integral | Concordancia entre familias, auditorías de evidencia y comparaciones con baseline | **Parcial** | Evitar sumar señales dependientes, completar auditoría prospectiva y reportar soporte/cobertura/incertidumbre por familia. |
| 7 | Walk-forward de carteras estructurales | `candidate-portfolio-walk-forward.ts` | **Código presente; ejecución integral por verificar** | Reproducir con CSV canónico, revisar fases temporales y artefactos. |
| 8 | Benchmarks de presupuesto equivalente | Extensión de portfolio walk-forward con frequency-only, transition-only y recent-pool | **Código presente; ejecución integral por verificar** | Verificar denominadores, elegibilidad, presupuesto y salidas del run. |
| 9 | Estabilidad temporal de carteras | Bloques holdout, métricas de estabilidad y cobertura | **Código presente; evidencia de ejecución por verificar** | Confirmar bloques y reportes reales; no tratar bloques como observaciones independientes. |
| 10 | Cartera prospectiva congelada | `prospective-portfolio-monitor.ts`, manifiesto y ledger | **Parcial / persistencia crítica** | Acreditar continuidad del mismo manifiesto/ledger entre ejecuciones, identidad y hashes; no backfill. |
| 11 | Concordancia prospectiva por familia | `prospective-family-concordance.ts` | **Código presente; requiere outcomes prospectivos** | Ejecutar sobre ledger con resultados congelados/resueltos y soporte suficiente; distinguir familias por objetivo. |
| 12 | Calibración nula de concordancia | `family-concordance-null-simulation.ts` | **Código presente; calibración CI descrita** | Verificar run vigente y artefacto de salida; mantener etiqueta sintética, no empírica. |
| 13 | Auditoría de concordancia observada vs nula | `prospective-family-concordance-audit.ts` | **Código presente; bloqueada sin evidencia prospectiva suficiente** | Ejecutar sólo con ledger real, congelado y al menos el soporte mínimo; no reemplazar outcomes faltantes con histórico. |

**Regla de cierre:** las fases 7–13 amplían y refinan la validación de carteras y concordancia; no reemplazan ni cierran automáticamente las fases 0–6. El hecho de que un runner, test o documento exista no cierra una fase. Se requiere la salida real y la auditoría correspondiente.

## 3. Reconciliación del programa «fase 120» con el plan maestro v2

| Objetivo aprobado del programa 120 | Etapa del plan v2 | Evidencia que debe existir para aceptación |
|---|---|---|
| Cerrar fase 120 / ordenar el proyecto | Etapa 0 — inventario y auditoría | Matriz investigación-visual, reconciliación 0–13, inventario de workflows, baseline CI y lista de bloqueos. |
| Ejecutar y auditar ciclo completo con CSV | Etapa 4 — ingestión y propagación; complementa Etapa 0 | Snapshot y manifiesto, hash, validación, checkpoint, ciclo idempotente, ledger antes/después, reporte de auditoría y versión adoptada por INA/UI. |
| Consolidar memoria y evaluador | Etapa 2 — consolidar motores y memoria bajo INA | Contratos compartidos, identidad estable, resultados prospectivos congelados, pruebas de append-only/no-leakage y estado de evidencia. |
| Construir investigador automático | Etapa 2 y Etapa 4 | Orquestación reproducible que consume INA, registra hipótesis/configuración, ejecuta sólo análisis elegibles y conserva hallazgos negativos. |
| Acumular y evaluar evidencia prospectiva | Etapa 5 — centro de predicción; más el evaluador | Ledger durable, pronósticos congelados antes del resultado, resolución exacta, baseline, cobertura, auditoría de continuidad y resultados acumulados. |
| Terminar dashboard y documentar puesta en marcha | Etapa 3 y Etapa 6 | Cada visual ligada a motor/artefacto/versión/corte, interfaz de predicción respaldada por INA, guía de inicio y checklist operativo. |

## 4. Reglas antiguas que deben considerarse supersedidas

El roadmap v1 y la auditoría de runners del 26-11-2026 describían ingestión manual, sin polling ni descargas. Esto ya no describe la rama actual: `.github/workflows/tris-live-prospective.yml` contiene un cron horario que consulta Pakin, valida el CSV, genera snapshot/manifiesto y publica el histórico canónico.

La regla de investigación sigue vigente: **ningún dato no validado entra al histórico**. La automatización cambia el transporte, no los controles:
- Capturar URL, hora, hash y snapshot.
- Validar esquema, dígitos, duplicados, secuencia y prefijo.
- Detener o poner en cuarentena ante alteraciones.
- Mantener `ID` fuera del modelo.
- No convertir histórico retrospectivo en resultados prospectivos.
- Hacer que todas las vistas consuman la misma versión identificada.

## 5. Estado del dato canónico observado en esta auditoría

Lectura de `data/canonical/source-manifest.json` en la rama auditada:

| Campo | Valor |
|---|---|
| Fuente | `https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv` |
| Captura registrada | `2026-11-28T03:53:47.557Z` |
| Concursos | 25,975 |
| Rango | 11033–37007 |
| Fecha del primer registro | 2007-09-03 |
| Fecha del último registro | 2026-11-27 |
| Snapshot | `Tris-37007-e77a3ef65259.csv` |
| SHA-256 | `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6` |

Estos valores describen el manifiesto versionado leído, no una garantía de que Pakin no haya publicado una actualización posterior. La verificación de contenido y la ejecución del ciclo corresponden a P0.3/P4.

## 6. Bloqueos y secuencia corregida

1. **P0.3 — Baseline técnico y workflows:** obtener el estado real de las ejecuciones recientes, ejecutar/confirmar lint, suite de tests y build; separar workflows sintéticos, históricos y prospectivos.
2. **P1 — INA Core:** crear contratos versionados `DatasetSnapshot`, `DatasetVersion`, `InaContext`, `ResearchOutput`, `EvidenceStatus`, procedencia y registro de dependencias.
3. **P2 — Consolidación:** migrar cálculos dispersos, memorias y evaluadores sin cambiar el comportamiento validado; preservar resultados y ledgers.
4. **P3 — Integración visual:** completar una matriz por módulo con motor, runner, artefacto, componente, filtros, estado de evidencia y tests; conectar gráficas sólo a salidas reales.
5. **P4 — Propagación automática:** comprobar el ciclo Pakin → snapshot → validación → base canónica → INA → módulos → ledger → dashboard, con la misma versión visible.
6. **P5 — Predicción:** exponer pronóstico congelado respaldado por INA y sus límites, sin afirmar certeza ni ventaja no demostrada.
7. **P6 — Cierre del programa 120:** auditoría final, guía de instalación/operación, procedimiento de recuperación y criterios de mantenimiento.

## 7. Criterios de aceptación del programa 120

El programa no se declara cerrado hasta demostrar:
- [ ] Un histórico canónico y una única versión compartida.
- [ ] INA Core funcional, probado y dueño del contexto observado.
- [ ] Motores de investigación registrados y con estado de evidencia.
- [ ] Memoria/evaluador con persistencia durable, append-only y no-backfill.
- [ ] Investigador automático reproducible y gobernado.
- [ ] Ciclo real de actualización validado extremo a extremo.
- [ ] Evidencia prospectiva acumulada con pronósticos congelados y baseline.
- [ ] Cada visual muestra exactamente la salida de su motor, versión y corte.
- [ ] Dashboard operativo y predicción respaldada por INA.
- [ ] Documentación de instalación, actualización, recuperación y auditoría.

## 8. Cierre de P0.2

- [x] Se confirma que la rama contiene fases 0–13, no sólo las fases 0–6.
- [x] Se distingue el programa conversacional «fase 120» de las fases analíticas.
- [x] Se relaciona cada fase con motores/ejecuciones y su estado real conocido.
- [x] Se actualiza la regla de ingestión manual a automatización validada, sin relajar integridad.
- [x] Se fija el manifiesto canónico observado como punto de referencia auditable.
- [ ] P0.3: revisar ejecuciones recientes y cerrar baseline técnico.
