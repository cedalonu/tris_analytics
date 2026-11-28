# TRIS Analytics — Checklist maestro de control y continuidad

**Versión:** 1.1  
**Fecha:** 2026-11-28 (actualización de control)  
**Rama obligatoria:** `research-core-v1`  
**Documento rector:** `docs/TRIS-MASTER-EXECUTION-PLAN-v2.md`  
**Matriz visual:** `docs/MATRIZ-INVESTIGACION-VISUAL-01.md`

## 1. Regla de uso

Este checklist controla la ejecución del plan aprobado. No sustituye el plan maestro ni la matriz: los convierte en tareas verificables.

- [ ] No iniciar una tarea dependiente si su gate anterior no está cerrado.
- [ ] No marcar una tarea como completada por crear código, documentación o una gráfica solamente.
- [ ] Toda tarea completada debe tener commit, archivos, pruebas ejecutadas y evidencia enlazable.
- [ ] Si una prueba falla o no se ejecutó, dejarla abierta y registrar el bloqueo.
- [ ] No cambiar a `main`; todos los cambios se realizan en `research-core-v1`.
- [ ] No inventar datos, métricas, resultados, horarios de captura ni estados de CI.
- [ ] Mantener separados datos descriptivos, exploratorios, retrospectivos, holdout y prospectivos.
- [ ] Preservar los pronósticos congelados y los resultados negativos.

**Definición de completado:** implementación funcional + integración con el flujo real + pruebas relevantes aprobadas + procedencia verificable + documentación actualizada. Cuando un criterio no aplique, debe justificarse explícitamente.

## 2. Control de cada sesión de trabajo

Antes de modificar el repositorio:

- [ ] Confirmar rama actual: `research-core-v1`.
- [ ] Confirmar HEAD y cambios pendientes; no sobrescribir trabajo ajeno.
- [ ] Leer el estado más reciente del plan maestro y de la matriz.
- [ ] Revisar el último workflow aplicable y sus jobs; distinguir `in_progress`, `success` y `failure`.
- [ ] Elegir la siguiente tarea abierta de menor nivel que respete las dependencias.
- [ ] Definir el resultado observable y sus criterios de aceptación antes de codificar.

Al terminar cada tarea:

- [ ] Inspeccionar el diff y confirmar que solo afecta el alcance previsto.
- [ ] Ejecutar pruebas unitarias y de integración relevantes.
- [ ] Ejecutar TypeScript, build y workflows aplicables; esperar su resultado final.
- [ ] Comparar los valores del motor con los presentados en la UI.
- [ ] Verificar corte, hash, muestra, parámetros, versión y estado de evidencia.
- [ ] Actualizar checklist, plan maestro y matriz/checkpoint cuando corresponda.
- [ ] Registrar commit, archivos, pruebas, resultados, limitaciones y siguiente tarea.
- [ ] No cerrar la tarea si queda una discrepancia sin explicar.

## 3. Gates del plan maestro

### G0 — Inventario y línea base

- [x] P0.1 Matriz investigación ↔ implementación ↔ visualización creada.
  - Evidencia: `docs/MATRIZ-INVESTIGACION-VISUAL-01.md`.
- [x] P0.2 Conciliación del roadmap, fases 0–13 y programa 120 documentada.
  - Evidencia: `docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md`.
- [x] P0.3 Línea base de CI documentada con sus límites.
  - Evidencia: `docs/TRIS-CI-BASELINE-AUDIT-01.md`.
- [ ] G0.4 Confirmar que no existen cambios de rama o ejecuciones posteriores que invaliden la línea base antes de iniciar una nueva fase.
  - Control de esta sesión: rama `research-core-v1`, HEAD `68519b956ce4b72dea84a9611a5d480c92dc2a1f`; workflow live run `46167720603` completado `success` (todos sus pasos completados). La comprobación se repite al iniciar cada sesión.

