# TRIS Analytics — Checklist maestro de control y continuidad

**Versión:** 1.4  
**Fecha:** 2026-11-28 (cierre P2.8 e inicio V1)  
**Rama obligatoria:** `research-core-v1`  
**Documento rector:** `docs/TRIS-MASTER-EXECUTION-PLAN-v2.md`  
**Matriz visual:** `docs/MATRIZ-INVESTIGACION-VISUAL-01.md`

## 1. Regla de uso

Este checklist controla la ejecución del plan aprobado. No sustituye el plan maestro ni la matriz: los convierte en tareas verificables.

- [ ] No iniciar una tarea dependiente si su gate anterior no está cerrado.
- [ ] No marcar una tarea como completada por crear código, documentación o una gráfica solamente.
- [ ] Regla obligatoria investigación→salida→visualización: cada salida analítica debe tener una visualización específica, activa y conectada a esa salida; ninguna investigación se cierra si falta cualquiera de los tres eslabones.
- [ ] Validar que la visualización represente exactamente los datos, parámetros, filtros, denominadores, corte, hash y estado de evidencia de su salida; no aceptar gráficas decorativas ni cálculos UI duplicados.
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
  - [x] Identificar el comparador heredado del overview: top-10 de transiciones en ventanas 50/150/500, con ranking por conteo y desempate por clave.
  - [x] Crear salida INA versionada `research.transition-window-comparison`, distinta del motor de estabilidad 50/50 y entropía.
  - [x] Añadir pruebas de paridad del top-10 y ranking heredado para 0, 1, 49, 50, 149, 150, 499, 500 y 620 sorteos.
  - [x] Sustituir el cálculo inline 50/150/500 por el output INA en la vista general.
  - [x] Sustituir el recálculo inline de matrices 50/50 y entropía en Mapa INA por `stabilityOutput` compartido.
  - [x] Auditar ventanas completas/parciales y muestras cortas/vacías mediante fixtures; confirmar denominadores y límites descriptivos.
  - [x] Confirmar TypeScript, pruebas, build y validación real-histórica completos; registrar equivalencia del motor heredado con sus fixtures y la salida INA.
  - [x] Cerrar P2.8 con workflows exitosos: Research core `46168800004` (2d3ef6d9), TRIS research `46168837028`, real-history `46168837025` y live prospective `46168837068` (07b43362). El job real-history completó 44/44 pasos.
  - [x] Registrar snapshot de auditoría `Tris-2026-11-25.csv`, 25,965 filas, concursos 11033–36997, SHA-256 `c48077fe3f62b6d33029a6f7ae735ac501361cc74d648e714eac3ccedff881b1`.
  - [ ] Repetir la comparación visual/motor con el snapshot canónico vigente `Tris-37007-e77a3ef65259.csv`, 25,975 filas, corte 37007, SHA-256 `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6`.

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

- [ ] Identificar explícitamente la salida analítica que alimenta cada elemento visual (motor → output versionado → componente).
- [ ] Inventariar todas las salidas de la investigación; no dejar outputs huérfanos sin representación ni visualizaciones sin fuente trazable.
- [ ] Verificar paridad motor↔UI para cada métrica, serie, tabla, gráfico, selector e interacción.
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

**Checkpoint de implementación (2026-11-28, actualización posterior al sorteo 37008):**
- [x] Registro central INA que compara outputs con versión, SHA-256, corte y tamaño del snapshot.
- [x] Estados conservadores `current`, `stale`, `missing` y `blocked`.
- [x] Pruebas para outputs frescos, outputs desalineados, outputs ausentes y módulos parcialmente alimentados.
- [x] Runner de auditoría canónica genera resumen de propagación por módulo.
- [x] CI de `ina-propagation-audit`, TypeScript y pruebas de núcleo aprobados (Research core run `46181697012`: success).
- [x] Inventario repetible de los 82 expedientes; el runner verifica presencia documental/visual y deja motor, output, montaje, binding y paridad como `unverified`.
- [x] Auditoría de fase incorporada al ciclo live y publicada en el artefacto/resumen de Actions.
- [ ] Completar adaptadores de evidencia y propagación real de cada output de los 82 expedientes.
- [ ] Conectar índice persistente con dashboard sin importación manual.
- [x] Capturar un nuevo concurso real y ejecutar auditoría INA + inventario de fases: sorteo 37008, corte 37008, 25,976 filas.
- [x] Ciclo live repetido e idempotente en run `46182036283`: corte 37008, `newDrawCount: 0`, checkpoint `matched`, 7 ciclos congelados, 689 señales y 589 resultados resueltos; destino prospectivo 37009.
- [x] Reforzar cargador canónico: manifiesto contra bytes, conteo, concurso inicial/final y fechas de borde; pruebas de rechazo añadidas en `src/research/load-canonical-tris.test.ts`.
- [x] Research core checks run `46182036295`: TypeScript y suite de investigación success. Build/deploy run `46182036297`: success.
- [ ] Demostrar que el nuevo sorteo llega a todos los motores y visualizaciones; el checkpoint actual solo demuestra captura canónica y ejecución de auditorías.
- [ ] Probar cuarentena de corrección retroactiva con fixture controlado y verificar resultado del workflow.
- [ ] Verificar montaje visual y paridad numérica para cada salida.

