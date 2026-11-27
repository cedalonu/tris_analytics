# Fase 91 — Supervivencia y estabilidad de linajes

## Objetivo
Medir continuidad y estabilidad de los linajes a través de ventanas temporales, identificando debilitamientos y recuperaciones descriptivas.

## Método
- Recupera las observaciones de cada linaje desde su genealogía (fase 90).
- Calcula cobertura temporal, racha consecutiva máxima, Jaccard medio entre observaciones consecutivas y densidad media/volatilidad.
- Detecta debilitamiento cuando la densidad cae al menos 0.15 respecto a la observación anterior; recuperación cuando, después de un mínimo detectado, sube al menos 0.15.
- Clasificación heurística: robusta (cobertura ≥75%, racha ≥4 y Jaccard medio ≥0.50); moderada (cobertura ≥40% y racha ≥2); frágil (otros casos con datos); insuficiente (menos de dos observaciones).

## Límites
Los umbrales son criterios operativos, no probabilidades calibradas. El Jaccard se calcula solo entre observaciones consecutivas del linaje. La densidad mide cohesión interna, no probabilidad de acierto ni causalidad. No se pronostican resultados.
