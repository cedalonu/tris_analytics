# Fase 92 — Validación temporal walk-forward de estructuras

## Objetivo
Medir si la composición de motivos estructurales de una ventana contiene información para anticipar la composición de la ventana cronológica siguiente, sin incorporar información del objetivo en la predicción.

## Diseño
- Orden cronológico por índice de ventana.
- Para cada ventana objetivo t, el pronóstico de referencia inmediata usa exclusivamente las tasas de motivos de t-1.
- La línea base usa el promedio expansivo de las tasas de todas las ventanas anteriores a t.
- El objetivo t se consulta únicamente después de congelar ambos pronósticos, para calcular el error.
- Métrica principal: MAE medio de las cuatro tasas (vacío, una arista, cuña y triángulo).
- Skill relativo: 1 - MAE del último periodo / MAE de la línea base expansiva.
- Estabilidad: skill separado en primera y segunda mitad de objetivos; se marca si es positivo en ambas.

## Control de fuga temporal
La función no utiliza tasas del objetivo ni de ventanas posteriores para formar predicciones. Una prueba agrega ventanas futuras y comprueba que los pronósticos de objetivos previos permanezcan idénticos.

## Alcance y límites
Esta fase valida persistencia de estructuras entre paquetes históricos de investigación. **No evalúa aciertos sobre dígitos ganadores del TRIS**, porque las ventanas de motivos son redes derivadas de paquetes de hipótesis, no una serie de pronósticos de dígitos vinculada uno-a-uno a resultados oficiales. Por tanto, un skill positivo solo indicaría anticipación de composición estructural, no capacidad para predecir sorteos ni ventaja económica.

Las métricas son descriptivas y exploratorias. No corrigen dependencia temporal, selección múltiple ni incertidumbre por tamaño de muestra. Se requieren más ventanas para conclusiones estables.

## Archivos
- `src/research/structural-motif-walk-forward-validation.ts`
- `src/research/structural-motif-walk-forward-validation.test.ts`
- `src/StructuralMotifWalkForwardValidation.tsx`
- Integración en `src/HistoricalComparison.tsx`