Evidencia: `src/research/ina-propagation-audit.ts`, `src/research/ina-propagation-audit.test.ts`, `scripts/run-tris-ina-canonical-audit.ts`, `scripts/run-tris-research-phase-audit.ts`, `docs/INA-PROPAGATION-REGISTRY-01.md`.

**Evidencia del ciclo nuevo:** run live `46181725839` success; repetición idempotente y auditoría de fases en run `46182036283` success. Snapshot `Tris-37008-3a7c40e21738.csv`, 25,976 filas, SHA-256 `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`. Inventario: 82 documentos localizados, 20 componentes visuales localizados, 62 sin visual catalogada, 0 conexiones funcionales verificadas y 82 expedientes con estado integral `unverified`.

**Gate G4:** repetir el mismo ciclo no duplica registros; un sorteo nuevo actualiza el histórico canónico y ejecuta auditorías. No declarar propagación completa a todos los consumidores hasta probar motor → output → visualización para cada uno.
 
### Etapa 1 — Adaptador, importación e integridad (checkpoint 2026-11-28)

- [x] Adaptador CSV estricto: esquema obligatorio, comillas, fechas, cinco dígitos, duplicados y huecos; `ID` excluido del modelo.
- [x] Sincronizador incremental: append-only, idempotencia, continuidad y rechazo de prefijos modificados.
- [x] Captura live: fuente Pakin, snapshot direccionado por contenido, manifiesto, hash y auditoría sobre el mismo snapshot.
- [x] Cargador canónico reforzado: coteja bytes, SHA-256, filas, rango de concursos y fechas de borde.
- [x] Pruebas nuevas de metadatos canónicos: commit `886b633e`.
- [x] TypeScript + suite de investigación en Research core run `46182036295`: success.
- [x] Build y despliegue de vista previa en run `46182036297`: success.
- [x] Ciclo live repetido en run `46182036283`: success; corte 37008, sin duplicar concursos, checkpoint `matched`.
- [ ] Validación TRIS research run `46182036294` y real-history run `46182036423`: esperar finalización; no cerrar Etapa 1 antes de sus resultados.
- [ ] Prueba de rechazo de modificación retroactiva a nivel del runner live con fixture controlado; los tests del sincronizador cubren la protección de prefijo, pero aún no el workflow completo.
- [x] Conectar `src/App.tsx` al cargador canónico compartido; caché local solo como fallback visible y advertido si la fuente no se verifica. Commit `a6f29bb7` + corrección `0cf9a450`; CI/build/browser pendientes.

**Estado Etapa 1:** implementación reforzada y checks principales aprobados; cierre integral pendiente de las validaciones largas y de comprobar consumidores heredados.
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
| 2026-11-28 | Control G0.4 + auditoría de P2.8 | `68519b956ce4b72dea84a9611a5d480c92dc2a1f` (HEAD verificado antes de esta actualización) | Revisión de rama, checklist, plan, matriz, motores y workflow | Live cycle run `46167720603`: success; pruebas Research core `46128051599`, TRIS research `46128051604` e integración real `46128051633`: success en commit `283a3dcd`. | P2.8 parcial; siguiente tarea: migrar comparador top-10 de ventanas y probar equivalencia | Identificar comparador heredado y construir prueba de equivalencia |
| 2026-11-28 | P2.8 / migración top-10 + reutilización de estabilidad | `e6706287` → `845b0ca4` → `14bc78c7` → `3719d981` → `46978ea8` → `75f4f066` → `2d3ef6d9` → `07b43362` → `d5523c83` → `49a3e50a` → `9a56c8dc` | Motor INA `ina-transition-window-comparison`, pruebas de paridad, registro, vista general conectada y Mapa INA reutilizando `stabilityOutput`; docs P2.8, checklist y plan actualizados | Research core run `46168800004`: success en `2d3ef6d9`; live cycle run `46168929607`: success en `9a56c8dc`. TRIS research `46168800000` y real-history `46168799988` (2d3ef6d9), además de TRIS research `46168837028` y real-history `46168837025` (07b43362), permanecen en ejecución al registrar este checkpoint. Un error inicial de tipado de fixtures se corrigió antes del run `2d3ef6d9`. | P2.8 parcial; paridad codificada y UI conectada, pendiente CI completa y revisión con snapshot real | Esperar resultados finales de validación, comprobar hash/corte/muestra en UI y cerrar solo con evidencia verde |
| 2026-11-28 | Cierre P2.8 + V1 presencia/ausencia | `f8d8e168c6732f30d2023e5e9215a4fff6c8d086` (HEAD de código V1) | `ina-absence.ts`, `ina-absence.test.ts`, registry, `TrisOpsDashboard.tsx`, `docs/V1-INA-PRESENCIA-AUSENCIA-01.md`, plan, matriz y migración P2.8 | P2.8: Research core `46168800004` success; TRIS research `46168837028` success; real-history `46168837025` success (44/44 pasos); live prospective `46168837068` success. V1 en commit `cbf94425`: TypeScript/build/tests completados en TRIS research `46169599330` (calibración sintética aún ejecutándose al registrar); real-history `46169599289` en curso. | P2.8 cerrado; V1 implementado y pendiente de CI integral y reconciliación con snapshot canónico 37007 | Esperar workflows V1, resolver fallos si aparecen y auditar valores motor↔UI con hash/corte del manifiesto vigente |

