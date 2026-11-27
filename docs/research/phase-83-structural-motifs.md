# Fase 83 — Detección de patrones estructurales recurrentes

## Objetivo
Identificar configuraciones topológicas que reaparecen en ventanas cronológicas de paquetes históricos y distinguir recurrencia de cambios en su forma.

## Método
- Orden cronológico por fecha y nombre de paquete.
- Ventanas de 9 a 50 paquetes; el bloque final con menos de 9 se fusiona con el anterior.
- Construcción independiente de la red por ventana; solo aristas `supported`.
- Enumeración de todas las combinaciones únicas de tres nodos (tríadas).
- Clasificación no dirigida por número de aristas: sin conexiones, una conexión, cadena abierta (dos conexiones) y triángulo cerrado (tres conexiones).
- Recurrencia exacta por identidad del trío (tres identificadores) en dos o más ventanas.
- Comparación adyacente mediante Jaccard de tríos exactos y recuento de tríos compartidos cuya forma cambió.

## Interpretación y límites
Los motivos de tres nodos son descriptores topológicos. No demuestran interacción real, causalidad ni propagación. El recuento incluye combinaciones desconectadas; la tasa por tipo usa todas las combinaciones de tres nodos como denominador. Los resultados dependen de la ventana y del filtrado de asociaciones respaldadas. La recurrencia exige identidad exacta de los tres identificadores; motivos isomorfos con nodos distintos no se cuentan como el mismo trío. El coste de enumeración crece como O(n³), donde n es el número de nodos de cada ventana.