**Gate G0:** inventario, conciliación y línea base documentados. P0.1–P0.3 constan como completados en el plan maestro; G0.4 se comprueba al inicio de cada ciclo, no se considera una tarea histórica cerrada.

### G1 — Contrato y servicio INA

- [x] P1.1 Contratos compartidos de contexto, versión, salida y evidencia.
- [x] P1.2 Servicio INA puro y primeras agregaciones descriptivas.
- [x] P1.3 Registro ejecutable de módulos y dependencias.
- [ ] G1.4 Verificar en las siguientes integraciones que todos los consumidores reutilizan el mismo corte y huella; no crear versiones locales paralelas.

Evidencia base: `src/research/ina-contracts.ts`, `src/research/ina-core.ts`, `src/research/ina-registry.ts` y documentos INA asociados.

### G2 — Migración de motores bajo INA

- [x] P2.1 Resumen posicional.
- [x] P2.2 Frecuencia posicional y mapa de calor.
- [x] P2.3 Recurrencia/aging de combinaciones.
- [x] P2.4 Evaluación walk-forward de pools.
- [x] P2.5 Selección y ranking base de pools.
- [x] P2.6 Comparador experimental aging vs. base, conservando su estado experimental.
- [x] P2.7 Conteos base de transiciones posicionales.
- [ ] P2.8 Estabilidad temporal, entropía y detección de cambios posicionales.
  - [x] Motor INA de estabilidad implementado.
  - [x] Panel de estabilidad/entropía conectado al Centro INA.
  - [x] Pruebas específicas añadidas al repositorio.
  - [ ] Identificar con precisión el comparador heredado del overview y su implementación anterior; no confundir duplicación visual con duplicación de cálculo.
  - [ ] Definir una prueba de equivalencia numérica entre la lógica heredada y `buildInaTransitionStability` para las mismas ventanas y el mismo snapshot.
  - [ ] Solo después de aprobar equivalencia, retirar o sustituir el cálculo heredado sin cambiar resultados.
  - [ ] Auditar ventanas completas/parciales, muestras cortas/vacías, denominadores, umbrales y falsos positivos.
  - [ ] Actualizar documentación con resultados reales y cerrar P2.8 solo tras CI completa.

**Gate G2:** cada migración preserva resultados o documenta diferencias justificadas; no se elimina lógica previa antes de probar equivalencia.

### G3 — Investigación y representación visual

La matriz es la fuente de estado por dominio. No cambiar los estados sin evidencia.

- [ ] V1 Presencia y ausencia: crear salida INA dedicada y vista de timeline/intervalos.
- [ ] V2 Frecuencia posicional: validar denominadores, ventanas, corte/hash y coherencia entre vistas.
- [ ] V3 Recurrencia: confirmar consumo de salidas INA y separar frecuencia, intervalos y aging.
- [ ] V4 Pools posicionales: conectar composición y cobertura por tamaño con walk-forward y baseline.
- [ ] V5 Transiciones: validar equivalencia, persistencia y estabilidad; no interpretar conteos como probabilidades.
- [ ] V6 Regímenes: confirmar montaje, fuentes, cortes y tasa de falsas alarmas.
- [ ] V7 Motivos estructurales: enlazar motor → runner/reporte → vista; añadir controles nulos y validación temporal.
- [ ] V8 Evaluación retrospectiva: índice unificado de reportes con train/test, hash, corte, denominadores y baseline.
- [ ] V9 Evaluación prospectiva: consumir ledger publicado automáticamente y verificar pronósticos congelados.
- [ ] V10 Centro INA integral: catálogo navegable de módulos, hechos, hipótesis, dependencias y estados de evidencia.

Para cada Vn:

- [ ] Motor y función exacta identificados.
- [ ] Salida estructurada y versionada.
- [ ] Componente visual activo y conectado a esa salida.
- [ ] Sin fórmulas locales duplicadas.
- [ ] Filtros e interacciones modifican datos reales.
- [ ] Procedencia y límites visibles.
- [ ] Comparación motor↔UI aprobada.
- [ ] Pruebas relevantes aprobadas.
- [ ] Matriz actualizada con estado y evidencia.

