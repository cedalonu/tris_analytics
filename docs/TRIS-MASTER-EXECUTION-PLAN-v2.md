# TRIS Analytics — Plan maestro de desarrollo integral con INA

**Versión:** 2.0  
**Fecha:** 2026-11-27  
**Rama de trabajo:** `research-core-v1`  
**Documento rector:** este plan coordina y amplía `TRIS-DEVELOPMENT-ROADMAP-v1.md`, `INA-NUCLEO-CENTRAL-01.md`, `CHECKPOINT-INTEGRACION-FUNCIONAL-02.md` y `CHECKPOINT-LOGICA-VISUAL-01.md`.

## 1. Objetivo rector

Construir TRIS Analytics como un sistema integral de investigación, memoria, evaluación y representación visual, cuyo núcleo de conocimiento sea INA.

**INA es la autoridad interna sobre toda la evidencia observada y validada del sorteo.** Conoce el histórico disponible, estadísticas, patrones descriptivos, ausencias, recurrencias, transiciones, estructuras, hipótesis, resultados de experimentos y desempeño prospectivo. Se alimenta con cada actualización validada y mantiene el corte temporal exacto de lo que conoce.

INA no conoce el futuro. Toda salida sobre sorteos no realizados es una predicción o hipótesis, nunca un resultado conocido. Su desempeño se mide con evaluaciones cronológicas y prospectivas sin fuga de información.

El objetivo no es acumular módulos aislados. Es lograr que **cada dato, cálculo, hipótesis, evaluación y resultado tenga una ruta funcional y comprobable entre la fuente, INA, los motores, la memoria y su visualización**.

## 2. Reglas permanentes de desarrollo

1. **Una sola verdad histórica:** la base canónica validada es la fuente interna común; ningún módulo crea su propia copia contradictoria.
2. **INA como núcleo:** las áreas consultan contratos y salidas de INA; los laboratorios pueden proponer conocimiento nuevo, pero no alterar la historia ni el predictor principal.
3. **Lógica antes que decoración:** cada gráfico debe derivarse de una salida real del motor analítico. No se aceptan gráficas conceptuales, datos de ejemplo presentados como reales ni indicadores sin denominador.
4. **Trazabilidad obligatoria:** toda cifra debe poder remontarse a fuente, huella, corte, muestra, parámetros y versión del motor.
5. **Cronología estricta:** ninguna evaluación usa información posterior al concurso objetivo. Los pronósticos se congelan antes del resultado.
6. **Evidencia separada por nivel:** descriptivo, exploratorio, retrospectivo, holdout y prospectivo no se mezclan.
7. **No promover por intuición:** un hallazgo no se convierte en predictor ni recibe más peso por verse atractivo en una gráfica.
8. **No borrar resultados negativos:** hipótesis fallidas, señales retiradas y evaluaciones desfavorables permanecen en la memoria.
9. **Integración real:** incorporar una fila, variable o módulo no significa que esté integrado. Debe propagarse a todos sus consumidores declarados.
10. **Sin saltos de fase:** no se abre una fase dependiente hasta que la anterior tenga entregables, pruebas y aceptación documentada.
11. **No declarar CI verde parcialmente:** TypeScript, pruebas relevantes, build y workflows aplicables deben terminar satisfactoriamente.
12. **Rama protegida de trabajo:** desarrollar en `research-core-v1`; no cambiar `main` salvo autorización expresa.

## 3. Datos y autoridad de la fuente

- Fuente oficial configurada: `https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv`.
- Clave cronológica: `CONCURSO`.
- Resultado: cinco dígitos independientes `R1` a `R5`, conservando ceros.
- `ID` se excluye de las claves y de la lógica predictiva. Puede omitirse del modelo por completo.
- `FECHA` se conserva como dato descriptivo sujeto a validación.
- Cada captura conserva URL, hora de captura, SHA-256, cantidad de filas, rango de concursos y snapshot inmutable.
- Duplicados, dígitos inválidos, huecos o cambios en el prefijo histórico requieren diagnóstico y revisión; nunca corrección silenciosa.
- El workflow actual consulta la fuente cada hora en el minuto 25 UTC. La hora del workflow no sustituye la hora real de publicación: el manifiesto debe mostrar cuándo se observó cada actualización.

## 4. Arquitectura objetivo

