# Fase 73 — Validación estadística de recurrencias

## Procedimiento
1. Reconstruye las secuencias cronológicas validadas en la Fase 70.
2. Excluye secuencias constantes como candidatas de ciclo.
3. Calcula la cobertura observada para los períodos detectados.
4. Ejecuta permutaciones de cada secuencia, conservando sus frecuencias marginales.
5. En cada permutación registra el máximo de cobertura entre todas las hipótesis, bases y períodos (max-statistic), para ajustar la búsqueda múltiple.
6. Estima p ajustado empírico como (1 + excedencias)/(B + 1).
7. Divide cronológicamente 60/40; el período se selecciona de nuevo usando solo el tramo inicial y se contrasta en el tramo reservado.

## Etiquetas
- Respaldado: p ajustado <= 0.05 y cobertura holdout >= 0.80.
- Débil: p ajustado <= 0.10 o cobertura holdout >= 0.80.
- No concluyente: evaluable, pero sin los criterios anteriores.
- No evaluable: el tramo de entrenamiento/prueba no tiene longitud suficiente.

## Límites
La permutación supone intercambiabilidad condicional de los tokens; autocorrelación, cambios de régimen y observaciones faltantes pueden invalidar esa hipótesis. La corrección max-statistic controla la búsqueda múltiple dentro de las series y opciones incluidas, no sesgos externos de selección. No demuestra causalidad ni capacidad predictiva.
