# Checkpoint 02 — Integración funcional de datos y cambios

**Proyecto:** TRIS Analytics  
**Rama:** `research-core-v1`  
**Fecha:** 2026-11-27  
**Estado:** criterio obligatorio de arquitectura; implementación por etapas.

## Principio rector

Ningún dato nuevo, resultado, variable, parámetro, hipótesis o cambio experimental puede permanecer aislado. Todo elemento que se incorpore al proyecto debe tener una ruta funcional, verificable y trazable hacia:

1. la base histórica canónica;
2. los motores analíticos que dependan de ese dato;
3. las evaluaciones retrospectivas y prospectivas que correspondan;
4. los módulos visuales que deban representarlo;
5. el registro de procedencia, versión y estado de validación.

Registrar un dato no equivale a integrarlo. Mostrar un dato en pantalla no equivale a conectarlo al análisis.

## Fuente canónica y contrato de datos

- Fuente autorizada del histórico: `https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv`.
- Clave del sorteo: `CONCURSO`.
- Variables del resultado: `R1` a `R5`, preservadas como cinco dígitos independientes (incluidos ceros iniciales).
- La columna `ID` queda excluida de la lógica predictiva y de las claves analíticas.
- Cada captura debe conservar fecha de consulta, URL, huella SHA-256, rango de concursos, cantidad de filas y nombre del snapshot inmutable.
- Un CSV con errores o huecos de concursos no se integra silenciosamente. Se rechaza o queda en cuarentena con diagnóstico visible.

## Flujo obligatorio de integración

```text
Fuente oficial
    ↓
Captura + snapshot inmutable + manifiesto
    ↓
Validación de esquema, dígitos, duplicados, secuencia y fechas
    ↓
Base histórica canónica (append-only; correcciones explícitas y auditadas)
    ↓
Evento de actualización con versión, rango y huella
    ├── Motores descriptivos y posicionales
    ├── Motores de investigación e hipótesis
    ├── Evaluadores retrospectivos / walk-forward
    ├── Registro prospectivo y evaluación de resultados
    ├── Pronóstico del siguiente sorteo
    └── Dashboard, gráficos, tablas, filtros y alertas
             ↓
       Auditoría de consistencia entre módulos
```

La actualización debe ser idempotente: procesar dos veces el mismo snapshot no duplica sorteos, observaciones, ciclos ni resultados. Las nuevas filas se agregan por `CONCURSO`; las filas históricas ya procesadas se comparan por huella y cualquier modificación inesperada detiene la integración para revisión.

## Contrato entre base, lógica y visualización

Cada módulo consumidor debe declarar:

- campos de entrada y su procedencia;
- versión o huella del dataset que utilizó;
- fecha y concurso máximo de corte;
- ventana, parámetros y filtros activos;
- función de cálculo y versión del motor;
- salida estructurada que alimenta tanto el análisis como la interfaz;
- estado de evidencia: descriptivo, exploratorio, en validación, prospectivo o aceptado experimentalmente;
- pruebas que verifican la actualización cuando cambia la base.

La interfaz no debe mantener fórmulas paralelas ni datos manuales que contradigan el motor. Gráficas, tarjetas, tablas y rankings deben derivarse de las mismas salidas estructuradas. Al cambiar la ventana o los filtros, se recalcula la vista desde esa salida/dataset, sin alterar el histórico ni las predicciones ya congeladas.

## Tratamiento de cambios experimentales

Un cambio de método, variable, ventana, umbral o regla debe registrarse como una versión experimental separada. Antes de aparecer como parte del pronóstico principal debe:

1. declarar hipótesis y métrica de éxito antes de evaluarse;
2. ejecutar pruebas unitarias y de integridad;
3. comparar contra baseline y controles pertinentes;
4. evaluar cronológicamente sin fuga de futuro;
5. registrar resultados prospectivos sin reescribir pronósticos congelados;
6. actualizar su ficha visual con parámetros, muestra, resultado y limitaciones.

Un cambio experimental puede mostrarse en el laboratorio con su etiqueta de estado, pero no debe mezclarse silenciosamente con el pronóstico operativo.

## Matriz mínima de propagación

| Evento | Base | Motor analítico | Evaluación | Dashboard |
|---|---|---|---|---|
| Nuevo sorteo validado | Append y nueva versión | Recalcular dependencias | Resolver pronóstico congelado y registrar resultado | Actualizar histórico, métricas y próximo sorteo |
| Corrección de un sorteo anterior | Cuarentena y corrección auditada | Reprocesamiento versionado | Marcar comparaciones afectadas; no sobrescribir evidencia | Mostrar revisión y diferencia |
| Nueva variable | Contrato y procedencia | Integrar solo en módulos declarados | Prueba temporal y control | Gráfico/tabla/filtro conectado |
| Cambio de ventana o umbral | No modifica filas base | Nueva configuración versionada | Sensibilidad y comparación | Selector visible con parámetros |
| Nueva hipótesis | Registro versionado | Motor experimental separado | Retrospectiva y prospectiva | Laboratorio con estado y evidencia |
| Nuevo resultado prospectivo | Ledger append-only | Actualizar métricas de desempeño | Auditoría de cobertura y aciertos | Curvas, tablas y resumen de desempeño |

## Auditoría de integración: criterios de aceptación

Una integración no se considera terminada hasta demostrar:

- [ ] El nuevo snapshot pasa validación y su procedencia es visible.
- [ ] La base canónica contiene el nuevo rango sin duplicados ni huecos no explicados.
- [ ] Todos los módulos declarados como dependientes reportan la misma versión/huella y corte.
- [ ] Los módulos no dependientes declaran explícitamente que no requieren ese dato.
- [ ] Las salidas analíticas cambian de forma reproducible cuando el dato debe afectarlas.
- [ ] La interfaz muestra esas salidas reales y sus filtros cambian los resultados esperados.
- [ ] Los pronósticos congelados antes del sorteo permanecen inmutables.
- [ ] El resultado nuevo se incorpora al ledger prospectivo una sola vez y se evalúa contra la predicción previa.
- [ ] Repetir la misma actualización no duplica ni altera registros.
- [ ] Pruebas, build y workflows relevantes concluyen satisfactoriamente.

## Observación del estado actual

La rama ya cuenta con piezas importantes: adaptador CSV, validador, sincronización incremental con huella del prefijo, snapshots oficiales inmutables, ciclos prospectivos append-only, evaluadores y dashboard. Sin embargo, estas piezas no constituyen por sí solas una garantía de propagación integral: el dashboard permite importar CSV y ledger por separado, y los workflows históricos y prospectivos consumen artefactos/snapshots distintos.

Por tanto, el siguiente trabajo técnico debe cerrar el puente entre esas piezas: una actualización identificable del dataset debe activar o invalidar explícitamente todos los consumidores que dependan de ella, y el dashboard debe exponer la misma versión de datos que generó las salidas analíticas. No se debe declarar integración completa hasta pasar la auditoría anterior.

## Regla permanente

**No se acepta ningún módulo huérfano.** Si se incorpora un dato o cambio y no se puede responder qué parte de la base lo contiene, qué motor lo procesa, qué evaluación lo valida y qué representación visual lo presenta (o por qué no aplica), la integración está incompleta.