```text
Pakin / Tris.csv
      │
      ▼
Captura programada + snapshot + manifiesto + SHA-256
      │
      ▼
Validador / cuarentena / auditoría de continuidad
      │
      ▼
BASE CANÓNICA VERSIONADA (append-only)
      │
      ▼
INA CORE — memoria y conocimiento compartido
      ├── catálogo de sorteos y procedencia
      ├── estadísticas globales y por posición
      ├── presencia, ausencia, aging y recurrencia
      ├── pools, cobertura, concentración y dispersión
      ├── transiciones, estructuras y regímenes
      ├── hipótesis, parámetros y experimentos versionados
      ├── evaluación retrospectiva y walk-forward
      ├── pronósticos congelados y ledger prospectivo
      └── estado de evidencia, limitaciones y alertas
                │
        ┌───────┴────────┐
        ▼                ▼
   LABORATORIOS      EVALUADOR
   proponen análisis valida evidencia
        │                │
        └───────┬────────┘
                ▼
       VISTAS DEL DASHBOARD
  gráficas, tablas, redes, filtros, predicción
```

La interfaz es una representación del conocimiento; no es una fuente de verdad ni debe mantener fórmulas paralelas.

## 5. Estado de partida: qué existe y qué falta demostrar

Esta es una lectura de partida basada en los archivos inspeccionados en la rama al redactar el plan. No equivale a una auditoría completa de todos los módulos ni a una aprobación de sus resultados.

| Área | Evidencia de implementación observada | Estado correcto |
|---|---|---|
| Adaptador CSV y validación | `src/research/data-adapter.ts`, `src/research-core.ts` | Existe; falta auditar cobertura de casos límite y ejecución integral |
| Investigación de pools y walk-forward | Núcleo y familias de investigación documentadas en roadmap v1 | Existe trabajo amplio; requiere matriz fase por fase de pruebas/ejecución |
| Memoria prospectiva | Ciclos, outcomes y workflows de GitHub Actions | Existe; falta demostrar recorrido extremo a extremo y persistencia durable |
| Fuente automática | `.github/workflows/tris-live-prospective.yml` con schedule horario | Workflow implementado; falta verificar actualización canónica y propagación a cada consumidor |
| Histórico canónico | `data/canonical/Tris.csv` y manifiesto en el workflow | Publicación automatizada prevista en el workflow; auditar estado real de cada ejecución |
| INA visual | Red INA en el dashboard | Vista parcial; no representa todavía todo el conocimiento central |
| Contrato INA compartido | Documento `INA-NUCLEO-CENTRAL-01.md` | Definido documentalmente; servicio central general aún pendiente |
| Vista descriptiva posicional | `dashboard-overview.ts`, `ResearchSignalOverview.tsx` | Primer motor y vista conectados; requiere integrarse al contrato general de INA |
| Dashboard | `src/TrisOpsDashboard.tsx` | Operativo parcialmente; contiene cálculos locales y estados de datos separados |
| Matriz investigación-visual | No localizada al momento de la inspección | Pendiente de crear |
| Prueba de propagación integral | Checkpoint 02 la define, pero no la da por aprobada | Pendiente de demostrar |

**Regla de honestidad del estado:** “implementado” significa que hay código o documentación; “validado” requiere pruebas ejecutadas; “operativo” requiere flujo real; “aceptado” requiere evidencia y criterios de cierre aprobados.

## 6. Plan maestro por etapas y puertas de control

### Etapa 0 — Congelar el inventario y la línea base

**Objetivo:** conocer con precisión qué se ha construido en el roadmap de investigación previo y qué está realmente conectado al dashboard.

Entregables:
- `docs/MATRIZ-INVESTIGACION-VISUAL-01.md`: cada investigación/fase, hipótesis, motor, funciones, tests, salida estructurada, gráfico actual, faltantes y estado.
- Inventario de las fases 0–13 y de la fase 120 mencionada en el historial del proyecto, conciliando nombres y evitando duplicar o perder trabajo.
- Mapa de dependencias: fuente → motor → salida → evaluación → componente visual.
- Línea base de comandos de pruebas, build y workflows con resultados reales.

Cierre:
- No quedan módulos relevantes sin clasificar.
- Se distingue con precisión código existente, prueba existente, prueba ejecutada y evidencia prospectiva.
- Se identifican cálculos duplicados y visualizaciones huérfanas.

### Etapa 1 — Construir INA Core y su contrato común

**Objetivo:** pasar de una definición conceptual de INA a un servicio central real.

