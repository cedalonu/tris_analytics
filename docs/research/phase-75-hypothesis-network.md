# Fase 75 — Mapa de dependencias y redes de hipótesis

## Objetivo
Representar las asociaciones evaluadas en la Fase 74 como una red legible y auditable.

## Elementos
- Nodo: una hipótesis observada en las relaciones por pares.
- Arista sólida: asociación respaldada por el contraste estadístico y la estabilidad entre mitades.
- Arista discontinua: asociación sugestiva, todavía no respaldada.
- Grosor: magnitud absoluta de la correlación de cambios.
- Tamaño del nodo: grado (número de conexiones).
- Centralidad ponderada: suma de magnitudes absolutas de correlación de las aristas incidentes.
- Componentes: grupos conectados por asociaciones visibles; nodos aislados también se muestran.

## Restricciones
La posición circular es determinista y solo sirve para ordenar la visualización; no codifica secuencia temporal, dirección o causalidad. La red no incluye relaciones inconclusas o insuficientes como aristas, pero mantiene nodos aislados. No se debe interpretar centralidad como valor predictivo ni como influencia causal.

## Validación
La red reutiliza el motor de la Fase 74 y sus permutaciones, umbrales y corrección por búsqueda múltiple. Los recuentos y aristas son derivados, no un segundo test estadístico independiente.
