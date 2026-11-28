# V1 — INA presencia, ausencia e intervalos por posición

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Estado:** motor y vista conectados; validaciones automatizadas ampliadas aprobadas; inspección visual en navegador pendiente.

## Contrato

- Motor: `buildInaAbsence(context, options)` en `src/research/ina-absence.ts`.
- Output INA: `research.positional-absence`.
- Módulo registrado: `positional-absence`; motor `positional-absence-analysis@1.0.0`.
- Consume el contexto INA compartido; no recibe una copia independiente ni crea su propio corte/hash.
- Parámetros iniciales: `maxPriorMisses=20`, `timelineLimit=100` (límites defensivos 100 y 500 respectivamente).

## Métricas y definiciones

- **Apariciones:** conteo del dígito en la posición seleccionada.
- **Tasa observada:** apariciones / sorteos de la muestra.
- **Ausencia actual:** sorteos consecutivos finales sin aparición; cero si aparece en el último sorteo; para histórico vacío vale cero.
- **Intervalo completo:** sorteos sin el dígito estrictamente entre dos apariciones consecutivas.
- **Media, mediana y máximo:** resumen de intervalos completos; excluye tramos censurados al inicio y al final.
- **Retorno condicionado:** oportunidades y retornos observados por longitud de ausencia previa; se muestra denominador y referencia uniforme 10%.
- **Timeline:** presencia/ausencia del dígito en los últimos 100 sorteos.

## Representación inicial

En la sección Análisis por posición (`positions`) se añadió un panel V1 con selectores R1–R5 y dígito 0–9, métricas, timeline, distribución de intervalos y tabla de retorno condicionado. La UI presenta corte, muestra y prefijo SHA-256.

## Pruebas y auditoría de paridad

`src/research/ina-absence.test.ts` cubre un ejemplo determinista con intervalo conocido, timeline limitado, histórico vacío y corto, límites de parámetros y rechazo de snapshot inválido.

El runner `scripts/run-tris-ina-canonical-audit.ts` verifica ahora, sobre el snapshot canónico real, las 50 combinaciones R1–R5 × dígito 0–9 contra `analyzePositionAbsences`: apariciones, tasa, ausencia actual, intervalos completos, denominadores de retorno condicionado y los IDs/estados de los últimos 100 sorteos. También verifica que la vista consuma los cinco campos analíticos y renderice las métricas correspondientes. Esto es paridad de implementación/salida y comprobación estática de binding; no sustituye una inspección de DOM en navegador.

## Salvaguardas

La ausencia no implica que un dígito esté “debido”. Los intervalos completos no son esperas actuales; las tasas condicionadas no son probabilidades independientes ni pronósticos. Toda promoción de hipótesis requerirá validación cronológica, holdout y evidencia prospectiva separada.

## Criterios pendientes de cierre

- [x] TypeScript, pruebas unitarias y build aprobados en TRIS research run `46182720872` y real-history run `46182720859`.
- [x] Workflows de investigación y real-history terminados en éxito.
- [x] Denominadores, censura de intervalos e históricos vacío/corto cubiertos por pruebas unitarias.
- [x] Auditoría real-snapshot ejecutada en live run `46183853597`: 50/50 combinaciones posición/dígito aprobadas y 12/12 comprobaciones de binding de dashboard aprobadas.
- [x] Informe de paridad confirmado sobre corte 37008, 25,976 sorteos, SHA-256 `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`.
- [ ] Inspección visual en navegador: selectores, timeline, distribución y tabla condicionada.
- [ ] Actualizar matriz con resultado del runner y evidencia final.