Entregables:
- Tipos compartidos para `DatasetSnapshot`, `DatasetVersion`, `InaContext`, `ResearchOutput`, `EvidenceStatus` y procedencia.
- Servicio puro de INA que recibe el histórico validado y genera un contexto reproducible.
- Identificador de versión/huella y corte `drawCutoff` compartidos por todos los resultados.
- Registro de módulos y dependencias; cada motor declara qué necesita y qué produce.
- Pruebas de determinismo, histórico vacío, límites, datos inválidos y cambio de versión.

Cierre:
- Dos consumidores distintos que reciben el mismo snapshot reportan el mismo corte y huella.
- Ningún módulo inventa su propio estado de versión.
- INA distingue evidencia observada de hipótesis y predicción.

### Etapa 2 — Consolidar motores y memoria bajo INA

**Objetivo:** que los cálculos vivan en motores puros y no duplicados dentro de React.

Orden de integración:
1. Historial, integridad y procedencia.
2. Frecuencia global y por posición.
3. Presencia, ausencia, aging, intervalos y recurrencia.
4. Pools, tamaños, cobertura, diversidad, concentración y dispersión.
5. Transiciones por posición, rezagos, redes y persistencia.
6. Regímenes y cambios de comportamiento.
7. Estructuras, patrones y relaciones entre señales.
8. Memoria de hipótesis, configuraciones y resultados.
9. Evaluación retrospectiva, walk-forward, holdout y prospectiva.

Cada salida debe incluir corte, muestra, parámetros, motor, estado de evidencia y limitaciones. Se preservan las familias y fases ya construidas; la tarea es auditarlas e integrarlas, no rehacerlas sin motivo.

Cierre:
- La UI no calcula por su cuenta métricas ya disponibles en motores.
- Las hipótesis conservan identidad y versión.
- Los resultados negativos y señales retiradas permanecen consultables.

### Etapa 3 — Mimetización lógica-visual: una investigación, una vista verificable

**Objetivo:** eliminar la disparidad entre lo investigado y lo que el usuario puede ver e interpretar.

Por cada fila de la matriz se construye o corrige una vista real:
- Distribuciones: frecuencias, tasas, denominadores y comparación temporal.
- Presencia/ausencia: línea de tiempo, edad actual, distribución de intervalos y referencia.
- Recurrencia: frecuencia de aparición, primer/último sorteo, intervalos y aging.
- Pools: composición, cambios de miembros, cobertura por tamaño y comparación con referencia.
- Concentración/dispersión: mapas por posición, zonas y evolución por ventanas.
- Transiciones: matrices de transición, nodos/aristas con conteos y normalización explícita.
- Regímenes: bandas temporales, persistencia, cambios y falsas alarmas.
- Dependencia entre señales: matrices/grafos estructurales claramente separados de correlación empírica.
- Evaluación: walk-forward por bloques, baseline, cobertura, omisiones y resultados por familia/posición.
- Prospectiva: pronósticos congelados, pendientes, resueltos, aciertos y baseline pareado.
- INA: mapa de conocimiento que conecta hallazgos, fuentes, módulos y estado de evidencia.

Cada visual debe tener filtros funcionales, interacción útil y explicación estadística. Seleccionar una posición, dígito, familia o periodo debe llevar a su detalle y conservar el contexto de corte.

Cierre:
- Cada gráfica se puede rastrear hasta la salida del motor.
- Filtros y controles cambian los datos reales, no solo el aspecto.
- No hay valores ficticios ni gráficas ilustrativas que aparenten ser resultados.
- La vista declara cuando una muestra es insuficiente o una medida no aplica.

### Etapa 4 — Conectar alimentación automática y propagación de INA

**Objetivo:** que cada actualización de Pakin se convierta en una actualización real y consistente del conocimiento y de la interfaz.

Flujo obligatorio:
1. Workflow captura fuente y snapshot.
2. Validador compara esquema, dígitos, duplicados, secuencia y prefijo.
3. Se actualiza la base canónica de forma idempotente.
4. Se genera evento de versión con hash, rango y corte.
5. INA invalida/recalcula únicamente dependencias afectadas.
6. Se resuelve el pronóstico congelado del concurso exacto, si existe.
7. Se registra outcome sin duplicarlo ni reconstruir predicciones omitidas.
8. Se genera contexto nuevo para el siguiente concurso.
9. Dashboard consume la misma versión de INA y muestra hora/corte/frescura.
10. Se guarda reporte de auditoría de la ejecución.