**Gate G3:** no basta con que el gráfico exista; debe ser una representación fiel, navegable y verificable de la salida analítica.

### G4 — Actualización automática y propagación

- [ ] Captura programada de Pakin con URL y hora real de observación.
- [ ] Snapshot inmutable, SHA-256, filas y rango de concursos.
- [ ] Validación de esquema, dígitos, duplicados, continuidad y prefijo histórico.
- [ ] Cuarentena y diagnóstico ante cambios del histórico.
- [ ] Actualización canónica append-only e idempotente.
- [ ] Evento/versionado de dataset compartido con INA.
- [ ] Recalcular o invalidar dependencias afectadas.
- [ ] Resolver el pronóstico del concurso correspondiente sin reescribirlo.
- [ ] Registrar outcome sin duplicados ni backfill artificial.
- [ ] Dashboard consume automáticamente la versión vigente.
- [ ] Reporte de auditoría identifica snapshot, hash, corte, módulos actualizados y fallos.
- [ ] Prueba extremo a extremo demuestra que un nuevo sorteo llega a todos los consumidores.

**Gate G4:** repetir el mismo ciclo no duplica registros; un sorteo nuevo actualiza todas las vistas dependientes; un error de fuente nunca se presenta como actualización exitosa.

### G5 — Centro operativo de predicción

- [ ] Predicción generada exclusivamente con el corte INA disponible antes del sorteo.
- [ ] Mostrar corte, hora, versión, hash, estrategia y parámetros.
- [ ] Mostrar pools/candidatos y señales de soporte/contradicción.
- [ ] Separar estrategia base de experimentos.
- [ ] Mostrar baselines, cobertura, denominadores y nivel de evidencia.
- [ ] No llamar probabilidad a una frecuencia o puntuación no calibrada.
- [ ] Congelar pronóstico antes del resultado con identificador y huella.
- [ ] Prohibir reescritura retroactiva o reconstrucción de pronósticos omitidos.
- [ ] Resolver únicamente cuando el resultado oficial esté disponible.
- [ ] Evaluar prospectivamente contra baseline pareado.

**Gate G5:** el centro de predicción es una salida auditable del trabajo de INA, no una selección arbitraria de números.

### G6 — Auditoría integral y puesta en marcha

- [ ] CSV válido y CSV vacío.
- [ ] Encabezado/esquema incorrecto.
- [ ] Dígitos inválidos, duplicados y huecos.
- [ ] Prefijo histórico modificado.
- [ ] Snapshot repetido e idempotencia.
- [ ] Nuevo sorteo y propagación a todos los consumidores.
- [ ] Corrección histórica en cuarentena.
- [ ] Pronóstico congelado y resolución posterior.
- [ ] Sorteo omitido sin backfill artificial.
- [ ] Hash/corte consistentes entre fuente, INA, motores, evaluación y dashboard.
- [ ] Filtros, navegación y detalle visual verificados.
- [ ] TypeScript, pruebas unitarias, integración y build aprobados.
- [ ] Workflows aplicables terminados en estado satisfactorio.
- [ ] Manual de operación, recuperación y diagnóstico.
- [ ] Reporte final con commits, versiones, evidencias, fallos conocidos y limitaciones.

**Gate G6:** no declarar producción ni cierre integral hasta completar y documentar una ejecución real de extremo a extremo.

## 4. Estados de la matriz visual al crear este checklist

Conteo tomado de la revisión documental v2.0; no representa validación estadística:

| Estado | Cantidad |
|---|---:|
| Implementada y representada | 0 |
| Implementada, pendiente de representación | 1 |
| Representada, pendiente de validación | 8 |
| Experimental | 1 |
| Pendiente de desarrollo | 0 |

- [ ] No elevar estados por apariencia o por existencia de archivos.
- [ ] La primera prioridad visual sigue siendo presencia y ausencia.
- [ ] Los estados solo cambian después de cumplir todos los criterios de cierre de la matriz.

