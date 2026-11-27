# Fase 106 — Clasificador de persistencia de hallazgos TRIS

## Objetivo
Seguir la persistencia de las etiquetas cualitativas por fase, familia y posición a través de capturas del ledger.

## Esquemas reales
- Fase 95: `metrics[].interpretation`
- Fase 96: `metrics[].interpretation`
- Fase 97: `groups[].conclusion`
- Fase 98: `groups[].classification`

No se mezclan las etiquetas de fases diferentes.

## Reglas
- Persistente: al menos 3 observaciones; etiqueta dominante ≥75%; misma etiqueta en las dos últimas capturas legibles.
- Emergente: etiqueta dominante en las dos últimas capturas legibles, sin cumplir el umbral de persistencia.
- Intermitente: etiqueta dominante ≥60%, pero no se mantiene al final.
- Inestable: ninguna etiqueta alcanza dominancia.
- Ya no reportado: clave previamente presente, ausente en los dos últimos informes legibles. Esto describe ausencia en el reporte, no desaparición del fenómeno.
- Insuficiente: menos de 3 observaciones.
- Incompleto: soporte insuficiente con snapshots ausentes o ilegibles.

Los snapshots ausentes/ilegibles son desconocidos, nunca ausencia de hallazgo. Un JSON legible sin una clave sí se registra como no reportada.

## Uso
1. Generar fases 95–98 y registrar capturas con Fase102.
2. Importar `reports/structural-motif-experiment-ledger/latest.json`.
3. Abrir «Persistencia de hallazgos (Fase 106)».
4. Cargar `reports/structural-motif-experiment-ledger/records/` y filtrar fase/estado.

## Límites
- Persistencia de etiquetas de informes entre ejecuciones, no estabilidad concurso a concurso.
- Cambios de método, settings o entorno se marcan, pero no se atribuyen causalmente.
- Los informes comparten datos históricos; no son evidencia independiente ni predicción de números ganadores.
- No se genera puntuación global, ranking de números ni recomendación de apuesta.

## Pruebas
Seis pruebas unitarias escritas: persistencia, emergencia, intermitencia, ausencia en informes legibles, snapshots desconocidos y cambio de contexto. No se afirma que se hayan ejecutado.
