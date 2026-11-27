# Fase 88 — Mapa de comunidades de ciclos estructurales

## Objetivo
Pasar de comparar pares de ciclos a describir su organización colectiva como una red de sincronización.

## Construcción
- Cada episodio de ciclo detectado es un nodo, identificado por tríada, inicio, fin, periodo y secuencia.
- Se incorpora una arista no dirigida cuando el par calculado en la fase 87 alcanza el umbral elegido.
- Los componentes conexos se obtienen mediante recorrido BFS determinista.
- Se conservan nodos sin aristas como comunidades aisladas.

## Métricas
- Tamaño, número de tríadas únicas y número de aristas.
- Densidad: aristas observadas / aristas posibles.
- Sincronía media de los vínculos.
- Grado máximo y nodo central, con desempate por fuerza ponderada y luego identificador.
- Clasificación descriptiva: aislada, pareja, cohesiva (densidad >= 0.5) o dispersa.

## Parámetros y límites
El umbral de vínculo puede ajustarse en la interfaz. El cálculo reutiliza las comparaciones de la fase 87; no vuelve a inferir sincronías. El identificador de episodio evita fusionar ciclos separados de una misma tríada.

Las comunidades representan conectividad bajo una regla heurística, no causalidad, interacción real ni predicción de resultados. Cambian al modificar el tamaño de ventana, el periodo, las repeticiones mínimas o el umbral. La fase es retrospectiva y descriptiva.
