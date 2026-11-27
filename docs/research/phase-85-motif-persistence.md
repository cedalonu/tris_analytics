# Fase 85 — Persistencia y duración de transiciones estructurales

## Objetivo
Distinguir cambios aislados de estados que continúan durante varias ventanas cronológicas.

## Método
- Reutiliza las ventanas y tríadas exactas generadas en la fase 83.
- Para cada identidad de tríada, reconstruye su secuencia de tipo topológico por ventana; la ausencia se representa explícitamente como `null`.
- Detecta episodios de aparición (`null → tipo`), desaparición (`tipo → null`) y reconfiguración (`tipo A → tipo B`).
- Mide la duración como el número de ventanas consecutivas, contando la ventana de destino, en las que el nuevo estado permanece sin cambiar.
- Registra tramos de estabilidad de dos o más ventanas y permite filtrar episodios por categoría y umbral mínimo de persistencia.
- Marca como censurados a la derecha los episodios que continúan hasta la última ventana observada. No se extrapola su duración.

## Indicadores
Por categoría se informa el número de episodios, cuántos alcanzan el umbral seleccionado, duración media y máxima observada. El resumen general incluye tríadas rastreadas, episodios, episodios persistentes y su proporción.

## Límites
La duración se expresa en ventanas, no en tiempo calendario; los tamaños de ventana pueden cambiar. La ausencia de una tríada puede deberse a cambios en los nodos disponibles y no exclusivamente a desaparición de una relación. Los episodios ya activos al inicio del historial no se consideran nuevas transiciones. Los resultados describen continuidad observada, no pronostican persistencia futura ni prueban causalidad.

## Pruebas
Pruebas unitarias para duración de apariciones, reconfiguraciones y desapariciones; tramos estables; y cambios aislados que no alcanzan el umbral. Ejecutar con `npm run test:research` en un entorno con dependencias instaladas.