## 5. Registro obligatorio de checkpoints

Añadir una entrada por cada entrega significativa, sin borrar entradas anteriores.

| Fecha | Etapa/tarea | Commit | Archivos/entregables | Pruebas y resultado | Estado | Siguiente paso/bloqueo |
|---|---|---|---|---|---|---|
| 2026-11-28 | P0.1 / matriz visual | `772f5b51683598d4571a2f8b43a2d8ae833d44f8` | `docs/MATRIZ-INVESTIGACION-VISUAL-01.md` | Auditoría documental/estática; no equivale a validación integral de vistas | Entregada; matriz conservadora | Atender presencia/ausencia y brechas MV-01…MV-08 |
| 2026-11-28 | Control G0.4 + auditoría de P2.8 | `68519b956ce4b72dea84a9611a5d480c92dc2a1f` (HEAD verificado antes de esta actualización) | Revisión de rama, checklist, plan, matriz, motores y workflow | Live cycle run `46167720603`: success; pruebas Research core `46128051599`, TRIS research `46128051604` e integración real `46128051633`: success en commit `283a3dcd`. Runs live intermedios cancelados por pushes posteriores; no se cuentan como fallos de pruebas. | P2.8 continúa parcial; no se modifica la lógica heredada sin localizar y comparar su implementación exacta | Identificar el comparador heredado y construir prueba de equivalencia; después cerrar P2.8 y avanzar V1 (presencia/ausencia) |

## 5.1 Próximo bloque de trabajo (sin saltar gates)

**Bloque activo: P2.8 — estabilidad temporal y entropía.**

1. [ ] Localizar el cálculo heredado exacto que el checkpoint de migración identifica como redundante; documentar archivo, función, parámetros y consumidores.
2. [ ] Confirmar si el cálculo heredado y el motor INA miden la misma magnitud. Si no son equivalentes por definición, registrar la diferencia y no forzar una equivalencia artificial.
3. [ ] Crear fixtures deterministas que cubran ventanas completas, ventanas parciales, historial corto y vacío.
4. [ ] Comparar los resultados heredados y los de INA sobre idénticos datos, cortes y parámetros.
5. [ ] Retirar/sustituir solo después de aprobar la equivalencia o documentar explícitamente el cambio metodológico.
6. [ ] Ejecutar suite relevante, TypeScript, build y workflows aplicables; actualizar matriz, plan y este checklist.
7. [ ] Al cerrar P2.8, iniciar V1: presencia/ausencia, con salida INA dedicada y visualización de timeline e intervalos.

**Nota de auditoría:** en la inspección de esta sesión se confirmó que `TrisOpsDashboard.tsx` y `InaCommandCenter.tsx` comparten `transitionOutput` para la red posicional; esto demuestra reutilización de una salida, pero no identifica por sí solo el comparador heredado citado en el documento P2.8. Por ello, la tarea de localizarlo permanece abierta y no se elimina código por conjetura.

## 6. Formato de reporte al usuario

Cada checkpoint se comunicará con esta estructura:

1. **Objetivo:** etapa y tarea exacta del plan.
2. **Implementado:** cambios reales, no intenciones.
3. **Evidencia:** commit, archivos y enlaces.
4. **Pruebas:** comandos/workflows y estado final observado.
5. **Pendiente:** tareas abiertas y limitaciones.
6. **Decisión:** cerrado, parcial o bloqueado, con motivo.
7. **Siguiente paso:** una tarea concreta del checklist.

## 7. Regla de continuidad

Continuar automáticamente con la siguiente tarea aprobada y desbloqueada. Si aparece una decisión que cambia el alcance, compromete datos históricos, modifica la metodología predictiva o contradice una regla permanente, detener solo esa decisión, documentar el conflicto y solicitar aprobación. En los demás casos, avanzar sin reabrir decisiones ya aprobadas.