Cierre:
- Una actualización repetida no duplica nada.
- Un sorteo nuevo actualiza todas las vistas dependientes.
- Una corrección histórica se pone en cuarentena y genera revisión.
- Los pronósticos previos permanecen inmutables.
- La falta de fuente o fallo de validación no se disfraza como actualización exitosa.

### Etapa 5 — Centro operativo de predicción

**Objetivo:** que el siguiente sorteo se presente como resultado del trabajo de INA, no como una lista aislada de números.

Contenido:
- Corte histórico exacto y hora de generación.
- Candidatos/pools por posición y estrategia, con parámetros visibles.
- Señales coincidentes y contradictorias.
- Cobertura histórica y prospectiva frente a baselines.
- Nivel de evidencia y soporte de cada método.
- Alertas de integridad, muestra insuficiente o datos atrasados.
- Separación entre método base y laboratorio experimental.
- Pronóstico congelado, identificador, hash y hora para su posterior evaluación.

Cierre:
- No se muestran probabilidades si no existe un modelo probabilístico calibrado.
- No se presenta frecuencia o aging como “número debido”.
- Cada candidato puede rastrearse hasta sus señales y evaluaciones.
- El sorteo futuro se incorpora al ledger solo después de su publicación.

### Etapa 6 — Auditoría integral y puesta en marcha

**Objetivo:** demostrar que el sistema completo opera de forma coherente y repetible.

Pruebas de aceptación:
- CSV válido, CSV vacío, encabezado incorrecto, dígitos inválidos, duplicado, hueco y prefijo modificado.
- Snapshot repetido e idempotencia.
- Nuevo sorteo y actualización de todos los consumidores dependientes.
- Corrección histórica en cuarentena.
- Pronóstico congelado antes del resultado y resolución exacta después.
- Sorteo omitido sin backfill artificial.
- Consistencia de hash/corte entre INA, motores, evaluación y dashboard.
- Filtros de gráficos y navegación a detalle.
- TypeScript, pruebas unitarias, pruebas de integración, build y workflows aplicables.
- Manual de operación, recuperación, diagnóstico y auditoría.

Cierre:
- Reporte reproducible con commits, versiones, resultados de pruebas y limitaciones.
- Instrucciones para ejecutar localmente y comprobar la versión publicada.
- No se declara “producción” hasta validar una ejecución completa con datos reales.

## 7. Contrato obligatorio de cada módulo

Cada módulo tendrá una ficha que responda:

| Campo | Obligatorio |
|---|---|
| Identidad | ID, nombre, versión y responsable funcional |
| Pregunta | Qué estudia y por qué existe |
| Entrada | Fuente, variables y filtros |
| Corte | Concurso máximo, fecha y hash |
| Motor | Función exacta y versión |
| Salida | Esquema estructurado y denominadores |
| Evidencia | Descriptiva, exploratoria, retrospectiva, holdout o prospectiva |
| Visual | Gráfico, tabla, interacción y ruta al detalle |
| Validación | Tests, baseline, limitaciones y posibles sesgos |
| Dependencias | Qué evento obliga a recalcularlo |
| Estado | Pendiente, implementado, probado, validado, operativo o aceptado |

Un módulo sin motor, sin procedencia, sin visualización requerida o sin explicación de por qué no aplica se considera incompleto.

## 8. Ritmo de trabajo y disciplina de continuidad

El desarrollo seguirá siempre esta secuencia:

1. **Inspeccionar:** leer el estado real del repositorio y la última ejecución relevante.
2. **Elegir:** trabajar en el siguiente pendiente del plan, respetando dependencias.
3. **Implementar:** hacer un cambio acotado, completo y coherente.
4. **Probar:** ejecutar o esperar CI; no anticipar resultados.
5. **Auditar:** comparar salida del motor con tabla/gráfica y procedencia.
6. **Documentar:** actualizar matriz, plan, checkpoint y limitaciones.
7. **Cerrar:** registrar commit, archivos, pruebas aprobadas/fallidas y siguiente tarea.
8. **Continuar:** avanzar al siguiente pendiente sin pedir confirmación para cada paso ya aprobado.

