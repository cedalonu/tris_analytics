# Fase 86 — Ciclos de configuración estructural

## Objetivo
Detectar repeticiones de secuencias de tipos estructurales para una misma tríada de nodos a través de ventanas cronológicas.

## Método
- Reutiliza las ventanas construidas por el análisis de motivos estructurales y sus aristas con estado `supported`.
- Sigue la identidad exacta de cada tríada (tres nodos) y su tipo en cada ventana.
- Busca bloques consecutivos repetidos de periodos 2, 3 o 4, con al menos dos repeticiones completas.
- La búsqueda selecciona el periodo más corto que cumple el umbral en cada posición y evita contar de nuevo el mismo tramo ya consumido.
- Una ventana donde la tríada no aparece interrumpe la secuencia; no se interpreta la ausencia como un tipo estructural.
- Los ciclos que llegan a la última ventana se marcan como censurados por el límite del historial.

## Interpretación y límites
El periodo se expresa en ventanas, no en días. El resultado depende del tamaño de ventana, de la red estimada en cada una y de las tríadas disponibles. Una secuencia repetida es un patrón retrospectivo descriptivo, no evidencia de un ciclo determinista, causa, pronóstico ni ventaja para anticipar resultados TRIS.
