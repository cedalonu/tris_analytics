# Fase 109 — Ranking de estabilidad documental TRIS

## Objetivo
Ordenar familias/posiciones por consistencia documental de fases 95–98, persistencia 106 y evolución/contradicciones 108.

## Reglas (sin puntuación ponderada)
- `high-documentary-stability`: al menos tres ejecuciones; las cuatro series 95–98 tienen al menos tres observaciones y cero snapshots faltantes; Fase107 `concordant-support`; las cuatro series de Fase106 `persistent`; Fase108 `stable-labels`; cero transiciones.
- `repeated-but-not-conclusive`: cobertura completa, al menos dos fases persistentes, cero transiciones y cero desacuerdos, pero no se cumplen todos los criterios de la categoría alta.
- `contradictory-or-changing`: desacuerdo entre fases o transiciones desde/hacia etiqueta favorable.
- `context-changed`: cambios declarados de método, configuración o entorno.
- `limited-evidence`: faltantes, snapshots ilegibles o menos de tres observaciones por serie.

Precedencia: contexto cambiado, contradicción/cambio, alta estabilidad, repetición parcial y evidencia limitada. Dentro de cada nivel se ordena por más observaciones, menos desacuerdos y orden alfabético. No hay score ponderado.

## Uso
1. Generar informes 95–98 y registrar ejecuciones con Fase102.
2. Importar `reports/structural-motif-experiment-ledger/latest.json` en el dashboard.
3. Abrir «Ranking de estabilidad (Fase 109)».
4. Cargar `reports/structural-motif-experiment-ledger/records/`.
5. Filtrar por familia y nivel.

## Límites
El orden es una prioridad de revisión documental, no probabilidad de ganar ni capacidad predictiva. Los informes reutilizan el mismo historial y controles; no son evidencia independiente. El volumen de observaciones no equivale a tamaño muestral efectivo independiente. No se recomiendan números ni apuestas.

## Pruebas
Seis pruebas unitarias escritas. No se afirma que se hayan ejecutado.
