# Fase 74 — Analizador de relaciones entre hipótesis

## Objetivo
Examinar si los cambios de hipótesis co-evolucionan, si existen desfases temporales exploratorios y si hay grupos con comportamiento asociado.

## Datos y alineación
- Ordena los paquetes por fecha.
- Para cada hipótesis calcula el cambio de valor resuelto entre paquetes consecutivos.
- Un par solo usa transiciones donde ambas hipótesis tienen observación en ambos extremos.
- No se imputan ausencias ni se convierten en ceros.

## Estadística
- Correlación de Pearson entre diferencias emparejadas.
- Acuerdo direccional (sube/baja/sin cambio) para facilitar lectura.
- Contraste por permutación: se baraja una serie dentro de cada par para romper la alineación temporal; cada iteración registra el máximo valor absoluto entre todos los pares. El p empírico con corrección max-statistic controla la búsqueda múltiple bajo el nulo de permutabilidad.
- Estabilidad temporal: correlación en primera y segunda mitad; una asociación respaldada requiere mismo signo y magnitud mínima en ambas.
- Desfases de un intervalo se muestran como exploratorios. No se interpretan como causalidad.

## Umbrales
- Mínimo 8 transiciones emparejadas para inferencia.
- Respaldada: p ajustado ≤ 0.05, |r| ≥ 0.50 y estabilidad en ambas mitades (|r| ≥ 0.35).
- Sugestiva: p ajustado ≤ 0.10 y |r| ≥ 0.40.
- Los grupos se forman solo con aristas respaldadas.

## Limitaciones
El test supone intercambiabilidad bajo el nulo; autocorrelación, cambios de régimen, tamaños pequeños, selección previa de hipótesis y paquetes no independientes pueden alterar la interpretación. Los desfases no demuestran que una hipótesis anteceda causalmente a otra. Ningún resultado prueba capacidad de anticipar sorteos TRIS.
