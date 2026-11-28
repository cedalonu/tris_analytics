# Checkpoint 01 — Desarrollo paralelo de lógica y representación visual

**Proyecto:** TRIS Analytics  
**Rama:** `research-core-v1`  
**Fecha:** 2026-11-27 (checkpoint de trabajo)  
**Estado:** aprobado para adoptar como criterio permanente de desarrollo.

## Decisión

A partir de este checkpoint, cada nueva capacidad de investigación se desarrolla junto con su representación visual. La interfaz no será una capa decorativa posterior: debe exponer los mismos datos, parámetros, filtros y resultados que utiliza el motor analítico.

## Contrato mínimo por módulo

1. **Entrada y procedencia:** fuente, rango histórico, exclusiones y fecha de actualización identificables.
2. **Lógica reproducible:** definición de variables, ventanas, umbrales y reglas de selección documentadas.
3. **Validación:** pruebas de integridad, evaluación temporal sin fuga de futuro y controles adecuados al tipo de hipótesis.
4. **Visualización conectada:** gráficos interactivos, tablas, métricas y filtros alimentados por la salida real del análisis.
5. **Interpretación honesta:** distinguir descriptivo, exploratorio, validado y prospectivo. No mostrar puntuaciones como probabilidades si no están calibradas.
6. **Checkpoint:** código, pruebas, evidencia de ejecución, limitaciones conocidas y criterio explícito para avanzar.

## Estado de la base al iniciar este checkpoint

- Histórico TRIS integrado desde el CSV configurado en el proyecto.
- El identificador del sorteo se excluye como variable predictiva; edad/recencia y frecuencia de combinaciones se tratan como descriptores auxiliares.
- Dashboard INA con red de transiciones, distribuciones posicionales, ventanas temporales y módulos de investigación.
- Evaluación retrospectiva con ventanas temporales y auditoría estricta no solapada.
- Comparación descriptiva de señales seleccionadas contra relaciones de control, emparejada por posición y dirección.
- Registro prospectivo y flujo automatizado de ciclos ya existentes en el proyecto.

## Validación de automatizaciones observada

En la consulta de GitHub Actions del 2026-11-27, los workflows para el commit `a9704b1` aparecieron completados con éxito:

- TRIS real-history integration validation — run 283.
- TRIS research validation — run 839.
- TRIS live prospective cycle — run 74.

Los runs 282/838/73 del commit anterior `c99a8fc` también aparecieron completados con éxito. Estos resultados validan los workflows ejecutados; no equivalen a demostrar capacidad predictiva.

## Checkpoint complementario obligatorio\n\nLa integración funcional y propagación de datos se rige además por [Checkpoint 02 — Integración funcional de datos y cambios](./CHECKPOINT-INTEGRACION-FUNCIONAL-02.md). Ningún módulo se considera completo si el dato o cambio no tiene una ruta comprobable desde la base hasta la lógica, la evaluación y su representación visual (o una justificación explícita de no aplicabilidad).\n\n## Próximo ciclo de trabajo

1. Extraer los cálculos del dashboard que deban compartirse y centralizarlos en módulos analíticos puros cuando corresponda.
2. Definir contratos tipados de entrada/salida para que la UI no replique fórmulas.
3. Incorporar pruebas unitarias y casos de borde para cada motor.
4. Conectar gráficos, tablas y filtros a esos contratos; mostrar ventana, muestra y fecha de corte.
5. Añadir controles de robustez (sensibilidad de umbrales, controles comparativos y, cuando proceda, aleatorización/permutación).
6. Mantener los hallazgos experimentales fuera del pronóstico principal hasta superar criterios predefinidos y acumular evidencia prospectiva.

## Regla de promoción de hipótesis

- **Exploratoria:** patrón observado; sin inferencia predictiva.
- **En validación:** supera evaluación retrospectiva temporal y controles definidos.
- **Prospectiva:** registrada antes del sorteo y evaluada contra resultados posteriores sin modificar reglas retrospectivamente.
- **Aceptada experimentalmente:** evidencia repetida, robusta y superior a referencias predefinidas; puede probarse como componente separado.
- **Rechazada / pausada:** falla, se degrada o no alcanza muestra suficiente.

Ninguna hipótesis se promueve por una gráfica llamativa ni por un único acierto. Toda promoción debe conservar su versión, fecha, datos de corte, métrica y resultado de evaluación.