## 5.1 Próximo bloque de trabajo (sin saltar gates)

**Bloque activo: V1 — presencia y ausencia.** P2.8 está cerrado por CI y auditoría real-histórica; queda pendiente reconciliar la UI con el snapshot canónico 37007.

1. [x] Localizar el cálculo heredado: top-10 por ventanas móviles 50/150/500 en `TrisOpsDashboard.tsx`.
2. [x] Separar esa magnitud del contraste de dos ventanas 50/50 y entropía; no forzar equivalencia conceptual.
3. [x] Crear fixtures deterministas para 0, 1, 49, 50, 149, 150, 499, 500 y 620 sorteos.
4. [x] Implementar `buildInaTransitionWindowComparison` y prueba de paridad contra el ranking anterior.
5. [x] Conectar la vista general al output INA y reutilizar `stabilityOutput` en el Mapa INA.
6. [x] Completar CI y validación real-histórica; cerrar P2.8 con la evidencia registrada.
7. [x] Iniciar V1: motor `buildInaAbsence`, output `research.positional-absence`, pruebas de intervalos y edge cases, vista timeline/distribución/tasas condicionadas en el panel Posiciones.
8. [ ] Obtener CI verde para V1, auditar motor↔UI con snapshot canónico 37007 y actualizar la matriz con evidencia final.

**Nota de auditoría P2.8:** el comparador heredado 50/150/500 y la estabilidad 50/50 son cálculos distintos. Ambos están ahora en salidas INA separadas y sus consumidores reutilizan las salidas versionadas. La paridad del comparador heredado se cubre con muestras límite; el paquete real-histórico usa el snapshot congelado 2026-11-25, no el snapshot canónico 37007. La comparación visual con este último queda como verificación pendiente explícita.

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


## 5.2 Etapa 1 — Adaptador, importación e integridad (2026-11-28)

**Estado: implementación y pruebas base completadas; cierre de validación ampliada pendiente.**

- [x] Auditar la captura automática existente: `.github/workflows/tris-live-prospective.yml` consulta Pakin cada hora al minuto 25 UTC y también se ejecuta en push/manual.
- [x] Confirmar que `scripts/run-tris-cycles-source.ts` descarga, valida, crea snapshot con SHA-256 y ejecuta ciclo + auditoría sobre el mismo snapshot.
- [x] Endurecer el adaptador CSV: comillas, encabezados requeridos únicos, filas incompletas, fechas inválidas/imposibles, dígitos y duplicados.
- [x] Mantener `CONCURSO` como clave y excluir `ID` del modelo.
- [x] Endurecer el sincronizador incremental: validar registros, fechas, checkpoint y hash; proteger el prefijo histórico.
- [x] Verificar snapshot ya existente contra su SHA-256 y conservar snapshot/manifiesto content-addressed inmutables.
- [x] Ampliar pruebas de adaptador y sincronizador.
- [x] TypeScript, pruebas base y checks de Research Core: run `46179218631`, success, commit `413719a4`.
- [x] Captura live y ciclo/auditoría de fuente: run `46179218559`, success; 25,975 registros, corte 37007, SHA-256 `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6`.
- [x] Build, auditoría INA contra histórico canónico y pruebas de investigación: completados con success dentro del run `46179218581`; calibración sintética final todavía en ejecución al registrar.
- [ ] Cierre del workflow de calibración TRIS research `46179218581`.
- [ ] Cierre del workflow de integración real-histórica `46179218515`.
- [ ] Registrar resultado final de ambas ejecuciones antes de cerrar Etapa 1.

**Evidencia documental:** `docs/TRIS-ADAPTER-IMPORT-INTEGRITY-AUDIT-01.md`.

**Límite:** la ejecución live confirmó el snapshot 37007, pero no incorporó un sorteo nuevo en ese ciclo. La propagación de un nuevo concurso a todos los motores, expedientes y visualizaciones sigue siendo parte de G4/Etapas 2–5; no se declara completada aquí.
