# Fase 89 — Evolución temporal de comunidades de ciclos

## Objetivo
Seguir la organización de ciclos estructurales en ventanas cronológicas consecutivas.

## Método
1. Seleccionar episodios activos en cada ventana (inicio <= ventana <= fin).
2. Construir la red con los vínculos de sincronización de la fase 87 que superan el umbral.
3. Obtener componentes conectados con el constructor de comunidades de fase 88.
4. Comparar comunidades adyacentes por identidad exacta de episodios.
5. Registrar nuevas, continuas, divididas, fusionadas y disueltas.

## Indicadores
Comunidades por ventana, ciclos activos, nuevas comunidades, continuidades, divisiones, fusiones, disoluciones, Jaccard de la mejor correspondencia y altas/bajas de ciclos.

## Límites
División y fusión se identifican por solapamiento de miembros entre componentes consecutivos. Son relaciones descriptivas, no causales. Los resultados dependen del tamaño de ventana, detección de ciclos y umbral; no son predicciones.