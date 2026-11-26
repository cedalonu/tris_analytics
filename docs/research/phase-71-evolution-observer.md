# Phase 71 — Observatorio de evolución

Añade clasificación longitudinal descriptiva por candidato: mejora, estable, deterioro, volátil, reaparición e insuficiencia. Calcula presencia, número de observaciones, cambios de clasificación, cambios de dirección y variación del valor resuelto entre primera y última observación.

Reglas: requiere tres observaciones para tendencias; dos cambios de dirección para volatilidad; reaparición cuando vuelve tras una ausencia intermedia. La reaparición tiene precedencia sobre otras etiquetas y volatilidad sobre tendencia direccional. Estas etiquetas son heurísticas descriptivas y no probabilidades, predicciones ni evidencia de ventaja. Los candidatos con menos de tres observaciones quedan insuficientes. La ausencia no se interpola.