Cada checkpoint incluirá:
- etapa y tarea;
- commit(s) y archivos;
- qué quedó realmente implementado;
- pruebas ejecutadas y estado observado;
- qué falta y bloqueos;
- decisión de cierre o razón para no cerrar;
- siguiente tarea concreta.

No se cambiará el estado de una fase por intención, solo por evidencia.

## 9. Orden de ejecución inmediato

La secuencia de trabajo vigente queda fijada así:

- [x] **P0.1** Crear la matriz de investigación y visualización. Evidencia: `docs/MATRIZ-INVESTIGACION-VISUAL-01.md`.
- [x] **P0.2** Conciliar roadmap v1, fases 0–13 y programa 120. Evidencia: `docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md`.
- [x] **P0.3** Obtener línea base real de tests, TypeScript, build y workflows. Evidencia: `docs/TRIS-CI-BASELINE-AUDIT-01.md`; baseline aprobado con límites pendientes explícitos.
- [x] **P1.1** Definir tipos y contrato de versión/contexto de INA. Evidencia: `src/research/ina-contracts.ts`, `src/research/ina-core.test.ts`, `docs/INA-CORE-CONTRACT-01.md`; TypeScript, build y suite de pruebas aprobados en runs 46120444742, 46120444875 y 46120444758.
- [x] **P1.2** Implementar INA Core como servicio puro con los primeros agregados descriptivos y pruebas. Evidencia: `src/research/ina-core.ts`, `src/research/ina-core-service.test.ts`, `docs/INA-CORE-SERVICE-01.md`; TypeScript, build y suite completa aprobados en run 46120748438.
- [x] **P1.3** Registrar módulos consumidores y sus dependencias en un catálogo ejecutable. Evidencia: `src/research/ina-registry.ts`, `src/research/ina-registry.test.ts`, `docs/INA-MODULE-REGISTRY-01.md`; TypeScript, build y suite de pruebas aprobados en runs 46121112729 y 46121112726.
- [ ] **P2** Migrar progresivamente cálculos existentes al núcleo compartido, empezando por los módulos descriptivos y evitando cambiar resultados sin pruebas de equivalencia.
  - [x] **P2.1** Verificar snapshot canónico/local y migrar el resumen posicional a salida INA. Evidencia: `docs/P2-1-POSITION-OVERVIEW-INA-MIGRATION.md`.
  - [x] **P2.2** Migrar el mapa de calor y la tabla de frecuencias R1–R5 a los perfiles posicionales de INA. Evidencia: `docs/P2-2-POSITION-FREQUENCY-INA-MIGRATION.md`.
  - [x] **P2.3** Migrar aging/recurrencia de combinaciones a un motor descriptivo compartido y una salida versionada. Evidencia: `docs/P2-3-COMBINATION-RECURRENCE-INA-MIGRATION.md`.
  - [x] **P2.4** Migrar la evaluación walk-forward de pools a una salida INA versionada, preservando el algoritmo original. Evidencia: `docs/P2-4-INA-POOL-WALKFORWARD-MIGRATION.md`.
  - [ ] **P2.5** Migrar construcción/selección de pools y ranking adaptativo a motores INA; conservar por separado el complemento aging experimental.
- [ ] **P3** Completar las vistas reales de investigación, siguiendo la matriz.
- [ ] **P4** Demostrar propagación automática completa desde Pakin.
- [ ] **P5** Cerrar el centro de predicción respaldado por INA.
- [ ] **P6** Ejecutar auditoría integral y documentar operación.

**P0 completada:** inventario, reconciliación de fases y baseline CI están documentados. La etapa P1 (contratos, servicio central y registro de módulos) está completada y validada. La siguiente tarea activa es **P2: migrar el primer conjunto de cálculos existentes para que consuma INA Core**, continuando con selección de pools y cobertura; después transiciones, memorias y evaluación prospectiva. Los pendientes de ejecución sobre el snapshot actual y la propagación se conservan como gates de P4/P6; no se declaran resueltos por el baseline.

## 10. Criterio final del proyecto

TRIS Analytics estará integralmente desarrollado cuando INA sea la memoria y autoridad común del conocimiento observado; cada módulo analítico esté conectado a ella; cada hallazgo tenga evaluación y representación visual fiel; cada actualización oficial se propague de manera trazable; y la predicción del próximo sorteo pueda auditarse antes y después del resultado.

**La prioridad es la integridad y la evidencia. La interfaz debe hacer visible el trabajo real de INA, no sustituirlo.**
