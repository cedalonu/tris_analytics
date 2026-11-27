# Fase 82 — Estabilidad temporal de las rutas de exposición

## Objetivo
Medir si los pares semilla-destino alcanzables en la simulación estructural de la fase 81 reaparecen en ventanas cronológicas consecutivas.

## Método
- Orden cronológico por fecha y nombre del paquete.
- Ventanas consecutivas de 9 a 50 paquetes; el bloque final con menos de 9 se fusiona con el anterior.
- Cada ventana genera su propia red de hipótesis; se usan exclusivamente aristas clasificadas como `supported`.
- En cada red se ejecuta la exposición estructural con horizonte de 1 a 4 saltos y umbral de exposición configurable.
- Una ruta se identifica por el par ordenado (semilla, destino), no por una trayectoria física específica.
- Se comparan ventanas adyacentes mediante Jaccard de pares alcanzables, conteos de pares persistentes/nuevos/perdidos, Jaccard medio de destinos por semilla y cambio absoluto medio de intensidad para pares persistentes.

## Interpretación y límites
La estabilidad mide recurrencia topológica de relaciones derivadas de los datos disponibles. No demuestra que una perturbación se propague realmente, no establece causalidad y no estima probabilidades ni resultados futuros. Los cambios pueden depender del tamaño de ventana, del umbral de asociaciones respaldadas, del horizonte y del umbral de exposición. La ausencia de un par en una ventana no se interpola. Ventanas vacías en ambos lados tienen Jaccard 1 por coincidencia de conjuntos vacíos, por lo que deben interpretarse junto con el número de pares y de aristas.
