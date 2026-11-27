# Fase 105 — Analizador de evolución de hallazgos TRIS

## Objetivo
Describir la evolución entre capturas de experimentos para campos numéricos de métricas en fases 95–98, agrupados por fase, familia, posición y nombre del campo.

## Uso
1. Generar los informes 95–98 y capturar cada ejecución con Fase102.
2. Importar `reports/structural-motif-experiment-ledger/latest.json` en el dashboard.
3. Abrir «Evolución de hallazgos (Fase 105)» y cargar la carpeta `reports/structural-motif-experiment-ledger/records/`.
4. Filtrar por fase y familia.

## Método
- Ordena las capturas por fecha declarada y runId.
- Extrae campos numéricos finitos de las filas `metrics` (fases 95–96) y `groups` (fases 97–98), identificadas por familia y posición.
- Excluye campos que parecen identificadores, fechas, semillas, índices o tamaños de muestra.
- Calcula observaciones, transiciones ascendentes/descendentes/sin cambio, primer y último valor, cambio neto y rango.
- Solo etiqueta dirección cuando hay al menos tres observaciones. Si hay subidas y bajadas, etiqueta «mixta».
- Señala cuando método, settings o entorno declarados varían entre observaciones.

## Interpretación
«Ascendente» y «descendente» son descripciones numéricas, no «mejor» o «peor». La utilidad de cada métrica depende de su definición original. No se agregan métricas heterogéneas ni se calcula una puntuación global.

## Límites
- La evolución es entre capturas guardadas, no una curva temporal por concurso.
- Los cambios de contexto impiden atribuir una diferencia a una sola causa.
- Los campos numéricos se muestran con su nombre original; no se inventa unidad ni interpretación.
- Snapshots faltantes o no legibles no se imputan.
- Las capturas pueden compartir datos históricos; no son evidencia independiente, predicción de números ganadores ni recomendación de apuesta.

## Pruebas
Cinco pruebas unitarias escritas para dirección ascendente, tendencia mixta, observaciones insuficientes, datos ausentes y cambios de contexto. No se afirma que se hayan ejecutado.
