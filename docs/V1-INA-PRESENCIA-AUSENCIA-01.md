# V1 — INA presencia, ausencia e intervalos por posición

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Estado:** implementación inicial integrada; validación CI y reconciliación final pendientes.

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

## Pruebas

`src/research/ina-absence.test.ts` cubre un ejemplo determinista con intervalo conocido, timeline limitado, histórico vacío y corto, límites de parámetros y rechazo de snapshot inválido.

## Salvaguardas

La ausencia no implica que un dígito esté “debido”. Los intervalos completos no son esperas actuales; las tasas condicionadas no son probabilidades independientes ni pronósticos. Toda promoción de hipótesis requerirá validación cronológica, holdout y evidencia prospectiva separada.

## Criterios pendientes de cierre

- [ ] TypeScript, pruebas unitarias y build verdes en el mismo HEAD que integra motor, registry y UI.
- [ ] Workflows de investigación y real-history terminados en éxito.
- [ ] Reconciliación numérica motor↔UI con `Tris-37007-e77a3ef65259.csv` (25,975 sorteos, corte 37007, SHA-256 `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6`).
- [ ] Revisar denominadores, censura de intervalos, histórico vacío/corto y funcionamiento de selectores.
- [ ] Actualizar matriz y checklist con commits y resultados finales.